import { Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const canManageAccess = context?.userData?.role === "SUPERBOSS";


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
        <div className="py-2 w-full"
          onClick={() => {
            context?.windowWidth < 992 && context?.setisSidebarOpen(false)
            setSubmenuIndex(null)
          }}
        >
          <Link to="/">
            <img
            src={localStorage.getItem('logo')}
              className="w-[170px] md:min-w-[200px]"
            />
          </Link>
        </div>

        <ul className="mt-4 overflow-y-scroll max-h-[80vh]">
          <li>
            <Link to="/"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <RxDashboard className="text-[18px]" /> <span>Tổng quan</span>
              </Button>
            </Link>
          </li>

          <li>
            <Button
              className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              onClick={() => isOpenSubMenu(1)}
            >
              <FaRegImage className="text-[18px]" /> <span>Slide trang chủ</span>
              <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                <FaAngleDown
                  className={`transition-all ${submenuIndex === 1 ? "rotate-180" : ""
                    }`}
                />
              </span>
            </Button>

            <Collapse isOpened={submenuIndex === 1 ? true : false}>
              <ul className="w-full">
                <li className="w-full">
                  <Link to="/homeSlider/list"
                    onClick={() => {
                      context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                      setSubmenuIndex(null)
                    }}
                  >
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>{" "}
                      Danh sách banner trang chủ
                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: 'Add Home Slide'
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm slide banner trang chủ
                  </Button>
                </li>
              </ul>
            </Collapse>
          </li>


          <li>
            <Button
              className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              onClick={() => isOpenSubMenu(3)}
            >
              <TbCategory className="text-[18px]" /> <span>Danh mục</span>
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
                  <Link to="/category/list" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>{" "}
                      Danh sách danh mục

                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: 'Add New Category'
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm danh mục
                  </Button>
                </li>
                <li className="w-full">
                  <Link to="/subCategory/list" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                      Danh sách danh mục con
                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: 'Add New Sub Category'
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm danh mục con
                  </Button>
                </li>
              </ul>
            </Collapse>
          </li>

          <li>
            <Button
              className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              onClick={() => isOpenSubMenu(4)}
            >
              <RiProductHuntLine className="text-[18px]" />{" "}
              <span>Sản phẩm</span>
              <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                <FaAngleDown
                  className={`transition-all ${submenuIndex === 4 ? "rotate-180" : ""
                    }`}
                />
              </span>
            </Button>

            <Collapse isOpened={submenuIndex === 4 ? true : false}>
              <ul className="w-full">
                <li className="w-full">
                  <Link to="/products" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>{" "}
                      Danh sách sản phẩm
                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: "Add Product"
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm sản phẩm
                  </Button>
                </li>





              </ul>
            </Collapse>
          </li>



          <li>
            <Link to="/users"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <FiUsers className="text-[18px]" /> <span>Người dùng</span>
              </Button>
            </Link>
          </li>


          {
            canManageAccess &&
            <li>
              <Link to="/access-control"
                onClick={() => {
                  context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                  setSubmenuIndex(null)
                }}
              >
                <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                  <MdAdminPanelSettings className="text-[20px]" /> <span>Phân quyền</span>
                </Button>
              </Link>
            </li>
          }


          <li>
            <Link to="/orders"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <IoBagCheckOutline className="text-[20px]" /> <span>Đơn hàng</span>
              </Button>
            </Link>
          </li>

          <li>
            <Link to="/coupons"
              onClick={() => {
                context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                setSubmenuIndex(null)
              }}
            >
              <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]">
                <MdOutlineDiscount className="text-[20px]" /> <span>Mã Giảm Giá</span>
              </Button>
            </Link>
          </li>




          <li>
            <Button
              className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              onClick={() => isOpenSubMenu(5)}
            >
              <RiProductHuntLine className="text-[18px]" />
              <span>Banner</span>
              <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                <FaAngleDown
                  className={`transition-all ${submenuIndex === 5 ? "rotate-180" : ""
                    }`}
                />
              </span>
            </Button>

            <Collapse isOpened={submenuIndex === 5 ? true : false}>
              <ul className="w-full">
                <li className="w-full">
                  <Link to="/rightBanner/List"
                    onClick={() => {
                      context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                      setSubmenuIndex(null)
                    }}
                  >
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>{" "}
                      Danh sách banner phải
                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: "addRightBanner"
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm banner phải
                  </Button>
                </li>
              </ul>
            </Collapse>
          </li>


          <li>
            <Button
              className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              onClick={() => isOpenSubMenu(6)}
            >
              <SiBloglovin className="text-[18px]" />
              <span>Blog</span>
              <span className="ml-auto w-[30px] h-[30px] flex items-center justify-center">
                <FaAngleDown
                  className={`transition-all ${submenuIndex === 6 ? "rotate-180" : ""
                    }`}
                />
              </span>
            </Button>

            <Collapse isOpened={submenuIndex === 6 ? true : false}>
              <ul className="w-full">
                <li className="w-full">
                  <Link to="/blog/List" onClick={() => {
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3">
                      <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                      Danh sách bài viết
                    </Button>
                  </Link>
                </li>
                <li className="w-full">
                  <Button className="!text-[rgba(0,0,0,0.7)] !capitalize !justify-start !w-full !text-[13px] !font-[500] !pl-9 flex gap-3" onClick={() => {
                    context.setIsOpenFullScreenPanel({
                      open: true,
                      model: "Add Blog"
                    })
                    context?.windowWidth < 992 && context?.setisSidebarOpen(false)
                    setSubmenuIndex(null)
                  }}>
                    <span className="block w-[5px] h-[5px] rounded-full bg-[rgba(0,0,0,0.2)]"></span>
                    Thêm bài viết
                  </Button>
                </li>


              </ul>
            </Collapse>
          </li>


          <li>
            <Link to="/logo/manage">
              <Button
                className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]"
              >
                <IoLogoBuffer className="text-[18px]" />
                <span>Quản lý logo</span>
              </Button>
            </Link>
          </li>

          <li>
            <Button className="w-full !capitalize !justify-start flex gap-3 text-[14px] !text-[rgba(0,0,0,0.8)] !font-[500] items-center !py-2 hover:!bg-[#f1f1f1]" onClick={logout}>
              <IoMdLogOut className="text-[20px]" /> <span>Đăng xuất</span>
            </Button>
          </li>
        </ul>



      </div>


      {
        context?.windowWidth < 920 && context?.isSidebarOpen === true &&
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
