import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { MyContext } from '../../App';
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, fetchDataFromApi, postData } from "../../utils/api";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';

const VITE_APP_PAYPAL_CLIENT_ID = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const FIXED_SHIPPING_FEE = 50000;
const FREE_SHIPPING_THRESHOLD = 1000000;
const addressTypeLabel = {
  Home: "Nhà riêng",
  Office: "Công ty",
};

const formatVnd = (value) => Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const Checkout = () => {

  const [userData, setUserData] = useState(null);
  const [isChecked, setIsChecked] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [totalAmount, setTotalAmount] = useState();
  const [isLoading, setIsloading] = useState(false);
  const [isLoadingPayOS, setIsLoadingPayOS] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [myCoupons, setMyCoupons] = useState([]);
  const context = useContext(MyContext);

  const history = useNavigate();
  const subTotal = Number(totalAmount || 0);
  const shippingFee = subTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FIXED_SHIPPING_FEE;
  const couponDiscount = Number(appliedCoupon?.discountAmount || 0);
  const payableAmount = Math.max(0, subTotal - couponDiscount) + shippingFee;

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserData(context?.userData)
    setSelectedAddress(context?.userData?.address_details[0]?._id);

  }, [context?.userData, userData])


  useEffect(() => {
    setTotalAmount(
      context.cartData?.length !== 0 ?
        context.cartData?.map(item => parseInt(item.price) * item.quantity)
          .reduce((total, value) => total + value, 0) : 0);

    // localStorage.setItem("totalAmount", context.cartData?.length !== 0 ?
    //   context.cartData?.map(item => parseInt(item.price) * item.quantity)
    //     .reduce((total, value) => total + value, 0) : 0)
    //   ?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

  }, [context.cartData])

  useEffect(() => {
    setAppliedCoupon(null);
  }, [subTotal])

  useEffect(() => {
    if (context?.userData) {
      fetchDataFromApi("/api/coupon/my-coupons").then((res) => {
        if (res?.success) {
          const validCoupons = res.coupons.filter(c => {
            if (new Date(c.expiryDate).getTime() < Date.now()) return false;
            if (c.maxUses > 0 && c.usedCount >= c.maxUses) return false;
            if (subTotal < c.minOrder) return false;
            return true;
          });
          setMyCoupons(validCoupons);
        }
      });
    }
  }, [context?.userData, subTotal]);

  useEffect(() => {
    const savedCode = localStorage.getItem("appliedCouponCode");
    if (savedCode && subTotal > 0) {
      localStorage.removeItem("appliedCouponCode");
      setCouponCode(savedCode.toUpperCase());
      
      postData("/api/coupon/validate", {
        code: savedCode,
        orderTotal: subTotal
      }).then((res) => {
        if (res?.error === false) {
          setAppliedCoupon(res);
          context?.alertBox("success", `Tự động áp dụng mã: ${res?.message}`);
        } else {
          setAppliedCoupon(null);
          context?.alertBox("error", res?.message || "Không thể tự động áp dụng mã giảm giá");
        }
      });
    }
  }, [context?.userData, subTotal]);





  useEffect(() => {
    const renderPayPalButtons = () => {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";

      window.paypal
        .Buttons(
          {
            style: {
              shape: 'pill',
            },
            createOrder: async () => {

              // Create order on the server

              const resp = await fetch(
                "https://v6.exchangerate-api.com/v6/8f85eea95dae9336b9ea3ce9/latest/VND"
              );

              const respData = await resp.json();
              var convertedAmount = 0;

              if (respData.result === "success") {
                const usdToVndRate = respData.conversion_rates.USD;
                convertedAmount = (payableAmount * usdToVndRate).toFixed(2);
              }

              const headers = {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, // Include your API key in the Authorization header
                'Content-Type': 'application/json', // Adjust the content type as needed
              }

              const data = {
                userId: context?.userData?._id,
                totalAmount: convertedAmount
              }


              const response = await axios.get(
                VITE_API_URL + `/api/order/create-order-paypal?userId=${data?.userId}&totalAmount=${data?.totalAmount}`, { headers }
              );

              return response?.data?.id; // Return order ID to PayPal

            },
            onApprove: async (data) => {
              onApprovePayment(data);
            },
            onCancel: () => {
              context.alertBox("warning", "Thanh toán đã bị hủy");
            },
            onError: (err) => {
              history("/order/failed");
              console.error("PayPal Checkout onError:", err);
            },
          })
        .render("#paypal-button-container");
    };

    if (window.paypal) {
      renderPayPalButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${VITE_APP_PAYPAL_CLIENT_ID}&disable-funding=card`;
    script.async = true;
    script.onload = renderPayPalButtons;
    document.body.appendChild(script);

    return () => {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
    }
  }, [context?.cartData, context?.userData, selectedAddress, payableAmount]);




  const onApprovePayment = async (data) => {
    const user = context?.userData;

    const info = {
      userId: user?._id,
      products: context?.cartData,
      payment_status: "COMPLETE",
      delivery_address: selectedAddress,
      totalAmount: payableAmount,
      shippingFee: shippingFee,
      couponCode: appliedCoupon?.coupon?.code || "",
      couponDiscount: couponDiscount,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    };


    // Capture order on the server

    const headers = {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`, 
      'Content-Type': 'application/json', 
    }

    const response = await axios.post(
      VITE_API_URL + "/api/order/capture-order-paypal",
      {
        ...info,
        paymentId: data.orderID
      },
      { headers }
    );

    if (response?.data?.success) {
      context.alertBox("success", response?.data?.message);
      history("/order/success");
      deleteData(`/api/cart/emptyCart/${context?.userData?._id}`).then((res) => {
        context?.getCartItems();
      })
      context.alertBox("success", "Đơn hàng đã thanh toán thành công!");
    }

  }


  const editAddress = (id) => {
    context?.setOpenAddressPanel(true);
    context?.setAddressMode("edit");
    context?.setAddressId(id);
  }


  const handleChange = (e, index) => {
    if (e.target.checked) {
      setIsChecked(index);
      setSelectedAddress(e.target.value)
    }
  }

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      context?.alertBox("error", "Vui lòng nhập mã giảm giá");
      return;
    }

    postData("/api/coupon/validate", {
      code: couponCode,
      orderTotal: subTotal
    }).then((res) => {
      if (res?.error === false) {
        setAppliedCoupon(res);
        setCouponCode(res?.coupon?.code || couponCode.toUpperCase());
        context?.alertBox("success", res?.message);
      } else {
        setAppliedCoupon(null);
        context?.alertBox("error", res?.message || "Mã giảm giá không hợp lệ");
      }
    })
  }

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  }






  const cashOnDelivery = () => {

    const user = context?.userData
    setIsloading(true);

    if (userData?.address_details?.length !== 0) {
      const payLoad = {
        userId: user?._id,
        products: context?.cartData,
        paymentId: '',
        payment_status: "CASH ON DELIVERY",
        delivery_address: selectedAddress,
        totalAmt: payableAmount,
        shippingFee: shippingFee,
        couponCode: appliedCoupon?.coupon?.code || "",
        couponDiscount: couponDiscount,
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      };


      postData(`/api/order/create`, payLoad).then((res) => {
        if (res?.error === false) {
          context.alertBox("success", res?.message || "Đơn hàng đã được đặt thành công!");
          deleteData(`/api/cart/emptyCart/${user?._id}`).then(() => {
            context?.getCartItems();
            setIsloading(false);
          });
          history("/order/success");
        } else {
          context.alertBox("error", res?.message || "Đặt hàng thất bại!");
          setIsloading(false);
        }
      }).catch((err) => {
        context.alertBox("error", err?.message || "Lỗi khi xử lý đặt hàng!");
        setIsloading(false);
      });
    } else {
      context.alertBox("error", "Vui lòng thêm địa chỉ");
      setIsloading(false);
    }
  }


  const payWithPayOS = async () => {
      const user = context?.userData;

      if (userData?.address_details?.length === 0 || !selectedAddress) {
        context.alertBox("error", "Vui lòng chọn địa chỉ giao hàng");
        return;
      }

      setIsLoadingPayOS(true);

      try {
        const orderData = {
          userId: user?._id,
          products: context?.cartData,
          delivery_address: selectedAddress,
          totalAmt: payableAmount,
          shippingFee: shippingFee,
          couponCode: appliedCoupon?.coupon?.code || "",
          couponDiscount: couponDiscount,
          date: new Date().toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        };

        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        }


        const response = await axios.post(
          VITE_API_URL + "/api/order/create-order-payos",
          orderData,
          { headers }
        );


        if (response.data.success && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        } else {
          context.alertBox("error", response.data.message || "Failed to create PayOS order");
          setIsLoadingPayOS(false);
        }
      } catch (error) {
        console.error("PayOS Error:", error);
        context.alertBox("error", "Cannot connect to server for payment");
        setIsLoadingPayOS(false);
      }
    }


  return (
    <section className="py-3 lg:py-10 px-3">
      <div>
        <div className="w-full lg:w-[70%] m-auto flex flex-col md:flex-row gap-5">
          <div className="leftCol w-full md:w-[60%]">
            <div className="card bg-white shadow-md p-5 rounded-md w-full">
              <div className="flex items-center justify-between">
                <h2>Chọn địa chỉ giao hàng</h2>
                {
                  userData?.address_details?.length !== 0 &&
                  <Button variant="outlined"
                    onClick={() => {
                      context?.setOpenAddressPanel(true);
                      context?.setAddressMode("add");
                    }} className="btn">
                    <FaPlus />
                    Thêm {context?.windowWidth < 767 ? '' : 'địa chỉ mới'}
                  </Button>
                }

              </div>

              <br />

              <div className="flex flex-col gap-4">


                {
                  userData?.address_details?.length !== 0 ? userData?.address_details?.map((address, index) => {

                    return (
                      <label className={`flex gap-3 p-4 border border-[rgba(0,0,0,0.1)] rounded-md relative ${isChecked === index && 'bg-[#fff2f2]'}`} key={index}>
                        <div>
                          <Radio size="small" onChange={(e) => handleChange(e, index)}
                            checked={isChecked === index} value={address?._id} />
                        </div>
                        <div className="info">
                          <span className="inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md">
                            {addressTypeLabel[address?.addressType] || address?.addressType}
                          </span>
                          <h3>{userData?.name}</h3>
                          <p className="mt-0 mb-0">
                            {address?.address_line1 + " " + address?.city + " " + address?.country + " " + address?.state + " " + address?.landmark + " " + address?.mobile}
                          </p>

   
                          <p className="mb-0 font-[500]">{userData?.mobile || address?.mobile}</p>
                        </div>

                        <Button variant="text" className="!absolute top-[15px] right-[15px]" size="small"
                          onClick={() => editAddress(address?._id)}
                        >Sửa</Button>

                      </label>
                    )
                  })

                    :


                    <>
                      <div className="flex items-center mt-5 justify-between flex-col p-5">
                        <img src="/map.png" width="100" />
                        <h2 className="text-center">Chưa có địa chỉ nào được lưu!</h2>
                        <p className="mt-0">Vui lòng thêm địa chỉ giao hàng.</p>
                        <Button className="btn-org" 
                        onClick={() => {
                          context?.setOpenAddressPanel(true);
                          context?.setAddressMode("add");
                        }}>THÊM ĐỊA CHỈ</Button>
                      </div>
                    </>

                }

              </div>


            </div>
          </div>

          <div className="rightCol w-full  md:w-[40%]">
            <div className="card shadow-md bg-white p-5 rounded-md">
              <h2 className="mb-4">Đơn hàng của bạn</h2>

              <div className="flex items-center justify-between py-3 border-t border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[14px] font-[600]">Sản phẩm</span>
                <span className="text-[14px] font-[600]">Thành tiền</span>
              </div>

              <div className="mb-5 scroll max-h-[250px] overflow-y-scroll overflow-x-hidden pr-2">

                {
                  context?.cartData?.length !== 0 && context?.cartData?.map((item, index) => {
                    return (
                      <div className="flex items-center justify-between py-2" key={index}>
                        <div className="part1 flex items-center gap-3">
                          <div className="img w-[50px] h-[50px] object-cover overflow-hidden rounded-md group cursor-pointer">
                            <img
                              src={item?.image}
                              className="w-full transition-all group-hover:scale-105"
                            />
                          </div>

                          <div className="info">
                            <h4 className="text-[14px]" title={item?.productTitle}>{item?.productTitle?.substr(0, 20) + '...'} </h4>
                            <span className="text-[13px]">SL : {item?.quantity}</span>
                          </div>
                        </div>

                        <span className="text-[14px] font-[500]">{(item?.quantity * item?.price)?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
                      </div>
                    )
                  })
                }



              </div>

              <div className="border-t border-[rgba(0,0,0,0.1)] pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] text-gray-600">Tạm tính</span>
                  <span className="text-[14px] font-[600]">{formatVnd(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] text-gray-600">Phí vận chuyển</span>
                  <span className="text-[14px] font-[600]">{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</span>
                </div>
                {subTotal > 0 && subTotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[12px] text-gray-500 mb-3">
                    Mua thêm {formatVnd(FREE_SHIPPING_THRESHOLD - subTotal)} để được miễn phí vận chuyển.
                  </p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-primary rounded-sm p-3 text-sm uppercase"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={Boolean(appliedCoupon)}
                  />
                  {appliedCoupon ? (
                    <Button className="btn-border !h-[40px] !min-w-max !px-4 whitespace-nowrap" onClick={removeCoupon}>Bỏ</Button>
                  ) : (
                    <Button className="btn-org !h-[40px] !min-w-max !px-4 whitespace-nowrap" onClick={applyCoupon}>Áp dụng</Button>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between mb-2 text-primary">
                    <span className="text-[14px]">Mã {appliedCoupon?.coupon?.code}</span>
                    <span className="text-[14px] font-[600]">-{formatVnd(couponDiscount)}</span>
                  </div>
                )}

                {myCoupons?.length > 0 && !appliedCoupon && (
                  <div className="mb-4 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-[13px] font-[600] mb-2 text-blue-800">Mã giảm giá khả dụng của bạn:</p>
                    <div className="flex flex-wrap gap-2">
                      {myCoupons.map((c, idx) => (
                        <Button 
                          key={idx} 
                          variant="outlined" 
                          size="small" 
                          className="!rounded-md !border-dashed !text-blue-700 !border-blue-400 hover:!bg-blue-100"
                          onClick={() => { 
                            setCouponCode(c.code);
                            postData("/api/coupon/validate", {
                              code: c.code,
                              orderTotal: subTotal
                            }).then((res) => {
                              if (res?.error === false) {
                                setAppliedCoupon(res);
                                context?.alertBox("success", res?.message);
                              } else {
                                setAppliedCoupon(null);
                                context?.alertBox("error", res?.message || "Mã giảm giá không hợp lệ");
                              }
                            });
                          }}
                        >
                          {c.code} (-{c.type === "percent" ? `${c.discount}%` : formatVnd(c.discount)})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[rgba(0,0,0,0.1)] pt-3">
                  <span className="text-[15px] font-[700]">Tổng thanh toán</span>
                  <span className="text-[18px] text-primary font-[700]">{formatVnd(payableAmount)}</span>
                </div>
              </div>

              <div className="flex items-center flex-col gap-3 mb-2">


                <div id="paypal-button-container" className={`${userData?.address_details?.length === 0 ? 'pointer-events-none' : ''}`}></div>
                
                <Button 
                  type="button" 
                  className="!bg-[#0052cc] !text-white hover:!bg-[#003d99] !font-[600] !capitalize btn-lg w-full flex gap-2 items-center" 
                  onClick={payWithPayOS}
                  disabled={isLoadingPayOS || userData?.address_details?.length === 0}
                >
                  {
                    isLoadingPayOS === true ? <CircularProgress size={24} color="inherit" /> :
                      <>
                        <BsFillBagCheckFill className="text-[20px]" />
                        THANH TOÁN QUA MÃ QR (VietQR)
                      </>
                  }
                </Button>


                <Button type="button" className="btn-dark btn-lg w-full flex gap-2 items-center" onClick={cashOnDelivery}>
                  {
                    isLoading === true ? <CircularProgress /> :
                      <>
                        <BsFillBagCheckFill className="text-[20px]" />
                        Thanh toán khi nhận hàng (COD)
                      </>
                  }
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
