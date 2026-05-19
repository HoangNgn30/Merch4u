import React, { useContext, useEffect, useState } from "react";

import MyListItems from "./myListItems";
import AccountSidebar from "../../components/AccountSidebar";
import { MyContext } from "../../App";
import EmptyState from "../../components/EmptyState";

const MyList = () => {

  const context = useContext(MyContext);

  useEffect(()=>{
    window.scrollTo(0,0);
  },[]);

  return (
    <section className="py-4 lg:py-6 pb-20 w-full">
      <div className="container flex flex-col md:flex-row gap-5">
        <div className="col1 w-full md:w-[20%] hidden lg:block">
          <AccountSidebar />
        </div>

        <div className="col2 w-full lg:w-[70%]">
          <div className="shadow-md rounded-md bg-white">
            <div className="py-5 px-3 border-b border-[rgba(0,0,0,0.1)]">
              <h2>Danh sách yêu thích</h2>
              <p className="mt-0 mb-0">
                Có <span className="font-bold text-primary">{context?.myListData?.length}</span>{" "}
                sản phẩm đã thích
              </p>
            </div>


            {
              context?.myListData?.length !== 0 ? context?.myListData?.map((item, index) => {
                return (
                  <MyListItems item={item} />
                )
              })

                :

                <EmptyState
                  type="wishlist"
                  title="Danh sách yêu thích đang trống"
                  message="Bấm trái tim trên sản phẩm để lưu lại những món bạn đang cân nhắc."
                  actionLabel="Khám phá sản phẩm"
                  actionTo="/products"
                />

            }


          </div>
        </div>
      </div>
    </section>
  );
};

export default MyList;
