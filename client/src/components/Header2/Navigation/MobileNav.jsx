import { Button } from '@mui/material'
import React, { useContext, useEffect } from 'react';
import { IoHomeOutline } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { LuHeart } from "react-icons/lu";
import { BsBagCheck } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import { NavLink } from "react-router";
import { MdOutlineFilterAlt } from "react-icons/md";
import { RiMenu2Fill } from "react-icons/ri";
import { IoGiftOutline } from "react-icons/io5";
import { MyContext } from '../../../App';
import { useLocation } from "react-router-dom";

const MobileNav = (props) => {

    const context = useContext(MyContext)

    const location = useLocation();

    useEffect(() => {
       
        if (location.pathname === "/products" || location.pathname === "/search") {
            context?.setisFilterBtnShow(true)
            // Perform your action here
        } else {
            context?.setisFilterBtnShow(false)
        }
    }, [location]);

    const openFilters = () => {
        context?.setOpenFilter(true);
        context?.setOpenSearchPanel(false)
    }


    return (
        <div className='mobileNav bg-white p-1 px-2 w-full flex items-center justify-around fixed bottom-0 left-0 gap-1 z-[1000] border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom)+4px)]'>
            <NavLink to="/" end className={({ isActive }) => isActive ? "isActive flex-1" : "flex-1"} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="w-full flex-col !capitalize !text-gray-500 hover:!text-primary !py-2">
                    <IoHomeOutline size={20} className="mb-1" />
                    <span className='text-[10px] font-semibold whitespace-nowrap'>Trang chủ</span>
                </Button>
            </NavLink>

            <NavLink to="/my-list" end className={({ isActive }) => isActive ? "isActive flex-1" : "flex-1"} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="w-full flex-col !capitalize !text-gray-500 hover:!text-primary !py-2">
                    <LuHeart size={20} className="mb-1" />
                    <span className='text-[10px] font-semibold whitespace-nowrap'>Yêu thích</span>
                </Button>
            </NavLink>

            <NavLink to="/coupon-game" end className={({ isActive }) => isActive ? "isActive flex-1" : "flex-1"} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="w-full flex-col !capitalize !text-gray-500 hover:!text-primary !py-2">
                    <IoGiftOutline size={20} className="mb-1" />
                    <span className='text-[10px] font-semibold whitespace-nowrap'>Mã giảm giá</span>
                </Button>
            </NavLink>

            <NavLink to="/my-orders" end className={({ isActive }) => isActive ? "isActive flex-1" : "flex-1"} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="w-full flex-col !capitalize !text-gray-500 hover:!text-primary !py-2">
                    <BsBagCheck size={20} className="mb-1" />
                    <span className='text-[10px] font-semibold whitespace-nowrap'>Đơn hàng</span>
                </Button>
            </NavLink>

            <NavLink to="/my-account" end className={({ isActive }) => isActive ? "isActive flex-1" : "flex-1"} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="w-full flex-col !capitalize !text-gray-500 hover:!text-primary !py-2">
                    <FiUser size={20} className="mb-1" />
                    <span className='text-[10px] font-semibold whitespace-nowrap'>Tài khoản</span>
                </Button>
            </NavLink>
        </div>
    )
}

export default MobileNav
