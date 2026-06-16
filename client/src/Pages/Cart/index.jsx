import React, { useContext, useEffect, useState } from "react";

import Button from "@mui/material/Button";
import { BsFillBagCheckFill } from "react-icons/bs";
import CartItems from "./cartItems";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import { Link } from "react-router-dom";

const CartPage = () => {

  const [productVariantData, setProductVariantData] = useState([]);

  const context = useContext(MyContext);

  useEffect(() => {

    window.scrollTo(0, 0)

    fetchDataFromApi("/api/product/productVariant/get").then((res) => {
      if (res?.error === false) {
        setProductVariantData(res?.data)
      }
    })

  }, []);




  const selectedSize = (item) => {
    if (item?.size !== "") {
      return item?.size;
    }



  }


  return (
    <section className="section py-4 lg:py-8 pb-10">
      <div className="container w-[80%] max-w-[80%] flex gap-5 flex-col lg:flex-row">
        <div className="leftPart w-full lg:w-[70%]">
          <div className="shadow-md rounded-md bg-white">
            <div className="py-5 px-3 border-b border-[rgba(0,0,0,0.1)]">
              <h2>Giỏ hàng của bạn</h2>
              <p className="mt-0 mb-0">
                Có <span className="font-bold text-primary">{context?.cartData?.length}</span>{" "}
                sản phẩm trong giỏ hàng
              </p>
            </div>

            {

              context?.cartData?.length !== 0 ? context?.cartData?.map((item, index) => {
                return (
                  <CartItems selected={() => selectedSize(item)} qty={item?.quantity} item={item} key={index} productVariantData={productVariantData} />
                )
              })

                :



                <>
                  <>
                    <div className="flex items-center justify-center flex-col py-10 gap-5">
                      <img src="/empty-cart.png" className="w-[150px]" />
                      <h4>Giỏ hàng của bạn đang trống</h4>
                      <Link to="/"><Button className="btn-org">Tiếp tục mua sắm</Button></Link>
                    </div>
                  </>

                </>
            }

          </div>
        </div>

        <div className="rightPart w-full lg:w-[30%]">
          <div className="shadow-md rounded-md bg-white p-5 sticky top-[155px] z-[90]">
            <h3 className="pb-3">Tổng giỏ hàng</h3>
            <hr />

            {(() => {
              const subTotal = context.cartData?.length !== 0 ?
                context.cartData?.map(item => parseInt(item.price) * item.quantity)
                  .reduce((total, value) => total + value, 0) : 0;
              const FIXED_SHIPPING_FEE = 50000;
              const FREE_SHIPPING_THRESHOLD = 1000000;
              const shippingFee = subTotal === 0 || subTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FIXED_SHIPPING_FEE;
              const totalAmount = subTotal + shippingFee;

              return (
                <>
                  <div className="my-3 bg-slate-50 p-3 rounded-xl border border-slate-100/60">
                    {subTotal < FREE_SHIPPING_THRESHOLD ? (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                          Mua thêm <span className="text-[#ff5252] font-bold">{(FREE_SHIPPING_THRESHOLD - subTotal).toLocaleString('vi-VN')}đ</span> để được Freeship!
                        </p>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${(subTotal / FREE_SHIPPING_THRESHOLD) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                          🎉 Đơn hàng của bạn được Freeship!
                        </p>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                  <hr />

                  <p className="flex items-center justify-between">
                    <span className="text-[14px] font-[500]">Tạm tính</span>
                    <span className="text-primary font-bold">
                      {subTotal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </span>
                  </p>

                  <p className="flex items-center justify-between">
                    <span className="text-[14px] font-[500]">Vận chuyển</span>
                    <span className="font-bold">{shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
                  </p>

                  <p className="flex items-center justify-between">
                    <span className="text-[14px] font-[500]">Giao đến</span>
                    <span className="font-bold"><span className="font-bold">{context?.userData?.address_details?.[0]?.country || "Việt Nam"}</span></span>
                  </p>

                  <p className="flex items-center justify-between">
                    <span className="text-[14px] font-[500]">Tổng cộng</span>
                    <span className="text-primary font-bold">
                      {totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </span>
                  </p>
                </>
              );
            })()}

            <br />

            <Link to="/checkout">
              <Button className="btn-org btn-lg w-full flex gap-2">
                <BsFillBagCheckFill className="text-[20px]" /> Thanh toán
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;
