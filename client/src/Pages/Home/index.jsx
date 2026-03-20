import React, { useContext, useEffect, useState } from "react";
import HomeSlider from "../../components/HomeSlider";
import HomeCatSlider from "../../components/HomeCatSlider";
import { LiaShippingFastSolid } from "react-icons/lia";
import AdsBannerSlider from "../../components/AdsBannerSlider";
import AdsBannerSliderV2 from "../../components/AdsBannerSliderV2";
import Header2 from "../../components/Header2";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ProductsSlider from "../../components/ProductsSlider";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import 'swiper/css/free-mode';

import { Navigation, FreeMode } from "swiper/modules";
import BlogItem from "../../components/BlogItem";
import HomeBannerV2 from "../../components/HomeSliderV2";
import BannerBoxV2 from "../../components/bannerBoxV2";
import { fetchDataFromApi } from "../../utils/api";
import { MyContext } from "../../App";
import ProductLoading from "../../components/ProductLoading";
import BannerLoading from "../../components/LoadingSkeleton/bannerLoading";
import { Button } from "@mui/material";
import { MdArrowRightAlt } from "react-icons/md";
import { Link } from "react-router-dom";

const Home = () => {
  const [value, setValue] = useState(0);
  const [homeSlidesData, setHomeSlidesData] = useState([]);
  const [popularProductsData, setPopularProductsData] = useState([]);
  const [productsData, setAllProductsData] = useState([]);
  const [productsBanners, setProductsBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bannerV1Data, setBannerV1Data] = useState([]);
  const [bannerList2Data, setBannerList2Data] = useState([]);
  const [blogData, setBlogData] = useState([]);
  const [randomCatProducts, setRandomCatProducts] = useState([]);


  const context = useContext(MyContext);


  useEffect(() => {

    window.scrollTo(0, 0);

    fetchDataFromApi("/api/homeSlides").then((res) => {
      setHomeSlidesData(res?.data)
    })
    fetchDataFromApi("/api/product/getAllProducts?page=1&limit=12").then((res) => {
      setAllProductsData(res?.products)
    })

    fetchDataFromApi("/api/product/getAllProducts").then((res) => {
      setProductsBanners(res?.products)
    })

    
    fetchDataFromApi("/api/product/getAllFeaturedProducts").then((res) => {
      setFeaturedProducts(res?.products)
    })

    fetchDataFromApi("/api/bannerV1").then((res) => {
      setBannerV1Data(res?.data);
    });

    fetchDataFromApi("/api/bannerList2").then((res) => {
      setBannerList2Data(res?.data);
    });

    fetchDataFromApi("/api/blog").then((res) => {
      setBlogData(res?.blogs);
    });
  }, [])



  useEffect(() => {
    if (context?.catData?.length !== 0) {

      fetchDataFromApi(`/api/product/getAllProductsByCatId/${context?.catData[0]?._id}`).then((res) => {
        if (res?.error === false) {
          setPopularProductsData(res?.products)
        }

      })
    }

    const numbers = new Set();
    const maxUniqueNumbers = Math.min(context?.catData?.length - 1, 8);
    while (numbers.size < maxUniqueNumbers) {
      const number = Math.floor(1 + Math.random() * 8);
      numbers.add(number);
    }


    getRendomProducts(Array.from(numbers), context?.catData)

  }, [context?.catData])



  const getRendomProducts = (arr, catArr) => {

    const filterData = [];

    for (let i = 0; i < arr.length; i++) {
      let catId = catArr[arr[i]]?._id;

      fetchDataFromApi(`/api/product/getAllProductsByCatId/${catId}`).then((res) => {
        filterData.push({
          catName: catArr[arr[i]]?.name,
          data: res?.products
        })

        setRandomCatProducts(filterData)
      })

    }



  }

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const filterByCatId = (id) => {
    setPopularProductsData([])
    fetchDataFromApi(`/api/product/getAllProductsByCatId/${id}`).then((res) => {
      if (res?.error === false) {
        setPopularProductsData(res?.products)
      }

    })
  }



  return (
    <>


      {
        homeSlidesData?.length === 0 && <BannerLoading />
      }

      {/* {
        homeSlidesData?.length !== 0 && <HomeSlider data={homeSlidesData} />
      } */}

      {/* {
        context?.catData?.length !== 0 && <HomeCatSlider data={context?.catData} />
      } */}



      <section className="bg-white py-3 lg:py-8">
        <div className="container">
          <div className="flex items-center justify-between flex-col lg:flex-row">
            <div className="leftSec w-full lg:w-[40%]">
              <h2 className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-[600]">Popular Products</h2>
              <p className="text-[12px] sm:text-[14px] md:text-[13px] lg:text-[14px] font-[400] mt-0 mb-0">
                Do not miss the current offers until the end of March.
              </p>
            </div>

            <div className="rightSec w-full lg:w-[60%]">
              <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example"
              >
                {
                  context?.catData?.length !== 0 && context?.catData?.map((cat, index) => {
                    return (
                      <Tab label={cat?.name} key={index} onClick={() => filterByCatId(cat?._id)} />
                    )
                  })
                }


              </Tabs>
            </div>
          </div>


          <div className="min-h-max lg:min-h-[60vh]">
            {
              popularProductsData?.length === 0 && <ProductLoading />
            }
            {
              popularProductsData?.length !== 0 && <ProductsSlider items={6} data={popularProductsData} />
            }
          </div>

        </div>
      </section>



      <section className="py-6 pt-0 bg-white">
        <div className="container flex flex-col lg:flex-row gap-5">
          <div className="part1 w-full lg:w-[70%]">

            {
              productsBanners?.length > 0 && <HomeBannerV2 data={productsBanners} />
            }


          </div>

          <div className="part2 scrollableBox w-full lg:w-[30%] flex items-center gap-5 justify-between flex-row lg:flex-col">
            <BannerBoxV2 info={bannerV1Data[bannerV1Data?.length - 1]?.alignInfo} image={bannerV1Data[bannerV1Data?.length - 1]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 1]} />

            <BannerBoxV2 info={bannerV1Data[bannerV1Data?.length - 2]?.alignInfo} image={bannerV1Data[bannerV1Data?.length - 2]?.images[0]} item={bannerV1Data[bannerV1Data?.length - 2]} />
          </div>

        </div>
      </section>





      <section className="py-0 lg:py-4 pt-0 lg:pt-8 pb-0 bg-white">
        <div className="container">
          <div className="freeShipping w-full md:w-[80%] m-auto py-4 p-4  border-2 border-[#ff5252] flex items-center justify-center lg:justify-between flex-col lg:flex-row rounded-md mb-7">
            <div className="col1 flex items-center gap-4">
              <LiaShippingFastSolid className="text-[30px] lg:text-[50px]" />
              <span className="text-[16px] lg:text-[20px] font-[600] uppercase">
                Free Shipping{" "}
              </span>
            </div>

            <div className="col2">
              <p className="mb-0 mt-0 font-[500] text-center">
                Free Delivery Now On Your First Order and over $200
              </p>
            </div>

            <p className="font-bold text-[20px] lg:text-[25px]">- Only $200*</p>
          </div>

          {
            bannerV1Data?.length !== 0 && <AdsBannerSliderV2 items={4} data={bannerV1Data} />
          }


        </div>
      </section>

      <section className="py-3 lg:py-2 pt-0 bg-white">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-[600]">Latest Products</h2>
            <Link to="/products">
              <Button className="!bg-gray-100 hover:!bg-gray-200 !text-gray-800 !capitalize !px-3 !border !border-[rgba(0,0,0,0.4)]" size="small" >View All <MdArrowRightAlt size={25} /></Button>
            </Link>
          </div>

          {
            productsData?.length === 0 && <ProductLoading />
          }

          {
            productsData?.length !== 0 && <ProductsSlider items={6} data={productsData} />
          }



        </div>
      </section>
      <section className="py-2 lg:py-0 pt-0 bg-white">
        <div className="container">
          <h2 className="text-[20px] font-[600]">Featured Products</h2>

          {
            featuredProducts?.length === 0 && <ProductLoading />
          }


          {
            featuredProducts?.length !== 0 && <ProductsSlider items={6} data={featuredProducts} />
          }

          {
            bannerList2Data?.length !== 0 && <AdsBannerSlider items={4} data={bannerList2Data} />
          }



        </div>
      </section>



      {
        randomCatProducts?.length !== 0 && randomCatProducts?.map((productRow, index) => {
          if (productRow?.catName !== undefined && productRow?.data?.length !== 0)
            return (
              <section className="py-5 pt-0 bg-white" key={index}>
                <div className="container">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-[600]">{productRow?.catName}</h2>
                    {
                      productRow?.data?.length > 6 &&
                      <Link to={`products?catId=${productRow?.data[0]?.catId}`}>
                        <Button className="!bg-gray-100 hover:!bg-gray-200 !text-gray-800 !capitalize !px-3 !border !border-[rgba(0,0,0,0.4)]" size="small" >View All <MdArrowRightAlt size={25} /></Button>
                      </Link>
                    }

                  </div>




                  {
                    productRow?.data?.length === 0 && <ProductLoading />
                  }

                  {
                    productRow?.data?.length !== 0 && <ProductsSlider items={6} data={productRow?.data} />
                  }



                </div>
              </section>)
        })

      }


      {
        blogData?.length !== 0 &&
        <section className="py-5 pb-8 pt-0 bg-white blogSection">
          <div className="container">
            <h2 className="text-[20px] font-[600] mb-4">From The Blog</h2>
            <Swiper
              slidesPerView={4}
              spaceBetween={30}
              navigation={context?.windowWidth < 992 ? false : true}
              modules={[Navigation, FreeMode]}
              freeMode={true}
              breakpoints={{
                250: {
                  slidesPerView: 1,
                  spaceBetween: 10,
                },
                330: {
                  slidesPerView: 1,
                  spaceBetween: 10,
                },
                500: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                700: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                1100: {
                  slidesPerView: 4,
                  spaceBetween: 30,
                },
              }}
              className="blogSlider"
            >
              {
                blogData?.slice()?.reverse()?.map((item, index) => {
                  return (
                    <SwiperSlide key={index}>
                      <BlogItem item={item} />
                    </SwiperSlide>
                  )
                })
              }



            </Swiper>
          </div>
        </section>
      }



    </>
  );
};

export default Home;
