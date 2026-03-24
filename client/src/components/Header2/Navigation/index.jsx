import Button from "@mui/material/Button";
import React, { useContext, useEffect, useState } from "react";
import { RiMenu2Fill } from "react-icons/ri";
import { LiaAngleDownSolid } from "react-icons/lia";
import { Link } from "react-router-dom";
import CategoryPanel from "./CategoryPanel";

import "./style.css";
import { MyContext } from "../../../App";
import MobileNav from "./MobileNav";

const Navigation = (props) => {
  const [isOpenCatPanel, setIsOpenCatPanel] = useState(false);
  const [catData, setCatData] = useState([]);

  const context = useContext(MyContext);

  useEffect(() => {
    setCatData(context?.catData);
  }, [context?.catData]);

  useEffect(() => {
    setIsOpenCatPanel(props.isOpenCatPanel);
  }, [props.isOpenCatPanel]);

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
          <div className="col_1">
            <Button
              className="!text-black gap-2 !normal-case !font-[500] !text-[14px]"
              onClick={openCategoryPanel}
            >
              <RiMenu2Fill className="text-[16px]" />
              Categories
              <LiaAngleDownSolid className="text-[12px] ml-1" />
            </Button>
          </div>

          {/* Nav links */}
          <ul className="flex items-center gap-1 nav m-0 p-0">
            <li className="list-none">
              <Link to="/">
                <Button className="link !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] !normal-case !text-[14px]">
                  Home
                </Button>
              </Link>
            </li>
            <li className="list-none">
              <Link to="/products">
                <Button className="link !font-[500] !text-[rgba(0,0,0,0.8)] hover:!text-[#ff5252] !normal-case !text-[14px]">
                  Products
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
