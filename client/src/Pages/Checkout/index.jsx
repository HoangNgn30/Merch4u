import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { MyContext } from '../../App';
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, editData, fetchDataFromApi, postData } from "../../utils/api";
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { GoTriangleDown } from "react-icons/go";
import { IoCloseSharp } from "react-icons/io5";
import { QtyBox } from "../../components/QtyBox";

const VITE_APP_PAYPAL_CLIENT_ID = import.meta.env.VITE_APP_PAYPAL_CLIENT_ID;
const rawApiUrl = import.meta.env.VITE_API_URL;
const VITE_API_URL = rawApiUrl?.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
const FIXED_SHIPPING_FEE = 50000;
const FREE_SHIPPING_THRESHOLD = 1000000;
const addressTypeLabel = {
  Home: "Nhà riêng",
  Office: "Công ty",
};

const formatVnd = (value) => Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const CheckoutCartItem = ({ item, index, updateCartSize, updateCartQty, removeItem }) => {
  const [sizeAnchorEl, setSizeAnchorEl] = useState(null);
  const openSize = Boolean(sizeAnchorEl);
  const [productSizes, setProductSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);

  useEffect(() => {
    if (item?.productId) {
      fetchDataFromApi(`/api/product/${item.productId}`).then((res) => {
        if (res?.product) {
          const sizes = res.product.size || [];
          setProductSizes(sizes.filter(s => s && s.trim() !== ""));
        }
        setLoadingSizes(false);
      });
    } else {
      setLoadingSizes(false);
    }
  }, [item?.productId]);

  const handleClickSize = (event) => {
    setSizeAnchorEl(event.currentTarget);
  };

  const handleCloseSize = (value) => {
    setSizeAnchorEl(null);
    if (value !== null) {
      updateCartSize(item, value);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-[rgba(0,0,0,0.06)] relative group">
      {/* Top row: Image, Title, Delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="img w-[50px] h-[50px] shrink-0 object-cover overflow-hidden rounded-md cursor-pointer border border-gray-100">
            <img
              src={item?.image}
              className="w-full h-full object-cover transition-all group-hover:scale-105"
              alt={item?.productTitle}
            />
          </div>
          <div className="info">
            <h4 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-1 w-[160px] md:w-[180px]" title={item?.productTitle}>
              {item?.productTitle}
            </h4>
            <span className="text-[11px] text-gray-500 font-medium">
              Đơn giá: {Number(item?.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeItem(item?._id)}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors border-none bg-transparent cursor-pointer shrink-0"
          title="Xóa sản phẩm"
        >
          <IoCloseSharp className="text-[18px]" />
        </button>
      </div>

      {/* Bottom row: Variant selector & QtyBox & subtotal */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          {!loadingSizes && productSizes.length > 0 && (
            <>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-[600] h-[30px] px-3.5 rounded-full border-none cursor-pointer transition-all min-w-[55px]"
                onClick={handleClickSize}
              >
                {item?.size || productSizes[0]} <GoTriangleDown className="text-[11px]" />
              </button>

              <Menu
                anchorEl={sizeAnchorEl}
                open={openSize}
                onClose={() => handleCloseSize(null)}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                {productSizes.map((sizeName, idx) => (
                  <MenuItem
                    key={idx}
                    selected={sizeName === item?.size}
                    onClick={() => handleCloseSize(sizeName)}
                    className="text-xs"
                  >
                    {sizeName}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          <div className="w-[100px] h-[30px] shrink-0">
            <QtyBox
              handleSelecteQty={(val) => updateCartQty(item, val)}
              initialQty={item?.quantity}
              maxQty={item?.countInStock || 999}
            />
          </div>
        </div>

        <span className="text-[13px] font-[600] text-gray-800">
          {Number(item?.quantity * item?.price || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
        </span>
      </div>
    </div>
  );
};

const Checkout = () => {

  const [userData, setUserData] = useState(null);
  const [isChecked, setIsChecked] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [isLoadingPayOS, setIsLoadingPayOS] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [myCoupons, setMyCoupons] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const context = useContext(MyContext);

  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const prevCartIdsRef = useRef([]);

  useEffect(() => {
    if (context.cartData) {
      const currentIds = context.cartData.map(item => item._id);
      const prevIds = prevCartIdsRef.current;

      setSelectedItemIds(prevSelected => {
        const stillPresent = prevSelected.filter(id => currentIds.includes(id));
        const brandNew = currentIds.filter(id => !prevIds.includes(id));

        if (prevIds.length === 0 && stillPresent.length === 0) {
          return currentIds;
        }

        return [...stillPresent, ...brandNew];
      });

      prevCartIdsRef.current = currentIds;
    }
  }, [context.cartData]);

  const selectedCartItems = context.cartData?.filter(item => selectedItemIds.includes(item._id)) || [];
  const subTotal = selectedCartItems.reduce((total, item) => total + (parseInt(item.price) * item.quantity), 0);

  const checkoutProducts = selectedCartItems.map(item => ({
    productId: item.productId,
    productTitle: item.productTitle,
    quantity: item.quantity,
    price: item.price,
    image: item.image,
    subTotal: item.price * item.quantity,
    size: item.size || "",
    weight: item.weight || "",
    ram: item.ram || "",
    cartItemId: item._id
  }));

  const history = useNavigate();
  const shippingFee = subTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FIXED_SHIPPING_FEE;
  const couponDiscount = Number(appliedCoupon?.discountAmount || 0);
  const payableAmount = Math.max(0, subTotal - couponDiscount) + shippingFee;

  // Khởi tạo các item trong giỏ được tích chọn mặc định
  useEffect(() => {
    if (context.cartData?.length > 0) {
      const initialSelected = {};
      let updated = false;
      context.cartData.forEach(item => {
        if (selectedItems[item._id] === undefined) {
          initialSelected[item._id] = true;
          updated = true;
        } else {
          initialSelected[item._id] = selectedItems[item._id];
        }
      });
      if (updated) {
        setSelectedItems(prev => ({ ...initialSelected, ...prev }));
      }
    }
  }, [context.cartData]);

  const handleToggleSelect = (id, checked) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const getSelectedProductsPayload = () => {
    return context.cartData
      .filter(item => selectedItems[item._id] === true)
      .map(item => ({
        productId: item.productId,
        productTitle: item.productTitle,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        subTotal: item.price * item.quantity,
        cartItemId: item._id,
        size: item.size || ""
      }));
  };

  const updateCartSize = (item, selectedVal) => {
    const cartObj = {
      _id: item?._id,
      qty: item?.quantity,
      subTotal: item?.price * item?.quantity,
      size: selectedVal,
    };

    fetchDataFromApi(`/api/product/${item?.productId}`).then((res) => {
      const product = res?.product;
      const sizeExists = product?.size?.filter((size) => size?.includes(selectedVal));

      if (sizeExists?.length !== 0) {
        editData("/api/cart/update-qty", cartObj).then((res) => {
          if (res?.data?.error === false) {
            context.alertBox("success", res?.data?.message);
            context?.getCartItems();
          }
        });
      } else {
        context.alertBox("error", `Sản phẩm không có biến thể ${selectedVal}`);
      }
    });
  };

  const updateCartQty = (item, newQty) => {
    const cartObj = {
      _id: item?._id,
      qty: newQty,
      subTotal: item?.price * newQty
    };

    editData("/api/cart/update-qty", cartObj).then((res) => {
      if (res?.data?.error === false) {
        context.alertBox("success", res?.data?.message);
        context?.getCartItems();
      }
    });
  };

  const removeItem = (id) => {
    context?.showConfirmBox(
      "Xóa sản phẩm khỏi giỏ hàng?",
      "Sản phẩm này sẽ được xóa khỏi giỏ hàng của bạn.",
      () => {
        deleteData(`/api/cart/delete-cart-item/${id}`).then((res) => {
          context.alertBox("success", "Đã xóa sản phẩm khỏi giỏ hàng");
          context?.getCartItems();
        });
      }
    );
  };

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
    const queryParams = new URLSearchParams(window.location.search);
    const cancel = queryParams.get("cancel");
    const status = queryParams.get("status");
    const orderCode = queryParams.get("orderCode");

    if (cancel === "true" && status === "CANCELLED" && orderCode) {
      const cancelOrder = async () => {
        try {
          const headers = {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          };
          const response = await axios.put(
            `${VITE_API_URL}/api/order/cancel-by-code/${orderCode}`,
            {},
            { headers }
          );
          if (response?.data?.success) {
            context.alertBox("warning", "Thanh toán PayOS đã bị hủy. Đơn hàng đã được chuyển sang trạng thái đã hủy.");
          } else {
            console.error("Failed to cancel order:", response?.data?.message);
          }
        } catch (err) {
          console.error("Error cancelling order on backend:", err);
        } finally {
          // Clear query params so refresh doesn't trigger cancellation again
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      cancelOrder();
    }
  }, []);





  const onApprovePayment = async (data) => {
    if (selectedCartItems.length === 0) {
      context.alertBox("error", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

    const user = context?.userData;

    const info = {
      userId: user?._id,
      products: checkoutProducts,
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
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        VITE_API_URL + "/api/order/capture-order-paypal",
        {
          ...info,
          paymentId: data.orderID
        },
        { headers }
      );

      if (response?.data?.success) {
        sessionStorage.setItem("orderSuccessMessage", "Đơn hàng đã thanh toán thành công qua PayPal!");
        if (context?.getCartItems) {
          await context.getCartItems();
        }
        history("/order/success?payment=paypal&status=PAID");
      } else {
        context.alertBox("error", response?.data?.message || "Thanh toán PayPal capture thất bại");
      }
    } catch (err) {
      console.error("Error capturing PayPal payment:", err);
      context.alertBox("error", err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi hoàn tất thanh toán PayPal");
    }
  };

  useEffect(() => {
    const renderPayPalButtons = () => {
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
      else return;

      window.paypal
        .Buttons(
          {
            style: {
              shape: 'pill',
            },
            createOrder: async () => {
              if (selectedCartItems.length === 0) {
                context.alertBox("error", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
                throw new Error("No products selected");
              }

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
    if (selectedCartItems.length === 0) {
      context.alertBox("error", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

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
    if (selectedCartItems.length === 0) {
      context.alertBox("error", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

    const user = context?.userData;

    const selectedProds = getSelectedProductsPayload();
    if (selectedProds.length === 0) {
      context.alertBox("error", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

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
        clientUrl: window.location.origin, // URL callback động cho PayOS
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


  if (!context?.cartData || context?.cartData?.length === 0) {
    return (
      <section className="py-10 lg:py-20 px-3 text-center">
        <div className="max-w-[500px] mx-auto bg-white p-8 rounded-2xl shadow-md flex flex-col items-center gap-5">
          <img src="/empty-cart.png" className="w-[120px]" alt="Giỏ hàng trống" />
          <h2 className="text-xl font-bold text-gray-800">Giỏ hàng của bạn đang trống</h2>
          <p className="text-gray-500 text-sm mt-[-10px]">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
          <Button className="btn-org !font-bold !rounded-md !px-6 !py-2 transition-colors" onClick={() => history("/")}>
            Quay lại cửa hàng
          </Button>
        </div>
      </section>
    );
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
                            {[
                              address?.address_line1,
                              address?.city,
                              address?.state,
                              address?.country
                            ].filter(Boolean).join(", ") +
                              (address?.landmark ? ` (${address?.landmark})` : "")}
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

              <div className="mb-5 scroll max-h-[350px] overflow-y-scroll overflow-x-hidden pr-2 flex flex-col gap-1">
                {
                  context?.cartData?.length !== 0 && context?.cartData?.map((item, index) => {
                    return (
                      <CheckoutCartItem
                        key={index}
                        item={item}
                        index={index}
                        updateCartSize={updateCartSize}
                        updateCartQty={updateCartQty}
                        removeItem={removeItem}
                      />
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


                {selectedCartItems.length === 0 ? (
                  <div className="w-full text-center py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-md font-[500] my-2">
                    Vui lòng chọn ít nhất 1 sản phẩm để thanh toán
                  </div>
                ) : (
                  <div id="paypal-button-container" className={`${userData?.address_details?.length === 0 ? 'pointer-events-none' : ''}`}></div>
                )}

                <Button
                  type="button"
                  className="!bg-[#0052cc] !text-white hover:!bg-[#003d99] !font-[600] !capitalize btn-lg w-full flex gap-2 items-center"
                  onClick={payWithPayOS}
                  disabled={isLoadingPayOS || userData?.address_details?.length === 0 || selectedCartItems.length === 0}
                >
                  {
                    isLoadingPayOS === true ? <CircularProgress size={24} color="inherit" /> :
                      <>
                        <BsFillBagCheckFill className="text-[20px]" />
                        THANH TOÁN QUA MÃ QR (VietQR)
                      </>
                  }
                </Button>


                <Button
                  type="button"
                  className="btn-dark btn-lg w-full flex gap-2 items-center"
                  onClick={cashOnDelivery}
                  disabled={isLoading || userData?.address_details?.length === 0 || selectedCartItems.length === 0}
                >
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
