import React, { useContext, useEffect, useState } from 'react';
import { Button, useTheme } from "@mui/material";
import { IoMdAdd } from "react-icons/io";
import Rating from '@mui/material/Rating';
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import { Link } from "react-router-dom";
import Progress from "../../Components/ProgressBar";
import { AiOutlineEdit } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
import { fetchDataFromApi, deleteData, deleteMultipleData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import CircularProgress from '@mui/material/CircularProgress';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";


const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "product", label: "Sản Phẩm", minWidth: 150 },
    { id: "category", label: "Danh Mục", minWidth: 100, align: "center" },
    {
        id: "subcategory",
        label: "Danh Mục Phụ",
        minWidth: 150,
        align: "center",
    },
    {
        id: "price",
        label: "Giá",
        minWidth: 130,
        align: "center",
    },
    {
        id: "sales",
        label: "Đã Bán",
        minWidth: 100,
        align: "center",
    },
    {
        id: "stock",
        label: "Tồn Kho",
        minWidth: 100,
        align: "center",
    },
    {
        id: "rating",
        label: "Đánh Giá",
        minWidth: 100,
        align: "center",
    },
    {
        id: "action",
        label: "Thao Tác",
        minWidth: 120,
        align: "center",
    },
];

export const Products = () => {
    const [productCat, setProductCat] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(50);

    const [productData, setProductData] = useState([]);
    const [productTotalData, setProductTotalData] = useState([]);

    const [productSubCat, setProductSubCat] = React.useState('');
    const [productThirdLavelCat, setProductThirdLavelCat] = useState('');
    const [sortedIds, setSortedIds] = useState([]);
    const [isLoading, setIsloading] = useState(false);

    const [pageOrder, setPageOrder] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const [photos, setPhotos] = useState([]);
    const [open, setOpen] = useState(false);

    const context = useContext(MyContext);

    useEffect(() => {
        getProducts(page, rowsPerPage);
    }, [context?.isOpenFullScreenPanel, page, rowsPerPage])



    useEffect(() => {
        // Filter products based on search query
        if (searchQuery !== "") {
            const filteredProducts = productTotalData?.products?.filter((product) =>
                product._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product?.catName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product?.subCat?.toLowerCase().includes(searchQuery.toLowerCase())
            ) || [];
            setProductData({
                error: false,
                success: true,
                products: filteredProducts,
                total: filteredProducts?.length,
                page: parseInt(page),
                totalPages: Math.ceil(filteredProducts?.length / rowsPerPage),
                totalCount: productData?.totalCount
            });

        } else {
            getProducts(page, rowsPerPage);
        }

    }, [searchQuery])



    // Handler to toggle all checkboxes
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;

        // Update all items' checked status
        const updatedItems = productData?.products?.map((item) => ({
            ...item,
            checked: isChecked,
        }));
        setProductData({
            error: false,
            success: true,
            products: updatedItems,
            total: updatedItems?.length,
            page: parseInt(page),
            totalPages: Math.ceil(updatedItems?.length / rowsPerPage),
            totalCount: productData?.totalCount
        });

        // Update the sorted IDs state
        if (isChecked) {
            const ids = updatedItems.map((item) => item._id).sort((a, b) => a - b);
            setSortedIds(ids);
        } else {
            setSortedIds([]);
        }
    };


    // Handler to toggle individual checkboxes
    const handleCheckboxChange = (e, id, index) => {

        const updatedItems = productData?.products?.map((item) =>
            item._id === id ? { ...item, checked: !item.checked } : item
        );
        setProductData({
            error: false,
            success: true,
            products: updatedItems,
            total: updatedItems?.length,
            page: parseInt(page),
            totalPages: Math.ceil(updatedItems?.length / rowsPerPage),
            totalCount: productData?.totalCount
        });



        // Update the sorted IDs state
        const selectedIds = updatedItems
            .filter((item) => item.checked)
            .map((item) => item._id)
            .sort((a, b) => a - b);
        setSortedIds(selectedIds);
    };


    const getProducts = async (page, limit) => {

        setIsloading(true)
        fetchDataFromApi(`/api/product/getAllProducts?page=${page + 1}&limit=${limit}`).then((res) => {
            setProductData(res)

            setProductTotalData(res)
            setIsloading(false)

            let arr = [];

            for (let i = 0; i < res?.products?.length; i++) {
                arr.push({
                    src: res?.products[i]?.images[0]
                })
            }

            setPhotos(arr);

        })
    }

    const handleChangeProductCat = (event) => {
        if (event.target.value !== null) {
            setProductCat(event.target.value);
            setProductSubCat('');
            setProductThirdLavelCat('');
            setIsloading(true)
            fetchDataFromApi(`/api/product/getAllProductsByCatId/${event.target.value}`).then((res) => {
                if (res?.error === false) {
                    setProductData({
                        error: false,
                        success: true,
                        products: res?.products,
                        total: res?.products?.length,
                        page: parseInt(page),
                        totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                        totalCount: res?.products?.length
                    });
                } else {
                    context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                }
                setTimeout(() => {
                    setIsloading(false)
                }, 300);
            })
        } else {
            getProducts(0, 50);
            setProductSubCat('');
            setProductCat(event.target.value);
            setProductThirdLavelCat('');
        }

    };


    const handleChangeProductSubCat = (event) => {
        if (event.target.value !== null) {
            setProductSubCat(event.target.value);
            setProductThirdLavelCat('');
            setIsloading(true)
            fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${event.target.value}`).then((res) => {
                if (res?.error === false) {
                    setProductData({
                        error: false,
                        success: true,
                        products: res?.products,
                        total: res?.products?.length,
                        page: parseInt(page),
                        totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                        totalCount: res?.products?.length
                    });
                } else {
                    context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                }
                setTimeout(() => {
                    setIsloading(false)
                }, 500);
            })
        } else {
            setProductSubCat(event.target.value);
            setProductThirdLavelCat('');
            if (productCat) {
                setIsloading(true)
                fetchDataFromApi(`/api/product/getAllProductsByCatId/${productCat}`).then((res) => {
                    if (res?.error === false) {
                        setProductData({
                            error: false,
                            success: true,
                            products: res?.products,
                            total: res?.products?.length,
                            page: parseInt(page),
                            totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                            totalCount: res?.products?.length
                        });
                    } else {
                        context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                    }
                    setTimeout(() => {
                        setIsloading(false)
                    }, 500);
                })
            } else {
                getProducts(0, 50);
            }
        }
    };

    const handleChangeProductThirdLavelCat = (event) => {
        if (event.target.value !== null) {
            setProductThirdLavelCat(event.target.value);
            setIsloading(true)
            fetchDataFromApi(`/api/product/getAllProductsByThirdLavelCat/${event.target.value}`).then((res) => {
                console.log(res)
                if (res?.error === false) {
                    setProductData({
                        error: false,
                        success: true,
                        products: res?.products,
                        total: res?.products?.length,
                        page: parseInt(page),
                        totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                        totalCount: res?.products?.length
                    });
                } else {
                    context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                }
                setTimeout(() => {
                    setIsloading(false)
                }, 300);
            })
        } else {
            setProductThirdLavelCat(event.target.value);
            if (productSubCat) {
                setIsloading(true)
                fetchDataFromApi(`/api/product/getAllProductsBySubCatId/${productSubCat}`).then((res) => {
                    if (res?.error === false) {
                        setProductData({
                            error: false,
                            success: true,
                            products: res?.products,
                            total: res?.products?.length,
                            page: parseInt(page),
                            totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                            totalCount: res?.products?.length
                        });
                    } else {
                        context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                    }
                    setTimeout(() => {
                        setIsloading(false)
                    }, 300);
                })
            } else if (productCat) {
                setIsloading(true)
                fetchDataFromApi(`/api/product/getAllProductsByCatId/${productCat}`).then((res) => {
                    if (res?.error === false) {
                        setProductData({
                            error: false,
                            success: true,
                            products: res?.products,
                            total: res?.products?.length,
                            page: parseInt(page),
                            totalPages: Math.ceil(res?.products?.length / rowsPerPage),
                            totalCount: res?.products?.length
                        });
                    } else {
                        context.alertBox("error", res?.message || "Không thể tải danh sách sản phẩm");
                    }
                    setTimeout(() => {
                        setIsloading(false)
                    }, 300);
                })
            } else {
                getProducts(0, 50);
            }
        }
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };


    const deleteProduct = (id) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            context?.showConfirmDelete(
                "Xóa sản phẩm?",
                "Bạn có chắc chắn muốn xóa sản phẩm này?",
                () => {
                    deleteData(`/api/product/${id}`).then((res) => {
                        getProducts();
                        context.alertBox("success", "Product deleted");

                    })
                }
            )
        } else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    }


    const deleteMultipleProduct = () => {

        if (sortedIds.length === 0) {
            context.alertBox('error', 'Vui lòng chọn mục cần xóa.');
            return;
        }


        context?.showConfirmDelete(
            "Xóa các sản phẩm đã chọn?",
            `Bạn có chắc chắn muốn xóa ${sortedIds.length} sản phẩm đã chọn?`,
            () => {
                try {
                    deleteMultipleData(`/api/product/deleteMultiple`, {
                        data: { ids: sortedIds },
                    }).then((res) => {
                        getProducts();
                        context.alertBox("success", "Product deleted");
                        setSortedIds([]);

                    })

                } catch (error) {
                    context.alertBox('error', 'Error deleting items.');
                }
            }
        )


    }



    const handleChangePage = (event, newPage) => {
        getProducts(page, rowsPerPage);
        setPage(newPage);
    };

    return (
        <>
            <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="flex items-center w-full px-5 pb-4 justify-between">
                    <div className="col">
                        <h2 className="text-[18px] font-[600]">
                            Danh Sách Sản Phẩm
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center justify-end gap-3">
                        {
                            sortedIds?.length !== 0 && <Button variant="contained" className="btn-sm" size="small" color="error"
                                onClick={deleteMultipleProduct}>Xóa</Button>
                        }
                        <Button className="btn-blue !text-white btn-sm"
                            onClick={() => context.setIsOpenFullScreenPanel({
                                open: true,
                                model: 'Add Product'
                            })}>Thêm Sản Phẩm Mới</Button>
                    </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2  md:grid-cols-2 lg:grid-cols-4 w-full px-5 justify-beetween gap-4">
                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Chính</h4>
                        {
                            context?.catData?.length !== 0 &&
                            <Select
                                style={{ zoom: '80%' }}
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productCat}
                                label="Category"
                                onChange={handleChangeProductCat}
                            >
                                <MenuItem value={null}>None</MenuItem>
                                {
                                    context?.catData?.map((cat, index) => {
                                        return (
                                            <MenuItem key={cat?._id || index} value={cat?._id}>{cat?.name}</MenuItem>
                                        )
                                    })
                                }

                            </Select>
                        }
                    </div>


                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Cấp 2</h4>
                        {
                            context?.catData?.length !== 0 &&
                            <Select
                                style={{ zoom: '80%' }}
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productSubCat}
                                label="Sub Category"
                                onChange={handleChangeProductSubCat}
                            >
                                <MenuItem value={null}>None</MenuItem>
                                {
                                    context?.catData?.filter(cat => cat._id === productCat).map((cat, index) => (
                                        <React.Fragment key={cat?._id || index}>
                                            {cat?.children?.length !== 0 && cat?.children?.map((subCat, index_) => (
                                                <MenuItem value={subCat?._id} key={subCat?._id || index_}>
                                                    {subCat?.name}
                                                </MenuItem>
                                            ))}
                                        </React.Fragment>
                                    ))
                                }

                            </Select>
                        }
                    </div>


                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Cấp 3</h4>
                        {
                            context?.catData?.length !== 0 &&
                            <Select
                                style={{ zoom: '80%' }}
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productThirdLavelCat}
                                label="Sub Category"
                                onChange={handleChangeProductThirdLavelCat}
                            >
                                <MenuItem value={null}>None</MenuItem>
                                {
                                    context?.catData?.filter(cat => cat._id === productCat).map((cat, index) => (
                                        <React.Fragment key={cat?._id || index}>
                                            {cat?.children?.length !== 0 && cat?.children?.filter(subCat => subCat._id === productSubCat).map((subCat, index_) => (
                                                <React.Fragment key={subCat?._id || index_}>
                                                    {subCat?.children?.length !== 0 && subCat?.children?.map((thirdLavelCat, index__) => (
                                                        <MenuItem value={thirdLavelCat?._id} key={thirdLavelCat?._id || index__}>
                                                            {thirdLavelCat?.name}
                                                        </MenuItem>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))
                                }

                            </Select>
                        }

                    </div>


                    <div className="col w-full ml-auto flex items-center">
                        <div style={{ alignSelf: 'end' }} className="w-full">
                            <SearchBox
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                setPageOrder={setPageOrder}
                            />
                        </div>
                    </div>

                </div>

                <br />
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ width: 60, minWidth: 60 }} className="!pl-4">
                                    <Checkbox {...label} size="small"
                                        onChange={handleSelectAll}
                                        checked={productData?.products?.length > 0 ? productData?.products?.every((item) => item.checked) : false}
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>

                            {
                                isLoading === false ? productData?.products?.length !== 0 && productData?.products?.map((product, index) => {
                                    return (
                                        <TableRow key={index} className={`hover:bg-slate-50/80 transition-colors ${product.checked === true ? '!bg-indigo-50/50' : ''}`}>
                                            <TableCell style={{ width: 60, minWidth: 60 }} className="!pl-4">
                                                <Checkbox {...label} size="small" checked={product.checked === true ? true : false}
                                                    onChange={(e) => handleCheckboxChange(e, product._id, index)}
                                                    className="text-indigo-600"
                                                />
                                            </TableCell>
                                            <TableCell style={{ minWidth: 150 }}>
                                                <div className="flex items-center gap-4 w-[320px]" title={product?.name}>
                                                    <div className="img relative w-[65px] h-[65px] rounded-xl overflow-hidden group cursor-pointer shadow-md border border-slate-100" onClick={() => setOpen(true)}>
                                                        <LazyLoadImage
                                                            alt={"image"}
                                                            effect="blur"
                                                            src={product?.images[0]}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                                                        />
                                                    </div>
                                                    <div className="info w-[75%] flex flex-col gap-0.5">
                                                        <h3 className="font-[600] text-[13px] text-slate-800 leading-snug hover:text-indigo-600 transition-colors">
                                                            <Link to={`/product/${product?._id}`}>
                                                                {product?.name?.length > 48 ? product?.name?.substr(0, 45) + '...' : product?.name}
                                                            </Link>
                                                        </h3>
                                                        <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">{product?.brand || "No Brand"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell style={{ minWidth: 100 }} align="center">
                                                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                                                    {product?.catName}
                                                </span>
                                            </TableCell>

                                            <TableCell style={{ minWidth: 150 }} align="center">
                                                {product?.subCat ? (
                                                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                                                        {product?.subCat}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-[12px] italic">-</span>
                                                )}
                                            </TableCell>

                                            <TableCell style={{ minWidth: 130 }} align="center">
                                                <div className="flex gap-0.5 flex-col items-center justify-center">
                                                    {product?.oldPrice > product?.price && (
                                                        <span className="oldPrice line-through text-slate-400 text-[12px] font-[500]">
                                                            {product?.oldPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                                        </span>
                                                    )}
                                                    <span className="price text-indigo-600 text-[14px] font-[700]">
                                                        {product?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell style={{ minWidth: 100 }} align="center">
                                                {product?.sale > 20 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        {product?.sale}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                                        {product?.sale || 0}
                                                    </span>
                                                )}
                                            </TableCell>


                                            <TableCell style={{ minWidth: 100 }} align="center">
                                                {product?.countInStock === 0 ? (
                                                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                        0
                                                    </span>
                                                ) : product?.countInStock < 10 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                        {product?.countInStock}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {product?.countInStock}
                                                    </span>
                                                )}
                                            </TableCell>


                                            <TableCell style={{ minWidth: 100 }} align="center">
                                                <div className="flex justify-center">
                                                    <Rating name="half-rating" size="small" defaultValue={product?.rating} readOnly className="text-amber-400" />
                                                </div>
                                            </TableCell>

                                            <TableCell style={{ minWidth: 120 }} align="center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button className="w-[32px] h-[32px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'Edit Product',
                                                            id: product?._id
                                                        })}
                                                        title="Sửa Sản Phẩm"
                                                    >
                                                        <AiOutlineEdit className="text-[18px]" />
                                                    </button>

                                                    <Link to={`/product/${product?._id}`} title="Xem chi tiết">
                                                        <button className="w-[32px] h-[32px] bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300">
                                                            <FaRegEye className="text-[16px]" />
                                                        </button>
                                                    </Link>

                                                    <button className="w-[32px] h-[32px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => deleteProduct(product?._id)}
                                                        title="Xóa Sản Phẩm"
                                                    >
                                                        <GoTrash className="text-[16px]" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })


                                    :

                                    <>
                                        <TableRow>
                                            <TableCell colSpan={9}>
                                                <div className="flex items-center justify-center w-full min-h-[400px]">
                                                    <CircularProgress color="inherit" />
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                    </>
                            }



                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    labelRowsPerPage="Số hàng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong số ${count !== -1 ? count : `hơn ${to}`}`}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                    component="div"
                    count={Number(productData?.totalCount) || Number(productData?.total) || (Number(productData?.totalPages) * rowsPerPage) || 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </div>


            <Lightbox
                open={open}
                close={() => setOpen(false)}
                slides={photos}
            />


        </>
    )
}

export default Products;
