import React, { useContext, useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import ProductItem from "../../components/ProductItem";
import ProductItemListView from "../../components/ProductItemListView";
import Button from "@mui/material/Button";
import { IoGridSharp } from "react-icons/io5";
import { LuMenu, LuChevronsUpDown } from "react-icons/lu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import ProductLoadingGrid from "../../components/ProductLoading/productLoadingGrid";
import { postData } from "../../utils/api";
import { MyContext } from "../../App";

const SEARCH_PAGE_LIMIT = 24;

const SearchPage = () => {
  const [itemView, setItemView] = useState("grid");
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [productsData, setProductsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedSortVal, setSelectedSortVal] = useState("Tên, A đến Z");

  const skipSearchPageFetchRef = useRef(false);

  const context = useContext(MyContext);
  const activeSearchData = context?.searchData && !Array.isArray(context?.searchData)
    ? context.searchData
    : null;
  const activeSearchQuery = activeSearchData?.query || "";
  const activeSearchPage = activeSearchData?.page || 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  useEffect(() => {
    if (!activeSearchData) return;

    setProductsData(activeSearchData);
    setTotalPages(activeSearchData?.totalPages || 1);
    setIsLoading(false);

    if (activeSearchPage !== page) {
      skipSearchPageFetchRef.current = true;
      setPage(activeSearchPage);
    }
  }, [activeSearchData]);

  useEffect(() => {
    if (!activeSearchQuery) return;

    if (skipSearchPageFetchRef.current) {
      skipSearchPageFetchRef.current = false;
      return;
    }

    if (activeSearchPage === page) return;

    let isActive = true;
    setIsLoading(true);

    postData("/api/product/search/get", {
      query: activeSearchQuery,
      page,
      limit: SEARCH_PAGE_LIMIT,
    }).then((res) => {
      if (!isActive) return;

      const nextSearchData = {
        ...(res || {}),
        query: activeSearchQuery,
      };

      context?.setSearchData(nextSearchData);
      setProductsData(nextSearchData);
      setTotalPages(nextSearchData?.totalPages || 1);
      setIsLoading(false);
      window.scrollTo(0, 0);
    });

    return () => {
      isActive = false;
    };
  }, [page, activeSearchPage, activeSearchQuery]);


  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };



  const handleSortBy = (name, order, products, value) => {
    setSelectedSortVal(value);
    postData(`/api/product/sortBy`, {
      products: products,
      sortBy: name,
      order: order
    }).then((res) => {
      setProductsData(res);
      setAnchorEl(null);
    })
  }

  return (
    <section className=" pb-0">

      <div className="bg-white p-2">
        <div className="container flex gap-3">
          <div className={`sidebarWrapper fixed -bottom-[100%] left-0 w-fulllg:h-full lg:static lg:w-[20%] bg-white z-[102] lg:z-[100] p-3 lg:p-0  transition-all lg:opacity-100 opacity-0 ${context?.openFilter === true ? 'open' : ''}`}>
            <Sidebar
              productsData={productsData}
              setProductsData={setProductsData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              page={page}
              setTotalPages={setTotalPages}
            />
          </div>

          {
            context?.windowWidth < 992 &&
            <div className={`filter_overlay w-full h-full bg-[rgba(0,0,0,0.5)] fixed top-0 left-0 z-[101]  ${context?.openFilter === true ? 'block' : 'hidden'}`}
              onClick={()=>context?.setOpenFilter(false)}
            ></div>
          }


          <div className="rightContent w-full lg:w-[80%] py-3">
            <div className="bg-[#f1f1f1] p-2 w-full mb-4 rounded-md flex items-center justify-between">
              <div className="col1 flex items-center gap-1.5 itemViewActions">
                <button
                  className={`w-[35px] h-[35px] rounded-full flex items-center justify-center border border-gray-200/80 transition-all
                    ${itemView === "list" ? "bg-primary text-white border-primary active" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"}`}
                  onClick={() => setItemView("list")}
                  title="Xem dạng danh sách"
                >
                  <LuMenu className="text-[16px]" />
                </button>
                <button
                  className={`w-[35px] h-[35px] rounded-full flex items-center justify-center border border-gray-200/80 transition-all
                    ${itemView === "grid" ? "bg-primary text-white border-primary active" : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"}`}
                  onClick={() => setItemView("grid")}
                  title="Xem dạng lưới"
                >
                  <IoGridSharp className="text-[14px]" />
                </button>

              </div>

              <div className="col2 ml-auto flex items-center justify-end gap-3 pr-4">
                <span className="text-[14px] font-[500] pl-3 text-[rgba(0,0,0,0.7)]">
                  Sắp xếp
                </span>

                <button
                  id="basic-button"
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  className="bg-white text-[13px] text-slate-700 font-semibold px-4 py-2 border border-slate-300 hover:border-slate-400 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{selectedSortVal}</span>
                  <LuChevronsUpDown className="text-slate-500 text-[14px]" />
                </button>

                <Menu
                  id="basic-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <MenuItem
                    onClick={() => handleSortBy('name', 'asc', productsData, 'Tên, A đến Z')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Tên, A đến Z
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('name', 'desc', productsData, 'Tên, Z đến A')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Tên, Z đến A
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('price', 'asc', productsData, 'Giá tăng dần')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Giá tăng dần
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('price', 'desc', productsData, 'Giá giảm dần')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Giá giảm dần
                  </MenuItem>

                </Menu>
              </div>
            </div>

            <div
              className={`grid ${itemView === "grid"
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1"
                } gap-4`}
            >
              {itemView === "grid" ? (
                <>

                  {
                    isLoading === true ? <ProductLoadingGrid view={itemView} />
                      :

                      productsData?.products?.length !== 0 && productsData?.products?.map((item, index) => {
                        return (
                          <ProductItem key={index} item={item} />
                        )
                      })

                  }


                </>
              ) : (
                <>
                  {
                    isLoading === true ? <ProductLoadingGrid view={itemView} />
                      :

                      productsData?.products?.length !== 0 && productsData?.products?.map((item, index) => {
                        return (
                          <ProductItemListView key={index} item={item} />
                        )
                      })

                  }

                </>
              )}
            </div>

            {
              totalPages > 1 &&
              <div className="flex items-center justify-center mt-10">
                <Pagination
                  showFirstButton showLastButton
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                />
              </div>
            }


          </div>
        </div>
      </div>

    </section>
  );
};

export default SearchPage;
