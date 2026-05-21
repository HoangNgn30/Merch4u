import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa";
import { IoBagCheckOutline } from "react-icons/io5";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { RiCoupon2Line } from "react-icons/ri";
import { NavLink, useNavigate } from "react-router-dom";
import { MyContext } from "../../App";
import CircularProgress from '@mui/material/CircularProgress';
import { fetchDataFromApi, uploadImage } from "../../utils/api";
import { LuMapPin } from "react-icons/lu";



const AccountSidebar = () => {

  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    const userAvtar = [];
    if (context?.userData?.avatar !== "" && context?.userData?.avatar !== undefined) {
      userAvtar.push(context?.userData?.avatar);
      setPreviews(userAvtar)
    }

  }, [context?.userData])

  let selectedImages = [];

  const formdata = new FormData();

  const onChangeFile = async (e, apiEndPoint) => {
    try {
      setPreviews([]);
      const files = e.target.files;
      setUploading(true);


      for (var i = 0; i < files.length; i++) {
        if (files[i] && (files[i].type === "image/jpeg" || files[i].type === "image/jpg" ||
          files[i].type === "image/png" ||
          files[i].type === "image/webp")
        ) {

          const file = files[i];

          selectedImages.push(file);
          formdata.append(`avatar`, file);


        } else {
          context.alertBox("error", "Vui lòng chọn tệp ảnh JPG, PNG hoặc WebP hợp lệ.");
          setUploading(false);
          return false;
        }
      }

      uploadImage("/api/user/user-avatar", formdata).then((res) => {
        setUploading(false);
        let avatar = [];
        avatar.push(res?.data?.avtar);
        setPreviews(avatar);
        context.alertBox("success", "Cập nhật ảnh đại diện thành công!");
        fetchDataFromApi(`/api/user/user-details`).then((res) => {
          context?.setUserData(res.data);
        })

      })

    } catch (error) {
      console.log(error);
    }
  }


   const logout = () => {

      fetchDataFromApi(`/api/user/logout?token=${localStorage.getItem('accessToken')}`, { withCredentials: true }).then((res) => {
        if (res?.error === false) {
          context.setIsLogin(false);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          context.setUserData(null);
          context?.setCartData([]);
          context?.setMyListData([]);
          history("/");
        }
  
  
      })
  
    }
  return (
    <div className="card bg-white shadow-md rounded-md sticky top-[160px]">
      <div className="w-full p-5 flex items-center justify-center flex-col">
        <div className="w-[110px] h-[110px] rounded-full overflow-hidden mb-4 relative group flex items-center justify-center bg-gray-200">

          {
            uploading === true ? <CircularProgress color="inherit" /> :
              <>
                {
                  previews?.length !== 0 ? previews?.map((img, index) => {
                    return (
                      <img
                        src={img}
                        key={index}
                        className="w-full h-full object-cover"
                      />
                    )
                  })
                    :
                    <img
                      src={"/user.jpg"}
                      className="w-full h-full object-cover"
                    />

                }
              </>

          }


          <div className="overlay w-[100%] h-[100%] absolute top-0 left-0 z-50 bg-[rgba(0,0,0,0.7)] flex items-center justify-center cursor-pointer opacity-0 transition-all group-hover:opacity-100">
            <FaCloudUploadAlt className="text-[#fff] text-[25px]" />
            <input
              type="file"
              className="absolute top-0 left-0 w-full h-full opacity-0"
              accept='image/*'
              onChange={(e) =>
                onChangeFile(e, "/api/user/user-avatar")
              }
              name="avatar"
            />
          </div>
        </div>

        <h3>{context?.userData?.name}</h3>
        <h6 className="text-[13px] font-[500]">{context?.userData?.email}</h6>
      </div>

      <ul className="list-none pb-5 bg-[#f1f1f1] myAccountTabs">
        <li className="w-full">
          <NavLink to="/my-account" end className={({ isActive }) => isActive ? "isActive" : ""}>
            <Button className="w-full !text-left !py-2 !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2">
              <FaRegUser className="text-[15px]" /> Hồ sơ của tôi
            </Button>
          </NavLink>
        </li>

        <li className="w-full">
          <NavLink to="/address" end className={({ isActive }) => isActive ? "isActive" : ""}>
            <Button className="w-full !text-left !py-2 !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2">
              <LuMapPin className="text-[18px]" /> Địa chỉ
            </Button>
          </NavLink>
        </li>

        <li className="w-full">
          <NavLink to="/my-list" end className={({ isActive }) => isActive ? "isActive" : ""}>
            <Button className="w-full !py-2  !text-left !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2">
              <IoMdHeartEmpty className="text-[17px]" /> Yêu thích
            </Button>
          </NavLink>
        </li>

        <li className="w-full">
          <NavLink to="/my-orders" end className={({ isActive }) => isActive ? "isActive" : ""}>
            <Button className="w-full  !py-2 !text-left !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2">
              <IoBagCheckOutline className="text-[17px]" /> Đơn hàng của tôi
            </Button>
          </NavLink>
        </li>

        <li className="w-full">
          <NavLink to="/my-coupons" end className={({ isActive }) => isActive ? "isActive" : ""}>
            <Button className="w-full  !py-2 !text-left !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2">
              <RiCoupon2Line className="text-[17px]" /> Kho Coupon
            </Button>
          </NavLink>
        </li>

        <li className="w-full">
          <Button className="w-full !py-2  !text-left !px-5 !justify-start !capitalize !text-[rgba(0,0,0,0.8)] !rounded-none flex items-center gap-2" onClick={logout}>
            <IoIosLogOut className="text-[18px]" /> Đăng xuất
          </Button>
        </li>
      </ul>
    </div>
  );
};


export default AccountSidebar;
