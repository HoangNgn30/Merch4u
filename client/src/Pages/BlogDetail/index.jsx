import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import CircularProgress from '@mui/material/CircularProgress';
import DOMPurify from 'dompurify';
import { fetchDataFromApi } from "../../utils/api";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { IoMdTime } from "react-icons/io";
import { FaUser, FaTags, FaFolderOpen } from "react-icons/fa";

const BlogDetail = () => {
  const { id } = useParams();
  const [blogData, setBlogData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    fetchDataFromApi(`/api/blog/${id}`).then((res) => {
      if (res?.error === false) {
        setBlogData(res?.blog);
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    });
  }, [id]);

  return (
    <>
      <div className="py-5 bg-[#f1f1f1]">
        <div className="container">
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" to="/" className="link transition !text-[14px]">
              Trang chủ
            </Link>
            <span className="text-[14px] text-gray-500">Tin tức & Blog</span>
          </Breadcrumbs>
        </div>
      </div>

      <section className="bg-white py-10">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <CircularProgress />
          </div>
        ) : (
          <div className="container max-w-[900px] mx-auto">
            {blogData && (
              <div className="blogDetailContent">
                <h1 className="text-[24px] lg:text-[32px] font-bold text-black mb-4">
                  {blogData?.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-[14px] text-gray-600 mb-8 border-b pb-4">
                  <span className="flex items-center gap-1">
                    <IoMdTime className="text-[18px]" /> {blogData?.createdAt?.split("T")[0]}
                  </span>
                  
                  {blogData?.author && (
                    <span className="flex items-center gap-1">
                      <FaUser className="text-[16px]" /> {blogData?.author}
                    </span>
                  )}

                  {blogData?.category && (
                    <span className="flex items-center gap-1">
                      <FaFolderOpen className="text-[16px]" /> {blogData?.category}
                    </span>
                  )}
                  
                  {blogData?.tags && blogData?.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FaTags className="text-[16px]" /> {blogData?.tags.join(", ")}
                    </span>
                  )}
                </div>

                {blogData?.images && blogData?.images.length > 0 && (
                  <div className="w-full mb-8 rounded-lg overflow-hidden">
                    <LazyLoadImage
                      alt="blog-banner"
                      effect="blur"
                      className="w-full object-cover"
                      src={blogData?.images[0]}
                    />
                  </div>
                )}

                <div 
                  className="blog-description text-[16px] leading-[1.8] text-gray-800"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blogData?.description || '') }} 
                />
              </div>
            )}

            {!blogData && !isLoading && (
              <div className="text-center py-20">
                <h2 className="text-[24px] font-bold text-gray-500">Không tìm thấy bài viết!</h2>
                <Link to="/">
                  <button className="btn-org mt-5">Quay về trang chủ</button>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default BlogDetail;
