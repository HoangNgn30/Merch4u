import Button from "@mui/material/Button";
import React, { useContext, useEffect, useState, useRef } from "react";
import { FiGrid } from "react-icons/fi";
import { LiaAngleDownSolid } from "react-icons/lia";
import { Link } from "react-router-dom";
import CategoryPanel from "./CategoryPanel";
import CategoryDropdown from "./CategoryDropdown";

import "./style.css";
import { MyContext } from "../../../App";
import MobileNav from "./MobileNav";

const Navigation = (props) => {
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [catData, setCatData] = useState([]);
  const dropdownRef = useRef(null);

  const context = useContext(MyContext);

  useEffect(() => {
    setCatData(context?.catData);
  }, [context?.catData]);

  useEffect(() => {
    setIsOpenCatPanel(props.isOpenCatPanel);
  }, [props.isOpenCatPanel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpenDropdown((prev) => !prev);
  };

  const openCategoryPanel = () => {
    setIsOpenCatPanel(true);
  };

  if (props.mobileOnly) {
    return (
      <>
        {catData?.length !== 0 && (
          <CategoryPanel
            isOpenCatPanel={isOpenCatPanel}
            setIsOpenCatPanel={setIsOpenCatPanel}
            propsSetIsOpenCatPanel={props.setIsOpenCatPanel}
            data={catData}
          />
        )}
        <MobileNav setIsOpenCatPanel={props.setIsOpenCatPanel} />
      </>
    );
  }

  return (
    <>
      <nav className="navigation w-full">
        <div className="flex items-center gap-4">
          {/* Categories button */}
          <div className="col_1 relative" ref={dropdownRef}>
            <Button
              className="!text-black gap-2 !normal-case !font-[500] !text-[14px] !whitespace-nowrap"
              onClick={toggleDropdown}
            >
              <FiGrid className="text-[16px] text-gray-500" />
              Danh Mục
              <LiaAngleDownSolid className={`text-[12px] ml-1 text-gray-500 transition-transform duration-200 ${isOpenDropdown ? "rotate-180" : ""}`} />
            </Button>
            {isOpenDropdown && (
              <CategoryDropdown data={catData} onClose={() => setIsOpenDropdown(false)} />
            )}
          </div>

          {/* Nav links */}
          <ul className="flex items-center gap-1 nav m-0 p-0">
            <li className="list-none">
              <Link to="/">
                <Button className="link !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] !normal-case !text-[14px] !whitespace-nowrap">
                  Trang Chủ
                </Button>
              </Link>
            </li>
            <li className="list-none">
              <Link to="/products">
                <Button className="link !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] !normal-case !text-[14px] !whitespace-nowrap">
                  Sản Phẩm
                </Button>
              </Link>
            </li>
            <li className="list-none">
              <Link to="/coupon-game">
                <Button className="link !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] !normal-case !text-[14px] !whitespace-nowrap">
                  Mã Giảm Giá
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Category panel */}
      {catData?.length !== 0 && (
        <CategoryPanel
          isOpenCatPanel={isOpenCatPanel}
          setIsOpenCatPanel={setIsOpenCatPanel}
          propsSetIsOpenCatPanel={props.setIsOpenCatPanel}
          data={catData}
        />
      )}
    </>
  );
};

export default Navigation;
