import React, { useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-creative";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { EffectCreative, Navigation, Pagination, Autoplay } from "swiper/modules";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { MyContext } from "../../App";

/**
 * Banner sản phẩm phong cách Weverse
 */
const HomeBannerV2 = (props) => {

  const context = useContext(MyContext);

  const bannerItems = props?.data?.filter(
    (item) => item?.isDisplayOnHomeBanner === true && item?.bannerimages?.length > 0
  ) || [];

  if (bannerItems.length === 0) return null;

  return (
    <div className="homeBannerContainer rounded-xl overflow-hidden relative group h-full">
      <Swiper
        loop={bannerItems.length > 1}
        slidesPerView={1}
        spaceBetween={0}
        effect="creative"
        creativeEffect={{
          prev: {
            shadow: true,
            translate: ["-20%", 0, -1],
            opacity: 0
          },
          next: {
            translate: ["100%", 0, 0],
          },
        }}
        speed={800}
        navigation={{
          prevEl: '.banner-swiper-button-prev',
          nextEl: '.banner-swiper-button-next',
        }}
        pagination={{ 
          type: "fraction", 
          el: ".banner-custom-pagination",
          renderFraction: function (currentClass, totalClass) {
            return '<span class="' + currentClass + '"></span> <span class="mx-1">|</span> <span class="' + totalClass + '"></span> <span class="ml-1">+</span>';
          }
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        modules={[EffectCreative, Navigation, Pagination, Autoplay]}
        className="homeSliderV2 !bg-[#b0b0b0] !pb-0 !h-full" // Using Weverse style gray background
      >
        {bannerItems.map((item, index) => {
          const displayImage = item?.images?.[0] || item?.bannerimages?.[0];

          return (
            <SwiperSlide key={item?._id || index}>
              <Link to={`/product/${item?._id}`} className="block w-full h-full">
                <div className="item w-full flex flex-col lg:flex-row h-full min-h-[100%] p-4 lg:p-8 items-center justify-center gap-6 lg:gap-8">
                  {/* Left Side: White Image Card */}
                  <div className="left flex-shrink-0 w-full lg:w-[45%] flex justify-end">
                    <div className="imageCard w-full max-w-[240px] aspect-[4/5] bg-[#F5F5F0] rounded-2xl p-4 flex items-center justify-center shadow-sm">
                       <img
                        src={displayImage}
                        className="max-h-full w-auto object-contain mix-blend-multiply"
                        alt={item?.name || "Product"}
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Right Side: Info Content */}
                  <div className="right flex-1 flex flex-col justify-center text-left">
                    <h2 className="text-[20px] sm:text-[24px] lg:text-[34px] font-[800] text-[#111] leading-[1.2] tracking-tight mb-2">
                       {item?.name}
                    </h2>
                    
                    <p className="text-[14px] lg:text-[18px] text-[#444] font-[500] mb-6">
                      Đặt trước ngay trên Merch4u Shop!
                    </p>

                    <div className="priceInfo">
                       <span className="text-[18px] lg:text-[24px] font-[700] text-[#000]">
                         {typeof item?.price === "number"
                           ? item.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
                           : ""}
                       </span>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation & Pagination overlaid on the slider container */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
        <button className="banner-swiper-button-prev w-[40px] h-[40px] rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10">
        <button className="banner-swiper-button-next w-[40px] h-[40px] rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Pagination Bar */}
      <div className="absolute bottom-6 right-1/2 translate-x-1/2 lg:right-auto lg:left-[55%] lg:translate-x-0 z-10 flex items-center gap-3">
         {/* Simple Progress line visualization */}
         <div className="w-[100px] h-[3px] bg-black/20 rounded-full overflow-hidden relative hidden lg:block">
            <div className="h-full bg-black/70 w-1/2 absolute left-0 top-0"></div>
         </div>
         {/* Fraction Pagination */}
         <div className="banner-custom-pagination !w-auto !min-w-max inline-flex items-center justify-center px-3 py-1 bg-black/30 text-white rounded-full text-[13px] font-bold tracking-widest backdrop-blur-sm whitespace-nowrap">
         </div>
      </div>
    </div>
  );
};

export default HomeBannerV2;
