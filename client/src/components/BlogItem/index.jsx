import React from "react";
import DOMPurify from 'dompurify';
import { IoMdTime } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { fetchDataFromApi, deleteData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";


const BlogItem = (props) => {
  return (
    <div className="blogItem group h-full flex flex-col">
      <div className="imgWrapper w-full aspect-[4/3] overflow-hidden rounded-md cursor-pointer relative bg-gray-100 flex items-center justify-center">
        <LazyLoadImage
          alt={"image"}
          effect="blur"
          wrapperClassName="w-full h-full !block"
          className="w-full h-full object-cover transition-all group-hover:scale-105 group-hover:rotate-1"
          src={props?.item?.images[0]}
        />


        <span className="flex items-center justify-center text-white absolute bottom-[15px] right-[15px] z-50 bg-primary rounded-md p-1 text-[11px] font-[500] gap-1">
          <IoMdTime className="text-[16px]" /> {props?.item?.createdAt?.split("T")[0]}
        </span>
      </div>

      <div className="info py-4 flex flex-col flex-1">
        <h2 className="text-[15px] font-[600] text-black mb-1 lg:mb-3 line-clamp-2">
          <Link to={`/blog/${props?.item?._id}`} className="link">{props?.item?.title}</Link>
        </h2>

        <p className="mb-3 text-[14px] lg:text-[16px] text-gray-500 line-clamp-3 flex-1">
          {props?.item?.description?.replace(/<[^>]+>/g, '')?.replace(/&nbsp;/g, ' ')}
        </p>



        <div className="mt-auto">
          <Link to={`/blog/${props?.item?._id}`} className="link font-[500] text-[14px] flex items-center gap-1">Đọc thêm <IoIosArrowForward /></Link>
        </div>
      </div>
    </div>
  );
};

export default BlogItem;
