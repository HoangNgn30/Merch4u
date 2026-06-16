import React, { useEffect, useRef, useState, useContext } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import { ProductZoom } from "../../components/ProductZoom";
import ProductsSlider from '../../components/ProductsSlider';
import { ProductDetailsComponent } from "../../components/ProductDetails";

import { fetchDataFromApi } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { Reviews } from "./reviews";
import AIRecommendations from "../../components/AIRecommendations";
import { IoHomeOutline } from "react-icons/io5";
import { MyContext } from "../../App";

const fandomColors = {
  "BTS": { primary: "#8b5cf6", primaryHover: "#7c3aed", bgLight: "#f5f3ff", accent: "#a78bfa" }, // Purple
  "BLACKPINK": { primary: "#ec4899", primaryHover: "#db2777", bgLight: "#fdf2f8", accent: "#f472b6" }, // Pink
  "NewJeans": { primary: "#06b6d4", primaryHover: "#0891b2", bgLight: "#ecfeff", accent: "#22d3ee" }, // Cyan
  "IVE": { primary: "#3b82f6", primaryHover: "#2563eb", bgLight: "#eff6ff", accent: "#60a5fa" }, // Blue
  "Stray Kids": { primary: "#ef4444", primaryHover: "#dc2626", bgLight: "#fef2f2", accent: "#f87171" }, // Red
  "Other": { primary: "#ff5252", primaryHover: "#e04848", bgLight: "#fff5f5", accent: "#fb7185" }
};

export const ProductDetails = () => {

  const [activeTab, setActiveTab] = useState(0);
  const [productData, setProductData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [relatedProductData, setRelatedProductData] = useState([]);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const { id } = useParams();
  const context = useContext(MyContext);
  const reviewSec = useRef();

  useEffect(() => {
    fetchDataFromApi(`/api/user/getReviews?productId=${id}`).then((res) => {
      if (res?.error === false) {
        setReviewsCount(res.reviews.length)
      }
    })

  }, [reviewsCount])

  useEffect(() => {
    setIsLoading(true);
    fetchDataFromApi(`/api/product/${id}`).then((res) => {
      if (res?.error === false) {
        setProductData(res?.product);

        fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${res?.product?.subCatId}`).then((res) => {
          if (res?.error === false) {
           const filteredData = res?.products?.filter((item) => item._id !== id);
            setRelatedProductData(filteredData)
          }
        })

        setTimeout(() => {
          setIsLoading(false);
        }, 700);
      }
    })


    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const gotoReviews = () => {
    window.scrollTo({
      top: reviewSec?.current.offsetTop - 170,
      behavior: 'smooth',
    })

    setActiveTab(1)

  }

  const fandom = fandomColors[productData?.catName] || fandomColors["Other"];

  return (
    <div 
      style={{
        "--color-primary": fandom.primary,
        "--color-primary-hover": fandom.primaryHover,
        "--color-bg-light": fandom.bgLight,
        "--color-accent": fandom.accent
      }}
      className="fandom-theme"
    >
      <div className="bg-white border-b border-gray-100">
        <div className="container py-3">
          <div className="max-w-full overflow-x-auto rounded-full border border-gray-100 bg-gray-50/80 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.035)]">
            <Breadcrumbs
              aria-label="breadcrumb"
              separator="›"
              sx={{
                "& .MuiBreadcrumbs-ol": {
                  flexWrap: "nowrap",
                  overflow: "hidden",
                },
                "& .MuiBreadcrumbs-separator": {
                  color: "#cbd5e1",
                  fontSize: "13px",
                  marginLeft: "8px",
                  marginRight: "8px",
                },
                "& .MuiBreadcrumbs-li:last-child": {
                  minWidth: 0,
                  overflow: "hidden",
                },
              }}
            >
              <Link
                to="/"
                className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-[600] text-slate-500 transition-colors hover:text-primary"
              >
                <IoHomeOutline className="text-[15px]" />
                Trang chủ
              </Link>

              <Link
                to="/products"
                className="whitespace-nowrap text-[13px] font-[600] text-slate-500 transition-colors hover:text-primary"
              >
                Sản phẩm
              </Link>

              {productData?.catName && (
                <Link
                  to={productData?.catId ? `/products?catId=${productData.catId}` : "/products"}
                  className="whitespace-nowrap text-[13px] font-[600] text-slate-500 transition-colors hover:text-primary"
                >
                  {productData.catName}
                </Link>
              )}

              {productData?.subCat && (
                <Link
                  to={productData?.subCatId ? `/products?subCatId=${productData.subCatId}` : "/products"}
                  className="whitespace-nowrap text-[13px] font-[600] text-slate-500 transition-colors hover:text-primary"
                >
                  {productData.subCat}
                </Link>
              )}

              {productData?.thirdsubCat && (
                <Link
                  to={productData?.thirdsubCatId ? `/products?thirdLavelCatId=${productData.thirdsubCatId}` : "/products"}
                  className="whitespace-nowrap text-[13px] font-[600] text-slate-500 transition-colors hover:text-primary"
                >
                  {productData.thirdsubCat}
                </Link>
              )}

              <span className="block min-w-0 truncate text-[13px] font-[700] text-slate-800">
                {productData?.name || "Sản phẩm"}
              </span>
            </Breadcrumbs>
          </div>
        </div>
      </div>



      <section className="bg-white py-5">
        {
          isLoading === true ?
            <div className="flex items-center justify-center min-h-[300px]">
              <CircularProgress />
            </div>


            :


            <>
              <div className="container flex gap-8 flex-col lg:flex-row items-start lg:items-center">
                <div className="productZoomContainer w-full lg:w-[40%]">
                  <ProductZoom images={productData?.images} />
                </div>

                <div className="productContent w-full lg:w-[60%] pr-2 pl-2 lg:pr-10 lg:pl-10">
                  <ProductDetailsComponent item={productData} reviewsCount={reviewsCount} gotoReviews={gotoReviews} />
                </div>
              </div>

              <div className="container pt-12">
                {/* Modern Tabs */}
                <div className="flex items-center gap-6 mb-8 border-b border-gray-100">
                  <button
                    className={`pb-3 px-2 text-[16px] font-[600] transition-all duration-300 relative ${activeTab === 0 ? "text-primary" : "text-gray-500 hover:text-gray-800"}`}
                    onClick={() => setActiveTab(0)}
                  >
                    Mô tả sản phẩm
                    {activeTab === 0 && <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
                  </button>

                  <button
                    className={`pb-3 px-2 text-[16px] font-[600] transition-all duration-300 relative ${activeTab === 1 ? "text-primary" : "text-gray-500 hover:text-gray-800"}`}
                    onClick={() => setActiveTab(1)}
                    ref={reviewSec}
                  >
                    Đánh giá ({reviewsCount})
                    {activeTab === 1 && <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-t-full"></span>}
                  </button>
                </div>

                {/* Tab Content Box */}
                <div className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-50 w-full py-8 px-6 lg:px-10 rounded-[24px]">
                  {activeTab === 0 && (
                    <div className="text-[15px] text-gray-700 leading-relaxed font-medium" style={{ whiteSpace: "pre-wrap" }}>
                      {productData?.description}
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="w-full">
                      {productData?.length !== 0 && <Reviews productId={productData?._id} setReviewsCount={setReviewsCount} />}
                    </div>
                  )}
                </div>
              </div>

              {
                relatedProductData?.length !== 0 &&
                <div className="container pt-14">
                  <h2 className="text-[24px] font-[800] pb-2 text-gray-800">Sản Phẩm Liên Quan</h2>
                  <ProductsSlider items={6} data={relatedProductData}/>
                </div>
              }

              {/* AI Gợi ý cá nhân hóa */}
              <AIRecommendations title="✨ Bạn cũng có thể thích" />


            </>

        }

      </section>

      {/* Sticky Bottom Purchase Bar for Mobile Devices */}
      {showStickyBar && productData && context.windowWidth < 768 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-3 flex items-center justify-between z-[999] shadow-[0_-5px_20px_rgba(0,0,0,0.08)] animate-slide-up">
          <div className="flex items-center gap-2.5 max-w-[65%]">
            <img src={productData.images?.[0]} className="w-10 h-10 object-cover rounded-lg border border-slate-200" alt="" />
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-slate-800 line-clamp-1">
                {productData.name}
              </span>
              <span className="text-[12px] font-bold text-primary">
                {productData.price?.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
          <Button 
            onClick={() => {
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
            className="!bg-gradient-to-r !from-primary !to-orange-500 !text-white !font-bold !text-[12px] !rounded-full !px-5 !py-2.5 !shadow-md hover:!shadow-lg active:scale-95 transition-all"
          >
            MUA NGAY
          </Button>
        </div>
      )}
    </div>
  );
};
