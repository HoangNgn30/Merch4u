import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { GoTriangleDown } from "react-icons/go";
import Rating from "@mui/material/Rating";
import { IoCloseSharp } from "react-icons/io5";
import { deleteData, editData, fetchDataFromApi } from "../../utils/api";
import { MyContext } from "../../App";
import { QtyBox } from "../../components/QtyBox";

const CartItems = (props) => {
  const [sizeanchorEl, setSizeAnchorEl] = useState(null);
  const openSize = Boolean(sizeanchorEl);

  const [selectedQty, setSelectedQty] = useState(props.qty);
  const [productSizes, setProductSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(true);

  const context = useContext(MyContext);

  useEffect(() => {
    setSelectedQty(props.qty);
  }, [props.qty]);

  useEffect(() => {
    if (props?.item?.productId) {
      fetchDataFromApi(`/api/product/${props.item.productId}`).then((res) => {
        if (res?.product) {
          const sizes = res.product.size || [];
          setProductSizes(sizes.filter(s => s && s.trim() !== ""));
        }
        setLoadingSizes(false);
      });
    } else {
      setLoadingSizes(false);
    }
  }, [props?.item?.productId]);

  const handleClickSize = (event) => {
    setSizeAnchorEl(event.currentTarget);
  };

  const handleCloseSize = (value) => {
    setSizeAnchorEl(null);
    if (value !== null) {
      updateCartSize(value);
    }
  };

  const updateCartSize = (selectedVal) => {
    const cartObj = {
      _id: props?.item?._id,
      qty: props?.item?.quantity,
      subTotal: props?.item?.price * props?.item?.quantity,
      size: selectedVal,
    }

    editData("/api/cart/update-qty", cartObj).then((res) => {
      if (res?.data?.error === false) {
        context.alertBox("success", res?.data?.message);
        context?.getCartItems();
      }
    })
  }

  const handleCloseQty = (value) => {
    if (value !== null) {
      setSelectedQty(value);

      const cartObj = {
        _id: props?.item?._id,
        qty: value,
        subTotal: props?.item?.price * value
      }

      editData("/api/cart/update-qty", cartObj).then((res) => {
        if (res?.data?.error === false) {
          context.alertBox("success", res?.data?.message);
          context?.getCartItems();
        }
      })
    }
  };




  const removeItem = (id) => {
    context?.showConfirmBox(
      "Xóa sản phẩm khỏi giỏ hàng?",
      "Sản phẩm này sẽ được xóa khỏi giỏ hàng của bạn.",
      () => {
        deleteData(`/api/cart/delete-cart-item/${id}`).then((res) => {
          context.alertBox("success", "Đã xóa sản phẩm khỏi giỏ hàng");
          context?.getCartItems();
        })
      }
    )
  }


  return (
    <div className="cartItem w-full p-3 flex items-center gap-4 pb-5 border-b border-[rgba(0,0,0,0.1)]">
      <div className="img w-[30%] sm:w-[20%] lg:w-[15%] rounded-md overflow-hidden">
        <Link to={`/product/${props?.item?.productId}`} className="group">
          <img
            src={props?.item?.image}
            className="w-full group-hover:scale-105 transition-all"
          />
        </Link>
      </div>

      <div className="info  w-[70%]  sm:w-[80%]  lg:w-[85%] relative">
        <IoCloseSharp className="cursor-pointer absolute top-[0px] right-[0px] text-[22px] link transition-all" onClick={() => removeItem(props?.item?._id)} />
        <span className="text-[13px]">{props?.item?.brand}</span>
        <h3 className="text-[13px] sm:text-[15px] w-[80%]">
          <Link to={`/product/${props?.item?.productId}`} className="link">{props?.item?.productTitle?.substr(0, context?.windowWidth < 992 ? 30 : 120) + '...'}</Link>
        </h3>

        <Rating name="size-small" value={props?.item?.rating} size="small" readOnly />

        <div className="flex items-center gap-4 mt-2">
          {!loadingSizes && productSizes.length > 0 && (
            <div className="relative">
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-[600] h-[35px] px-4 rounded-full border-none cursor-pointer transition-all min-w-[65px]"
                onClick={handleClickSize}
              >
                {props?.item?.size || productSizes[0]} <GoTriangleDown className="text-[12px]" />
              </button>

              <Menu
                id="size-menu"
                anchorEl={sizeanchorEl}
                open={openSize}
                onClose={() => handleCloseSize(null)}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                {productSizes.map((sizeName, idx) => (
                  <MenuItem
                    key={idx}
                    selected={sizeName === props?.item?.size}
                    onClick={() => handleCloseSize(sizeName)}
                    className="text-xs"
                  >
                    {sizeName}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          )}

          <div className="relative w-[110px] h-[35px]">
            <QtyBox handleSelecteQty={(val) => handleCloseQty(val)} initialQty={selectedQty} maxQty={props?.item?.countInStock || 999} />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <span className="price text-[14px]  font-[600]">{props?.item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>

          <span className="oldPrice line-through text-gray-500 text-[14px] font-[500]">
            {props?.item?.oldPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>

          <span className="price text-primary text-[14px]  font-[600]">
            {props?.item?.discount}% OFF
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
