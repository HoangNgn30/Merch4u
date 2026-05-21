import React, { useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { QtyBox } from "../QtyBox";
import Rating from "@mui/material/Rating";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { MyContext } from "../../App";
import CircularProgress from '@mui/material/CircularProgress';
import { deleteData, postData } from "../../utils/api";
import { IoMdHeart } from "react-icons/io";
import { resolveProductStatus } from "../ProductStatusBadges";

export const ProductDetailsComponent = (props) => {
  const [productActionIndex, setProductActionIndex] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTabName, setSelectedTabName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tabError, setTabError] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [isMyListLoading, setIsMyListLoading] = useState(false);

  const context = useContext(MyContext);
  const productStatus = resolveProductStatus(props?.item);
  const isSoldOut = productStatus === "sold-out";

  const findMyListItem = (productId) => {
    return context?.myListData?.find((item) =>
      String(item?.productId) === String(productId)
    );
  };

  const handleSelecteQty = (qty) => {
    setQuantity(qty);
  }

  const handleClickActiveTab = (index, name) => {
    setProductActionIndex(index)
    setSelectedTabName(name)
  }

  useEffect(() => {
    const myListItem = findMyListItem(props?.item?._id);

    if (myListItem) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.myListData, props?.item?._id])

  const addToCart = (product, userId, quantity) => {

    if (userId === undefined) {
      context?.alertBox("error", "Vui lòng đăng nhập trước");
      return false;
    }

    if (Number(product?.countInStock || 0) <= 0 || quantity > Number(product?.countInStock || 0)) {
      context?.alertBox("error", "Sản phẩm không đủ số lượng trong kho");
      return false;
    }

    const productItem = {
      _id: product?._id,
      productTitle: product?.name,
      image: product?.images[0],
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity: quantity,
      subTotal: parseInt(product?.price * quantity),
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: props?.item?.size?.length !== 0 ? selectedTabName : ''
    }

    if (props?.item?.size?.length !== 0) {
      if (selectedTabName !== null) {
        setIsLoading(true);

        postData("/api/cart/add", productItem).then((res) => {
          if (res?.error === false) {
            context?.alertBox("success", res?.message);

            context?.getCartItems();
            setTimeout(() => {
              setIsLoading(false);
            }, 500);

          } else {
            context?.alertBox("error", res?.message);
            setTimeout(() => {
              setIsLoading(false);
            }, 500);
          }

        })

      } else {
        setTabError(true);
      }
    } else {
      setIsLoading(true);
      postData("/api/cart/add", productItem).then((res) => {
        if (res?.error === false) {
          context?.alertBox("success", res?.message);

          context?.getCartItems();
          setTimeout(() => {
            setIsLoading(false);
          }, 500);

        } else {
          context?.alertBox("error", res?.message);
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }

      })
    }
  }

  const handleToggleMyList = (item) => {
    if (!context?.isLogin || context?.userData === null) {
      context?.alertBox("error", "Vui lòng đăng nhập trước");
      return false
    }

    const myListItem = findMyListItem(item?._id);
    setIsMyListLoading(true);

    if (myListItem?._id) {
      deleteData(`/api/myList/${myListItem._id}`).then((res) => {
        if (res?.error === false) {
          context?.alertBox("success", res?.message || "Đã xóa sản phẩm khỏi danh sách yêu thích");
          setIsAddedInMyList(false);
          context?.getMyListData();
        } else {
          context?.alertBox("error", res?.message || "Không thể xóa sản phẩm khỏi danh sách yêu thích");
        }
      }).catch(() => {
        context?.alertBox("error", "Không thể xóa sản phẩm khỏi danh sách yêu thích");
      }).finally(() => {
        setIsMyListLoading(false);
      });

      return;
    }

    else {
      const obj = {
        productId: item?._id,
        userId: context?.userData?._id,
        productTitle: item?.name,
        image: item?.images[0],
        rating: item?.rating,
        price: item?.price,
        oldPrice: item?.oldPrice,
        brand: item?.brand,
        discount: item?.discount
      }

      postData("/api/myList/add", obj).then((res) => {
        if (res?.error === false) {
          context?.alertBox("success", res?.message);
          setIsAddedInMyList(true);
          context?.getMyListData();
        } else {
          context?.alertBox("error", res?.message);
        }
      }).catch(() => {
        context?.alertBox("error", "Không thể thêm sản phẩm vào danh sách yêu thích");
      }).finally(() => {
        setIsMyListLoading(false);
      })

    }
  }

  return (
    <>
      <h1 className="text-[24px] sm:text-[30px] font-[800] text-gray-800 mb-3 leading-tight drop-shadow-sm">
        {props?.item?.name}
      </h1>
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {productStatus !== "available" && (
          <span className="rounded-full border border-gray-100 bg-gray-50 px-4 py-1.5 text-[12px] font-[700] uppercase text-gray-600 shadow-sm">
            {productStatus}
          </span>
        )}
        {Number(props?.item?.discount || 0) > 0 && (
          <span className="rounded-full bg-gradient-to-r from-[#ff5252] to-orange-500 px-4 py-1.5 text-[12px] font-[700] text-white shadow-sm">
            - {props?.item?.discount}% 
          </span>
        )}
      </div>

      <div className="flex items-start sm:items-center lg:items-center flex-col sm:flex-row md:flex-row lg:flex-row gap-4 justify-start bg-gray-50/50 p-3 rounded-[16px] border border-gray-100 w-max">
        <span className="text-gray-500 text-[13px] font-medium">
          Thương hiệu :{" "}
          <span className="font-[700] text-gray-800 ml-1">
            {props?.item?.brand}
          </span>
        </span>

        <span className="w-[1px] h-[15px] bg-gray-300 hidden sm:block"></span>

        <div className="flex items-center gap-1">
          <Rating name="size-small" value={props?.item?.rating} size="small" readOnly sx={{ color: '#f59e0b' }} />
          <span className="text-[13px] cursor-pointer text-blue-600 font-medium hover:underline ml-2" onClick={props.gotoReviews}>({props.reviewsCount} đánh giá)</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row items-start sm:items-center gap-4 mt-6 mb-2">
        <div className="flex items-end gap-3">
          <span className="price text-primary text-[32px] font-[800] leading-none drop-shadow-sm">
            {props?.item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
          <span className="oldPrice line-through text-gray-400 text-[18px] font-[600] mb-1">
            {props?.item?.oldPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[14px] text-gray-600 font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">
          <span className="font-bold">
            {isSoldOut ? "Hết hàng" : `Còn ${props?.item?.countInStock} sản phẩm`}
          </span>
        </span>
      </div>

      <p className="mt-3 pr-10 mb-5 text-[15px] text-gray-600 leading-relaxed font-medium" style={{whiteSpace: 'pre-line'}}>
        {props?.item?.description}
      </p>

      {
        props?.item?.size?.length !== 0 &&
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 actions">
            {
              props?.item?.size?.map((item, index) => {
                return (
                  <Button
                    key={index}
                    className={`${productActionIndex === index ?
                      "!bg-gradient-to-r !from-primary !to-orange-500 !text-white !shadow-md" : "!bg-white !text-gray-600 !border-gray-200"
                      } ${tabError === true && 'error'} !rounded-xl !px-5 !py-2 !font-bold transition-all`}
                    onClick={() => handleClickActiveTab(index, item)}
                  >
                    {item}
                  </Button>
                )
              })
            }
          </div>
        </div>
      }

      <p className="text-[14px] mt-6 mb-3 text-gray-800 font-medium">
        Giao hàng dự kiến 2-3 ngày
      </p>
      
      <div className="flex items-center gap-4 py-4">
        <div className="qtyBoxWrapper w-[130px] h-[50px] shadow-sm">
          <QtyBox handleSelecteQty={handleSelecteQty} maxQty={props?.item?.countInStock || 999} />
        </div>

        <Button className="!bg-gradient-to-r !from-primary !to-orange-500 !text-white !rounded-full flex gap-2 !min-w-[180px] !px-8 !py-3 !font-bold !text-[16px] !shadow-lg hover:!shadow-[0_8px_20px_rgba(255,82,82,0.3)] hover:!-translate-y-1 transition-all" disabled={isSoldOut} onClick={() => addToCart(props?.item, context?.userData?._id, quantity)}>
          {
            isLoading === true ? <CircularProgress color="inherit" size={24}/> :
              <>
                <MdOutlineShoppingCart className="text-[24px]" /> {isSoldOut ? "Hết hàng" : "Thêm vào giỏ"}
              </>
          }
        </Button>
      </div>

      <div className="flex items-center gap-6 mt-5 border-t border-gray-100 pt-5">
        <button
          type="button"
          className="flex items-center gap-2 text-[14px] sm:text-[15px] cursor-pointer font-[600] text-gray-600 hover:text-primary transition-colors group border-none bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={() => handleToggleMyList(props?.item)}
          disabled={isMyListLoading}
        >
          {
            isMyListLoading === true ? <CircularProgress color="inherit" size={18} /> :
            isAddedInMyList === true ? <IoMdHeart className="text-[20px] text-primary" /> :
              <FaRegHeart className="text-[20px] group-hover:text-primary" />
          }
          {isAddedInMyList ? "Bỏ Yêu thích" : "Thêm Yêu thích"}
        </button>

        <span className="hidden">
          <IoGitCompareOutline className="text-[20px] group-hover:text-primary" /> So sánh
        </span>
      </div>
    </>
  );
};
