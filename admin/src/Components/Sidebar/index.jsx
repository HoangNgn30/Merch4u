import { Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegImage } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { RiProductHuntLine } from "react-icons/ri";
import { TbCategory } from "react-icons/tb";
import { IoBagCheckOutline } from "react-icons/io5";
import { IoMdLogOut } from "react-icons/io";
import { MdOutlineDiscount } from "react-icons/md";
import { MdAdminPanelSettings } from "react-icons/md";
import { FaAngleDown } from "react-icons/fa6";
import { Collapse } from "react-collapse";
import { MyContext } from "../../App";
import { SiBloglovin } from "react-icons/si";
import { fetchDataFromApi } from "../../utils/api";
import { IoLogoBuffer } from "react-icons/io";
import { RiMenu2Line } from "react-icons/ri";

const Sidebar = () => {
  const [submenuIndex, setSubmenuIndex] = useState(null);
  const isOpenSubMenu = (index) => {
    if (submenuIndex === index) {
      setSubmenuIndex(null);
    } else {
      setSubmenuIndex(index);
    }
  };

  const context = useContext(MyContext);
  const history = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const canManageAccess = context?.userData?.role === "SUPERBOSS";

  useEffect(() => {
    if (currentPath.startsWith('/category') || currentPath.startsWith('/subCategory')) {
      setSubmenuIndex(3);
    } else {
      setSubmenuIndex(null);
    }
  }, [currentPath]);

  const logout = () => {
    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
    setSubmenuIndex(null)

    fetchDataFromApi(`/api/user/logout?token=${localStorage.getItem('accessToken')}`, { withCredentials: true }).then((res) => {
      if (res?.error === false) {
        context.setIsLogin(false);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        history("/login")
      }
    })
  }

  return (
    <>
      <div
        className={`sidebar fixed top-0 left-0 z-[52] bg-[#fff] h-full border-r border-[rgba(0,0,0,0.1)] py-2 px-4 transition-transform duration-300 ${
          !context.isSidebarOpen && context?.windowWidth < 992 ? "-translate-x-full" : "translate-x-0"
        }`}
        style={
          context?.windowWidth < 992
            ? { width: "min(85vw, 320px)" }
            : { width: "clamp(200px, 20vw, 300px)", maxWidth: 300 }
        }
      >
        <div className="py-2 w-full flex items-center justify-between border-b border-[rgba(0,0,0,0.08)] mb-2"
          onClick={() => {
            context?.windowWidth < 992 && context?.setisSidebarOpen(false)
          }}
        >
          <Link to="/" onClick={() => {
            setSubmenuIndex(null)
          }}>
            <img
              src={localStorage.getItem('logo')}
              className="w-[150px] md:min-w-[180px] object-contain"
            />
          </Link>
          {context?.windowWidth < 992 && (
            <button
              type="button"
              aria-label="Close Menu"
              className="w-10 h-10 rounded-full min-w-[40px] shrink-0 hover:bg-[#e2e2e2] flex items-center justify-center border border-[rgba(0,0,0,0.12)] ml-2 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                context?.setisSidebarOpen(false);
              }}
            >
              <RiMenu2Line className="text-[20px] text-[rgba(0,0,0,0.85)]" />
            </button>
          )}
        </div>

        <ul className="mt-4 overflow-y-scroll max-h-[80vh]">
          <li>
            <NavLink to="/" end
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <RxDashboard className="text-[18px]" /> <span>Tổng Quan</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/homeSlider/list"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <FaRegImage className="text-[18px]" /> <span>Slide Quảng Cáo</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <Button
              className={`w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1] ${
                (currentPath.startsWith('/category') || currentPath.startsWith('/subCategory')) ? 'active-parent' : ''
              }`}
              onClick={() => isOpenSubMenu(3)}
            >
              <TbCategory className="text-[18px]" /> <span>Danh Mục</span>
              <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                <FaAngleDown
                  className={`transition-all ${submenuIndex === 3 ? "rotate-180" : ""
                    }`}
                />
              </span>
            </Button>

            <Collapse isOpened={submenuIndex === 3 ? true : false}>
              <ul className="w-full">
                <li className="w-full">
                  <NavLink to="/category/list" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>{" "}
                      Danh Mục Chính
                    </Button>
                  </NavLink>
                </li>
                <li className="w-full">
                  <NavLink to="/subCategory/list" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                      Danh Mục Phụ
                    </Button>
                  </NavLink>
                </li>
              </ul>
            </Collapse>
          </li>

          <li>
            <NavLink to="/products"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <RiProductHuntLine className="text-[18px]" /> <span>Sản Phẩm</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/users"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <FiUsers className="text-[18px]" /> <span>Thành Viên & Quyền</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/orders"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <IoBagCheckOutline className="text-[20px]" /> <span>Đơn Hàng</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/coupons"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <MdOutlineDiscount className="text-[20px]" /> <span>Mã Giảm Giá</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/rightBanner/List"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <RiProductHuntLine className="text-[18px]" /> <span>Banner</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/blog/List"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <SiBloglovin className="text-[18px]" /> <span>Blog</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <NavLink to="/logo/manage"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button
                className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              >
                <IoLogoBuffer className="text-[18px]" />
                <span>Logo</span>
              </Button>
            </NavLink>
          </li>

          <li>
            <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]" onClick={logout}>
              <IoMdLogOut className="text-[20px]" /> <span>Đăng Xuất</span>
            </Button>
          </li>
        </ul>
      </div>

      {
        context?.windowWidth < 992 && context?.isSidebarOpen === true &&
        <div className="sidebarOverlay fixed top-0 left-0 bg-[rgba(0,0,0,0.45)] w-full h-full z-[51]" role="presentation" onClick={() => {
            context?.setisSidebarOpen(false)
            setSubmenuIndex(null)
          }}>
        </div>
      }
    </>
  );
};

export default Sidebar;
