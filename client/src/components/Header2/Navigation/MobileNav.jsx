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
        <div className='mobileNav bg-white p-1 px-3 w-full flex items-center justify-between fixed bottom-0 left-0 gap-0 z-[1000]'>
            <NavLink to="/" end className={({ isActive }) => isActive ? "isActive" : ""} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="flex-col !w-[40px] !min-w-[40px] !capitalize !text-gray-700">
                    <IoHomeOutline size={18} />
                    <span className='text-[12px]'>Home</span>
                </Button>
            </NavLink>






            <NavLink to="/my-list" end className={({ isActive }) => isActive ? "isActive" : ""} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="flex-col !w-[40px] !min-w-[40px] !capitalize !text-gray-700">
                    <LuHeart size={18} />
                    <span className='text-[12px]'>Wishlist</span>
                </Button>
            </NavLink>


            <NavLink to="/my-orders" end className={({ isActive }) => isActive ? "isActive" : ""} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="flex-col !w-[40px] !min-w-[40px] !capitalize !text-gray-700">
                    <BsBagCheck size={18} />
                    <span className='text-[12px]'>Orders</span>
                </Button>
            </NavLink>

            <NavLink to="/my-account" end className={({ isActive }) => isActive ? "isActive" : ""} onClick={()=>context?.setOpenSearchPanel(false)}>
                <Button className="flex-col !w-[40px] !min-w-[40px] !capitalize !text-gray-700">
                    <FiUser size={18} />
                    <span className='text-[12px]'>Account</span>
                </Button>
            </NavLink>
        </div>
    )
}

export default MobileNav