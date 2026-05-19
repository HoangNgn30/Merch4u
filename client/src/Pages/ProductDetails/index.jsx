import React, { useEffect, useRef, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import { ProductZoom } from "../../components/ProductZoom";
import ProductsSlider from '../../components/ProductsSlider';
import { ProductDetailsComponent } from "../../components/ProductDetails";

import { fetchDataFromApi } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { Reviews } from "./reviews";
import AIRecommendations from "../../components/AIRecommendations";

export const ProductDetails = () => {

  const [activeTab, setActiveTab] = useState(0);
  const [productData, setProductData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [relatedProductData, setRelatedProductData] = useState([]);

  const { id } = useParams();

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


  const gotoReviews = () => {
    window.scrollTo({
      top: reviewSec?.current.offsetTop - 170,
      behavior: 'smooth',
    })

    setActiveTab(1)

  }

  return (
    <>
      <div className="py-5 hidden">
        <div className="container">
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              underline="hover"
              color="inherit"
              to="/"
              className="link transition !text-[14px]"
            >
              Home
            </Link>
            <Link
              underline="hover"
              color="inherit"
              to="/"
              className="link transition !text-[14px]"
            >
              Fashion
            </Link>

            <Link
              underline="hover"
              color="inherit"
              className="link transition !text-[14px]"
            >
              Cropped Satin Bomber Jacket
            </Link>
          </Breadcrumbs>
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
    </>
  );
};
