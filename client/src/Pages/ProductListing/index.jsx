import React, { useContext, useEffect, useMemo, useState } from "react";
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
import AIRecommendations from "../../components/AIRecommendations";
import { useLocation, Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState";

const ProductListing = () => {
  const [itemView, setItemView] = useState("grid");
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [productsData, setProductsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedSortVal, setSelectedSortVal] = useState("Tên, A đến Z");
  const [selectedArtist, setSelectedArtist] = useState("all");

  const context = useContext(MyContext);

  const artistOptions = useMemo(() => {
    const brands = productsData?.products?.map((item) => item?.brand).filter(Boolean) || [];
    return [...new Set(brands)].slice(0, 12);
  }, [productsData]);

  const visibleProducts = useMemo(() => {
    const products = productsData?.products || [];
    if (selectedArtist === "all") return products;
    return products.filter((item) => item?.brand === selectedArtist);
  }, [productsData, selectedArtist]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const catId = queryParams.get("catId");
  const subCatId = queryParams.get("subCatId");

  let catName = "";
  let subCatName = "";

  if (context?.catData?.length > 0) {
    if (catId) {
      const cat = context.catData.find((c) => c._id === catId);
      if (cat) catName = cat.name;
    }
    if (subCatId) {
      for (const cat of context.catData) {
        if (cat.children) {
          const subCat = cat.children.find((sc) => sc._id === subCatId);
          if (subCat) {
            subCatName = subCat.name;
            catName = cat.name;
            break;
          }
        }
      }
    }
  }


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

  useEffect(() => {
    setSelectedArtist("all");
  }, [catId, subCatId, productsData?.page]);

  return (
    <section className=" pb-0">

      <div className="bg-white p-2">
        <div className="container flex gap-3">
          <div className={`sidebarWrapper fixed -bottom-[100%] left-0 w-full lg:h-full lg:static lg:w-[20%] bg-white z-[102] lg:z-[100] p-3 lg:p-0  transition-all lg:opacity-100 opacity-0 ${context?.openFilter === true ? 'open' : ''}`}>
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
            <div className="py-2 mb-3">
              <Breadcrumbs aria-label="breadcrumb">
                <Link
                  underline="hover"
                  color="inherit"
                  to="/"
                  className="link transition !text-[14px]"
                >
                  Trang chủ
                </Link>
                {catName && (
                  <Link
                    underline="hover"
                    color="inherit"
                    to={`/products?catId=${catId || context?.catData?.find(c => c.name === catName)?._id}`}
                    className="link transition !text-[14px]"
                  >
                    {catName}
                  </Link>
                )}
                {subCatName && (
                  <span className="text-[14px] text-gray-500">
                    {subCatName}
                  </span>
                )}
                {!catName && !subCatName && (
                  <span className="text-[14px] text-gray-500">
                    Sản phẩm
                  </span>
                )}
              </Breadcrumbs>
            </div>

            <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-3 w-full mb-5 rounded-[16px] flex items-center justify-between">
              <div className="col1 flex items-center gap-1.5 itemViewActions">
                <button
                  className={`w-[35px] h-[35px] rounded-full flex items-center justify-center border border-gray-200/80 transition-all
                    ${itemView === "list" ? "bg-primary text-white border-primary active" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 border-slate-200"}`}
                  onClick={() => setItemView("list")}
                  title="Xem dạng danh sách"
                >
                  <LuMenu className="text-[16px]" />
                </button>
                <button
                  className={`w-[35px] h-[35px] rounded-full flex items-center justify-center border border-gray-200/80 transition-all
                    ${itemView === "grid" ? "bg-primary text-white border-primary active" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200 border-slate-200"}`}
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
                    onClick={() => handleSortBy('name', 'asc', productsData?.products, 'Tên, A đến Z')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Tên, A đến Z
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('name', 'desc', productsData?.products, 'Tên, Z đến A')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Tên, Z đến A
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('price', 'asc', productsData?.products, 'Giá tăng dần')}
                    className="!text-[13px] !text-[#000] !capitalize"
                  >
                    Giá tăng dần
                  </MenuItem>


                  <MenuItem
                    onClick={() => handleSortBy('price', 'desc', productsData?.products, 'Giá giảm dần')}
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

                      visibleProducts?.length !== 0 && visibleProducts?.map((item, index) => {
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

                      visibleProducts?.length !== 0 && visibleProducts?.map((item, index) => {
                        return (
                          <ProductItemListView key={index} item={item} />
                        )
                      })

                  }

                </>
              )}
            </div>

            {isLoading === false && visibleProducts?.length === 0 && (
              <EmptyState
                type="search"
                title="Không tìm thấy sản phẩm"
                message="Thử chọn nhóm khác, bộ lọc khác hoặc tìm kiếm với từ khóa ngắn hơn."
                actionLabel="Xem tất cả sản phẩm"
                actionTo="/products"
              />
            )}

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

      {/* AI Gợi ý cá nhân hóa */}
      <div className="">
        <AIRecommendations title="Gợi ý cho bạn" />
      </div>
    </section>
  );
};

export default ProductListing;
