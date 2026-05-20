import React, { useContext, useEffect, useState } from "react";
import "../ProductItem/style.css";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
import { MdZoomOutMap } from "react-icons/md";
import { MyContext } from "../../App";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaMinus, FaPlus } from "react-icons/fa";
import { deleteData, editData, postData, fetchDataFromApi } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { MdClose } from "react-icons/md";
import { IoMdHeart } from "react-icons/io";



const ProductItem = (props) => {

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [cartItem, setCartItem] = useState([]);

  const [activeTab, setActiveTab] = useState(null);
  const [isShowTabs, setIsShowTabs] = useState(false);
  const [selectedTabName, setSelectedTabName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [sizes, setSizes] = useState(props?.item?.size || []);

  const context = useContext(MyContext);

  useEffect(() => {
    if (props?.item?.size) {
      setSizes(props.item.size);
    } else {
      setSizes([]);
    }
  }, [props?.item?.size]);

  const addToCart = (product, userId, qtyVal) => {
    if (!context?.isLogin || userId === undefined) {
      context?.alertBox("error", "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng");
      return false;
    }
    setQuantity(1);
    setSelectedTabName(null);
    setActiveTab(null);

    const currentSizes = product?.size || [];
    if (currentSizes.length === 0) {
      setIsLoading(true);
      fetchDataFromApi(`/api/product/${product?._id}`).then((res) => {
        setIsLoading(false);
        if (res?.product?.size && res.product.size.length > 0) {
          setSizes(res.product.size);
        } else {
          setSizes([]);
        }
        setIsShowTabs(true);
      }).catch((err) => {
        setIsLoading(false);
        setSizes([]);
        setIsShowTabs(true);
      });
    } else {
      setSizes(currentSizes);
      setIsShowTabs(true);
    }
  }

  const handleConfirmAddToCart = () => {
    if (!context?.isLogin || context?.userData?._id === undefined) {
      context?.alertBox("error", "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng");
      return false;
    }

    if (sizes?.length > 0 && selectedTabName === null) {
      context?.alertBox("error", "Vui lòng chọn phiên bản sản phẩm");
      return;
    }

    const productItem = {
      _id: props?.item?._id,
      name: props?.item?.name,
      image: props?.item?.images?.[0],
      rating: props?.item?.rating,
      price: props?.item?.price,
      oldPrice: props?.item?.oldPrice,
      discount: props?.item?.discount,
      quantity: quantity,
      subTotal: parseInt(props?.item?.price * quantity),
      productId: props?.item?._id,
      countInStock: props?.item?.countInStock,
      brand: props?.item?.brand,
      size: selectedTabName || '',
    }

    setIsLoading(true);
    context?.addToCart(productItem, context?.userData?._id, quantity);

    setIsShowTabs(false);
    setActiveTab(null);
    setSelectedTabName(null);
    setQuantity(1);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }

  useEffect(() => {
    const item = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(props?.item?._id)
    )

    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    )

    if (item?.length !== 0) {
      setCartItem(item)
      setIsAdded(true);
      setQuantity(item[0]?.quantity)
    } else {
      setQuantity(1)
    }


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.cartData]);


  const minusQty = () => {
    if (quantity !== 1 && quantity > 1) {
      setQuantity(quantity - 1)
    } else {
      setQuantity(1)
    }


    if (quantity === 1) {
      deleteData(`/api/cart/delete-cart-item/${cartItem[0]?._id}`).then((res) => {
        setIsAdded(false);
        context.alertBox("Thành công", "Đã gỡ sản phẩm khỏi giỏ hàng");
        context?.getCartItems();
        setIsShowTabs(false);
        setActiveTab(null);
      })
    } else {
      const obj = {
        _id: cartItem[0]?._id,
        qty: quantity - 1,
        subTotal: props?.item?.price * (quantity - 1)
      }

      editData(`/api/cart/update-qty`, obj).then((res) => {
        context.alertBox("success", res?.data?.message);
        context?.getCartItems();
      })
    }

  }


  const addQty = () => {

    setQuantity(quantity + 1);

    const obj = {
      _id: cartItem[0]?._id,
      qty: quantity + 1,
      subTotal: props?.item?.price * (quantity + 1)
    }

    editData(`/api/cart/update-qty`, obj).then((res) => {
      context.alertBox("success", res?.data?.message);
      context?.getCartItems();
    })



  }


  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "you are not login please login first");
      return false
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
      })

    }
  }


  return (
    <div className="productItem relative shadow-lg rounded-md overflow-hidden border border-[rgba(0,0,0,0.1)]">
      {
        isShowTabs === true &&
        <div className="absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.9)] z-[60] p-4 flex flex-col justify-center items-center gap-4 text-white rounded-md">
          
          {/* Close button */}
          <button type="button" className="absolute top-[10px] right-[10px] w-[28px] h-[28px] rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white border-none cursor-pointer transition-colors z-[90]"
            onClick={() => {
              setIsShowTabs(false);
              setSelectedTabName(null);
              setActiveTab(null);
              setQuantity(1);
            }}
          >
            <MdClose className="text-white text-[18px]" />
          </button>

          {/* Title / Header */}
          <div className="text-center w-full">
            <span className="text-[14px] font-bold tracking-wider text-gray-200 uppercase">Tùy Chọn Mua Hàng</span>
          </div>

          {/* Sizes selection */}
          {sizes?.length > 0 && (
            <div className="w-full flex flex-col items-center gap-2">
              <span className="text-[12px] text-gray-400 font-semibold">Chọn phiên bản:</span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-h-[120px] overflow-y-auto w-full px-2">
                {sizes.map((item, index) => {
                  return (
                    <span key={index} className={`flex items-center justify-center px-4 py-1.5 bg-white/10 hover:bg-white/25 rounded-full font-bold text-[12px] text-white cursor-pointer transition-all shadow-sm border border-white/10
              ${activeTab === index && '!bg-primary !text-white !border-primary'}`}
                      onClick={() => {
                        setActiveTab(index);
                        setSelectedTabName(item);
                      }}
                    >{item}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-[12px] text-gray-400 font-semibold">Chọn số lượng:</span>
            <div className="flex items-center justify-between rounded-full border border-white/20 h-[35px] w-[110px] overflow-hidden bg-white/5">
              <button type="button" className="flex items-center justify-center w-[35px] h-full hover:bg-white/10 text-white border-none cursor-pointer"
                onClick={() => setQuantity(prev => prev > 1 ? prev - 1 : 1)}
              >
                <FaMinus size={11} />
              </button>
              <span className="text-[14px] font-bold text-white">{quantity}</span>
              <button type="button" className="flex items-center justify-center w-[35px] h-full hover:bg-white/10 text-white border-none cursor-pointer"
                onClick={() => setQuantity(prev => prev < (props?.item?.countInStock || 999) ? prev + 1 : prev)}
              >
                <FaPlus size={11} />
              </button>
            </div>
          </div>

          {/* Add to Cart button */}
          <div className="w-full px-4 mt-2">
            <Button
              className="!bg-primary !text-white !rounded-full flex gap-1.5 w-full !py-2 !font-bold !text-[13px] !shadow-md hover:!bg-red-600 transition-colors"
              onClick={() => handleConfirmAddToCart()}
              disabled={sizes?.length > 0 && activeTab === null}
            >
              Xác Nhận
            </Button>
          </div>

        </div>
      }

      <div className="group imgWrapper w-[100%]  overflow-hidden  rounded-md rounded-bl-none rounded-br-none relative">
        <Link to={`/product/${props?.item?._id}`}>
          <div className="img h-[200px] overflow-hidden">
            <img
              src={props?.item?.images?.[0]}
              className="w-full"
            />

            {
              props?.item?.images?.length > 1 &&
              <img
                src={props?.item?.images?.[1]}
                className="w-full transition-all duration-700 absolute top-0 left-0 opacity-0 group-hover:opacity-100 group-hover:scale-105"
              />
            }


          </div>
        </Link>


        <span className="discount flex items-center absolute top-[10px] left-[10px] z-50 bg-primary text-white rounded-lg p-1 text-[12px] font-[500]">
          {props?.item?.discount}%
        </span>

        <div className="actions absolute top-[-20px] right-[5px] z-50 flex items-center gap-2 flex-col w-[50px] transition-all duration-300 group-hover:top-[15px] opacity-0 group-hover:opacity-100">

          <button className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-white shadow-md hover:bg-primary text-gray-800 hover:text-white group transition-colors" onClick={() => context.handleOpenProductDetailsModal(true, props?.item)}>
            <MdZoomOutMap size={18} />
          </button>



          <button className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-white shadow-md hover:bg-primary text-gray-800 hover:text-white group transition-colors"
            onClick={() => handleAddToMyList(props?.item)}
          >
            {
              isAddedInMyList === true ? <IoMdHeart size={18} className="text-primary group-hover:text-white" /> :
                <FaRegHeart size={18} />

            }

          </button>
        </div>
      </div>

      <div className="info p-3 py-5 relative pb-[50px] h-[190px]">
        <h6 className="text-[13px] !font-[400]">
          <span className="link transition-all">
            {props?.item?.brand}
          </span>
        </h6>
        <h3 className="text-[12px] lg:text-[13px] title mt-1 font-[500] mb-1 text-[#000]">
          <Link to={`/product/${props?.item?._id}`} className="link transition-all">
            {props?.item?.name ? props.item.name.substr(0, 25) + '...' : ''}
          </Link>
        </h3>

        <Rating name="size-small" defaultValue={props?.item?.rating} size="small" readOnly />

        <div className="flex items-center gap-4 justify-between">
          <span className="oldPrice line-through text-gray-500 text-[12px] lg:text-[14px] font-[500]">
            {props?.item?.oldPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
          <span className="price text-primary text-[12px] lg:text-[14px]  font-[600]">
            {props?.item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
        </div>


        <div className="!absolute bottom-[15px] left-0 pl-3 pr-3 w-full">

          {
            isLoading === true ?
              <Button className="addtocart btn-org btn-border flex w-full btn-sm gap-2 !h-[35px]" size="small" disabled>
                <CircularProgress size={20} />
              </Button>

              :

              <Button className="btn-org addToCartBtn btn-border flex w-full btn-sm gap-2 !h-[35px]" size="small"
                onClick={() => addToCart(props?.item, context?.userData?._id, quantity)}>
                <MdOutlineShoppingCart className="text-[18px]" /> Thêm Vào Giỏ
              </Button>
          }

        </div>



      </div>
    </div>
  );
};

export default ProductItem;
