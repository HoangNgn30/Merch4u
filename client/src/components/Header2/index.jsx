import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Search from "../Search";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa6";
import Tooltip from "@mui/material/Tooltip";
import Navigation from "./Navigation";
import { MyContext } from "../../App";
import { Button } from "@mui/material";
import { FaRegUser } from "react-icons/fa";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { IoBagCheckOutline } from "react-icons/io5";
import { IoMdHeartEmpty } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { fetchDataFromApi } from "../../utils/api";
import { LuMapPin } from "react-icons/lu";
import { useEffect } from "react";
import { HiOutlineMenu } from "react-icons/hi";
import { IoSearch } from "react-icons/io5";


const StyledBadge = styled(Badge)(({ theme }) => ({
    "& .MuiBadge-badge": {
        right: -3,
        top: 13,
        border: `2px solid ${theme.palette.background.paper}`,
        padding: "0 4px",
    },
}));

const Header2 = () => {

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);

    const context = useContext(MyContext);

    const history = useNavigate();

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const syncChative = () => {
        if (window.chative && context?.userData) {
            window.chative.identify({
                user_id: context.userData._id,
                email: context.userData.email,
                name: context.userData.name
            });
        }
    };

    useEffect(() => {
        fetchDataFromApi("/api/logo").then((res) => {
            if (res?.logo) {
                localStorage.setItem('logo', res.logo[0]?.logo);
            }
        });

        if (context?.isLogin && context?.userData) {
            const timer = setTimeout(syncChative, 2000);
            return () => clearTimeout(timer);
        } else if (context?.isLogin === false && window.chative) {
            window.chative.shutdown();
            window.chative.boot();
        }
    }, [context?.isLogin, context?.userData?._id]);


    const logout = () => {
        setAnchorEl(null);

        fetchDataFromApi(`/api/user/logout?token=${localStorage.getItem('accessToken')}`, { withCredentials: true }).then((res) => {
            if (res?.error === false) {

                if (window.chative) {
                    if (typeof window.chative.clearData === 'function') {
                        window.chative.clearData();
                    }
                    window.chative.identify({
                        user_id: `guest_${new Date().getTime()}`,
                        email: "",
                        name: ""
                    });

                    setTimeout(() => {
                        window.chative.shutdown();
                        window.chative.boot();
                    }, 500);
                }

                context.setIsLogin(false);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                context.setUserData(null);
                context?.setCartData([]);
                context?.setMyListData([]);
                history("/");
            }
        });
    }



    return (
        <header className=" sticky z-[1000] top-0 left-0 w-full bg-white/20 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center justify-between px-4 lg:px-8 py-3 gap-2">

                <div className="flex items-center lg:hidden">
                    <Button
                        className="!w-[36px] !min-w-[36px] !h-[36px] !rounded-full !text-gray-700 !p-0"
                        onClick={() => setIsOpenCatPanel(true)}
                    >
                        <HiOutlineMenu size={22} />
                    </Button>
                </div>

                <div className="flex-shrink-0">
                    <Link to={"/"}>
                        <img
                            src={localStorage.getItem('logo')}
                            className="h-[40px] lg:h-[50px] w-auto object-contain"
                            alt="Logo"
                        />
                    </Link>
                </div>

                <div className="hidden lg:flex items-center flex-1 px-4">
                    <Navigation isOpenCatPanel={isOpenCatPanel} setIsOpenCatPanel={setIsOpenCatPanel} />
                </div>

                <div className="hidden lg:flex flex-1 max-w-[360px]">
                    <Search />
                </div>

                {/* ===== RIGHT ACTIONS ===== */}
                <div className="flex items-center gap-1">

                    <div className="flex lg:hidden">
                        <IconButton
                            aria-label="search"
                            onClick={() => context?.setOpenSearchPanel(true)}
                            size="small"
                        >
                            <IoSearch size={20} />
                        </IconButton>
                    </div>


                    {context.isLogin === false ? (
                        <div className="hidden lg:flex items-center gap-2 text-[14px] font-[500]">
                            <Link to="/login" className="link transition hover:text-[#ff5252]">Login</Link>
                            <span className="text-gray-300">|</span>
                            <Link to="/register" className="link transition hover:text-[#ff5252]">Register</Link>
                        </div>
                    ) : (
                        <div className="hidden lg:flex items-center">
                            <Button
                                className="!text-[#000] myAccountWrap flex items-center gap-2 cursor-pointer !normal-case"
                                onClick={handleClick}
                            >
                                <div className="flex items-center justify-center w-[36px] h-[36px] min-w-[36px] rounded-full bg-gray-100">
                                    <FaRegUser className="text-[15px] text-[rgba(0,0,0,0.7)]" />
                                </div>
                                <div className="info flex flex-col text-left">
                                    <span className="text-[13px] text-[rgba(0,0,0,0.7)] font-[500] capitalize leading-tight">
                                        {context?.userData?.name}
                                    </span>
                                    <span className="text-[11px] text-[rgba(0,0,0,0.5)] leading-tight">
                                        {context?.userData?.email}
                                    </span>
                                </div>
                            </Button>

                            <Menu
                                anchorEl={anchorEl}
                                id="account-menu"
                                open={open}
                                onClose={handleClose}
                                onClick={handleClose}
                                slotProps={{
                                    paper: {
                                        elevation: 0,
                                        sx: {
                                            overflow: "visible",
                                            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.18))",
                                            mt: 1.5,
                                            "&::before": {
                                                content: '""',
                                                display: "block",
                                                position: "absolute",
                                                top: 0,
                                                right: 14,
                                                width: 10,
                                                height: 10,
                                                bgcolor: "background.paper",
                                                transform: "translateY(-50%) rotate(45deg)",
                                                zIndex: 0,
                                            },
                                        },
                                    },
                                }}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                            >
                                <Link to="/my-account" className="w-full block">
                                    <MenuItem onClick={handleClose} className="flex gap-2 !py-2">
                                        <FaRegUser className="text-[16px]" />
                                        <span className="text-[14px]">My Account</span>
                                    </MenuItem>
                                </Link>
                                <Link to="/address" className="w-full block">
                                    <MenuItem onClick={handleClose} className="flex gap-2 !py-2">
                                        <LuMapPin className="text-[16px]" />
                                        <span className="text-[14px]">Address</span>
                                    </MenuItem>
                                </Link>
                                <Link to="/my-orders" className="w-full block">
                                    <MenuItem onClick={handleClose} className="flex gap-2 !py-2">
                                        <IoBagCheckOutline className="text-[16px]" />
                                        <span className="text-[14px]">Orders</span>
                                    </MenuItem>
                                </Link>
                                <Link to="/my-list" className="w-full block">
                                    <MenuItem onClick={handleClose} className="flex gap-2 !py-2">
                                        <IoMdHeartEmpty className="text-[16px]" />
                                        <span className="text-[14px]">My List</span>
                                    </MenuItem>
                                </Link>
                                <MenuItem onClick={logout} className="flex gap-2 !py-2">
                                    <IoIosLogOut className="text-[16px]" />
                                    <span className="text-[14px]">Logout</span>
                                </MenuItem>
                            </Menu>
                        </div>
                    )}

                    {/* Wishlist - desktop only */}
                    <div className="hidden lg:flex">
                        <Tooltip title="Wishlist">
                            <IconButton component={Link} to="/my-list" aria-label="wishlist" size="small">
                                <StyledBadge
                                    badgeContent={context?.myListData?.length > 0 ? context?.myListData?.length : 0}
                                    color="secondary"
                                >
                                    <FaRegHeart size={18} />
                                </StyledBadge>
                            </IconButton>
                        </Tooltip>
                    </div>

                    {/* Cart - always visible */}
                    <Tooltip title="Cart">
                        <IconButton
                            aria-label="cart"
                            onClick={() => context.setOpenCartPanel(true)}
                            size="small"
                        >
                            <StyledBadge
                                badgeContent={context?.cartData?.length > 0 ? context?.cartData?.length : 0}
                                color="secondary"
                            >
                                <MdOutlineShoppingCart size={20} />
                            </StyledBadge>
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Mobile: Search panel overlay */}
            {context?.openSearchPanel === true && context?.windowWidth < 992 && (
                <div className="fixed top-0 left-0 w-full h-full bg-white z-[200] p-3">
                    <Search />
                </div>
            )}

            {/* Mobile: Category panel (renders via Navigation which includes CategoryPanel) */}
            <div className="lg:hidden">
                <Navigation isOpenCatPanel={isOpenCatPanel} setIsOpenCatPanel={setIsOpenCatPanel} mobileOnly={true} />
            </div>
        </header>
    );
}

export default Header2;
