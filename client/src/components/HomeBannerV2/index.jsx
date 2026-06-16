import React, { useContext, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-creative";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { EffectCreative, Navigation, Pagination, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import { MyContext } from "../../App";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Banner sản phẩm phong cách Weverse nâng cấp - Light Theme với ảnh mờ nền
 */
const HomeBannerV2 = (props) => {
  const context = useContext(MyContext);
  const [activeIndex, setActiveIndex] = useState(0);

  const bannerItems = props?.data?.filter(
    (item) => item?.isDisplayOnHomeBanner === true && item?.bannerimages?.length > 0
  ) || [];

  if (bannerItems.length === 0) return null;

  return (
    <div className="homeBannerContainer rounded-3xl overflow-hidden relative group h-full shadow-[0_20px_50px_rgba(15,23,42,0.15)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.22)] border-t border-l border-white/20 border-r border-b border-slate-300/40 transition-all duration-500">
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
            return '<span class="' + currentClass + '"></span> <span class="mx-1">/</span> <span class="' + totalClass + '"></span>';
          }
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        modules={[EffectCreative, Navigation, Pagination, Autoplay]}
        className="homeSliderV2 !bg-[#94a3b8] !pb-0 !h-full relative" 
      >
        {bannerItems.map((item, index) => {
          const displayImage = item?.images?.[0] || item?.bannerimages?.[0];

          return (
            <SwiperSlide key={item?._id || index} className="z-10">
              <Link to={`/product/${item?._id}`} className="block w-full h-full relative z-10">
                <div className="item w-full flex flex-col lg:flex-row h-full min-h-[420px] p-6 lg:p-12 items-center justify-between gap-8 lg:gap-12 relative overflow-hidden">
                  
                  {/* Heavily Blurred Ambient Image Background */}
                  <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
                    <img 
                      src={displayImage} 
                      className={`w-full h-full object-cover filter blur-[50px] opacity-[0.35] transition-all duration-[1500ms] ease-out ${activeIndex === index ? 'scale-125 rotate-0' : 'scale-150 rotate-3'}`} 
                      alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/90 via-slate-300/85 to-slate-400/90" />
                  </div>

                  {/* Floating decorative glowing orbs */}
                  <div className={`absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-primary/15 filter blur-[100px] pointer-events-none z-0 transition-all duration-1000 ${activeIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                  <div className={`absolute bottom-[-10%] right-[10%] w-[300px] h-[300px] rounded-full bg-orange-400/10 filter blur-[90px] pointer-events-none z-0 transition-all duration-1000 ${activeIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />

                  {/* Left Side: White Glass Image Card */}
                  <div className="left flex-shrink-0 w-full lg:w-[45%] flex justify-center lg:justify-end relative z-10">
                    <div className={`imageCard w-full max-w-[260px] lg:max-w-[280px] aspect-[4/5] bg-white/75 backdrop-blur-md border border-white rounded-[32px] p-6 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_60px_rgba(255,82,82,0.15)] transition-all duration-1000 ease-out hover:scale-[1.04] relative group/image ring-8 ring-white/30 ${activeIndex === index ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
                      {/* Glow inside card */}
                      <div className="absolute w-[80%] h-[80%] rounded-full bg-primary/10 filter blur-3xl opacity-30 group-hover/image:opacity-55 transition-opacity duration-500 z-0 pointer-events-none" />
                      
                      <img
                        src={displayImage}
                        className="max-h-full w-auto object-contain mix-blend-multiply drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover/image:scale-[1.08] group-hover/image:-translate-y-2 group-hover/image:rotate-2 relative z-10"
                        alt={item?.name || "Product"}
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Right Side: Info Content */}
                  <div className="right flex-1 flex flex-col justify-center text-left relative z-10">
                    {/* Tags */}
                    <div className={`flex flex-wrap items-center gap-2 mb-4 transition-all duration-700 delay-100 ${activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] lg:text-[11px] font-[700] uppercase tracking-widest w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Pre-Order Now
                      </div>
                      {item?.discount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-[800] uppercase tracking-wider shadow-sm">
                          Tiết kiệm {item.discount}%
                        </span>
                      )}
                    </div>

                    <h2 className={`text-[24px] sm:text-[28px] lg:text-[36px] font-[800] text-slate-950 leading-[1.2] tracking-tight mb-3 hover:text-primary transition-all duration-700 delay-200 line-clamp-2 ${activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      {item?.name}
                    </h2>
                    
                    {item?.description ? (
                      <p className={`text-[13px] lg:text-[14px] text-slate-800/90 font-[500] leading-relaxed max-w-[480px] mb-6 line-clamp-3 transition-all duration-700 delay-300 ${activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {item.description.replace(/<[^>]*>/g, '')}
                      </p>
                    ) : (
                      <p className={`text-[13px] lg:text-[14px] text-slate-800/90 font-[500] leading-relaxed max-w-[480px] mb-6 transition-all duration-700 delay-300 ${activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        Đặt trước ngay hôm nay để nhận những phần quà độc quyền và ưu đãi giới hạn từ Merch4u Shop!
                      </p>
                    )}

                    {/* Price and CTA */}
                    <div className={`flex flex-wrap items-center gap-6 mt-2 transition-all duration-700 delay-500 ${activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      <div className="price-tag">
                        <span className="text-[11px] text-slate-600 block font-bold uppercase tracking-wider mb-0.5">Giá bán lẻ</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[22px] lg:text-[28px] font-[900] text-slate-950 tracking-tight leading-none">
                            {typeof item?.price === "number"
                              ? item.price.toLocaleString("vi-VN") + " đ"
                              : ""}
                          </span>
                          {item?.oldPrice > item?.price && (
                            <span className="text-[13px] lg:text-[15px] font-[500] text-slate-600 line-through">
                              {item.oldPrice.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span className="relative overflow-hidden bg-gradient-to-r from-primary to-[#ff7676] hover:from-[#ff3838] hover:to-[#ff5e5e] text-white font-[700] px-7 py-3.5 rounded-xl transition-all duration-300 shadow-[0_6px_20px_rgba(255,82,82,0.25)] hover:shadow-[0_8px_30px_rgba(255,82,82,0.35)] hover:-translate-y-0.5 active:translate-y-0 text-[13px] flex items-center gap-2 group/btn">
                        {/* Shine reflection */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                        Xem Chi Tiết
                        <FiChevronRight className="text-[16px] transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Glassmorphic Navigation Buttons */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none lg:block hidden">
        <button className="banner-swiper-button-prev w-[46px] h-[46px] rounded-full bg-white/90 hover:bg-primary border border-slate-200/50 flex items-center justify-center text-slate-700 hover:text-white backdrop-blur-md transition-all duration-300 shadow-md hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer">
          <FiChevronLeft size={22} />
        </button>
      </div>

      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none lg:block hidden">
        <button className="banner-swiper-button-next w-[46px] h-[46px] rounded-full bg-white/90 hover:bg-primary border border-slate-200/50 flex items-center justify-center text-slate-700 hover:text-white backdrop-blur-md transition-all duration-300 shadow-md hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer">
          <FiChevronRight size={22} />
        </button>
      </div>

      {/* Pagination Bar */}
      <div className="absolute bottom-6 right-1/2 translate-x-1/2 lg:right-auto lg:left-[55%] lg:translate-x-0 z-20 flex items-center gap-4">
        {/* Animated Progress Line */}
        <div className="w-[100px] h-[4px] bg-slate-300/40 rounded-full overflow-hidden relative hidden lg:block">
          <div 
            className="h-full bg-gradient-to-r from-primary to-[#ff7676] transition-all duration-500 rounded-full"
            style={{ width: `${((activeIndex + 1) / bannerItems.length) * 100}%` }}
          />
        </div>
        
        {/* Fraction Pagination Glass Capsule */}
        <div className="banner-custom-pagination !w-auto !min-w-max inline-flex items-center justify-center px-4 py-1.5 bg-white/80 border border-slate-200/50 text-slate-700 rounded-full text-[12px] font-[700] tracking-widest backdrop-blur-md whitespace-nowrap shadow-sm">
        </div>
      </div>
    </div>
  );
};

export default HomeBannerV2;
