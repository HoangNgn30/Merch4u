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
    { id: "product", label: "Sản phẩm", minWidth: 150 },
    { id: "category", label: "Danh mục", minWidth: 100, align: "center" },
    {
        id: "subcategory",
        label: "Danh mục con",
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
        label: "Đã bán",
        minWidth: 100,
        align: "center",
    },
    {
        id: "stock",
        label: "Tồn kho",
        minWidth: 100,
        align: "center",
    },
    {
        id: "rating",
        label: "Đánh giá",
        minWidth: 100,
        align: "center",
    },
    {
        id: "action",
        label: "Thao tác",
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

                    setTimeout(() => {
                        setIsloading(false)
                    }, 300);
                }
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
                    setTimeout(() => {
                        setIsloading(false)
                    }, 500);
                }
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
                        setTimeout(() => {
                            setIsloading(false)
                        }, 500);
                    }
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
                    setTimeout(() => {
                        setIsloading(false)
                    }, 300);
                }
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
                        setTimeout(() => {
                            setIsloading(false)
                        }, 300);
                    }
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
                        setTimeout(() => {
                            setIsloading(false)
                        }, 300);
                    }
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
            context.alertBox("error", "Only admin can delete data");
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
                            Danh sách sản phẩm
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
                            })}>Thêm sản phẩm</Button>
                    </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2  md:grid-cols-2 lg:grid-cols-4 w-full px-5 justify-beetween gap-4">
                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Lớn</h4>
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
                                            <MenuItem value={cat?._id}>{cat?.name}</MenuItem>
                                        )
                                    })
                                }

                            </Select>
                        }
                    </div>


                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Phụ</h4>
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
                                    context?.catData?.filter(cat => cat._id === productCat).map((cat, index) => {
                                        return (
                                            cat?.children?.length !== 0 && cat?.children?.map((subCat, index_) => {
                                                return (
                                                    <MenuItem value={subCat?._id} key={index_}>
                                                        {subCat?.name}</MenuItem>
                                                )
                                            })

                                        )
                                    })
                                }

                            </Select>
                        }
                    </div>


                    <div className="col">
                        <h4 className="font-[600] text-[13px] mb-2">Danh Mục Con</h4>
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
                                    context?.catData?.filter(cat => cat._id === productCat).map((cat) => {
                                        return (
                                            cat?.children?.length !== 0 && cat?.children?.filter(subCat => subCat._id === productSubCat).map((subCat) => {
                                                return (
                                                    subCat?.children?.length !== 0 && subCat?.children?.map((thirdLavelCat, index) => {
                                                        return <MenuItem value={thirdLavelCat?._id} key={index}
                                                        >{thirdLavelCat?.name}</MenuItem>
                                                    })

                                                )
                                            })

                                        )
                                    })
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
                                <TableCell>
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
                                        <TableRow key={index} className={product.checked === true ? '!bg-[#1976d21f]' : ''}>
                                            <TableCell style={{ minWidth: columns.minWidth }}>
                                                <Checkbox {...label} size="small" checked={product.checked === true ? true : false}
                                                    onChange={(e) => handleCheckboxChange(e, product._id, index)}
                                                />
                                            </TableCell>
                                            <TableCell style={{ minWidth: columns.minWidth }}>
                                                <div className="flex items-center gap-4 w-[300px]" title={product?.name}>
                                                    <div className="img w-[65px] h-[65px] rounded-md overflow-hidden group cursor-pointer" onClick={() => setOpen(true)}>
                                                        <LazyLoadImage
                                                            alt={"image"}
                                                            effect="blur"
                                                            src={product?.images[0]}
                                                            className="w-full group-hover:scale-105 transition-all"
                                                        />
                                                    </div>
                                                    <div className="info w-[75%]">
                                                        <h3 className="font-[600] text-[12px] leading-4 hover:text-primary">
                                                            <Link to={`/product/${product?._id}`}>
                                                                {product?.name?.substr(0, 50) + '...'}
                                                            </Link>
                                                        </h3>
                                                        <span className="text-[12px]">{product?.brand}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                {product?.catName}
                                            </TableCell>

                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                {product?.subCat}
                                            </TableCell>

                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                <div className="flex gap-1 flex-col items-center justify-center">
                                                    <span className="oldPrice line-through leading-3 text-gray-500 text-[14px] font-[500]">
                                                        {product?.oldPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                                    </span>
                                                    <span className="price text-primary text-[14px]  font-[600]">
                                                        {product?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                <p className="text-[14px] w-[70px] mx-auto text-center">
                                                    <span className="font-[600]">{product?.sale}</span>
                                                </p>


                                            </TableCell>


                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                <p className="text-[14px] w-[70px] mx-auto text-center">
                                                    <span className="font-[600] text-primary">{product?.countInStock}</span>
                                                </p>


                                            </TableCell>


                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                <p className="text-[14px] w-[100px] mx-auto flex justify-center">
                                                    <Rating name="half-rating" size="small" defaultValue={product?.rating} readOnly />
                                                </p>


                                            </TableCell>

                                            <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:!bg-[#e2e2e2] flex items-center justify-center transition-all"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'Edit Product',
                                                            id: product?._id
                                                        })}
                                                    >
                                                        <AiOutlineEdit className="text-[rgba(0,0,0,0.7)] text-[20px] " />
                                                    </button>

                                                    <Link to={`/product/${product?._id}`}>
                                                        <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:!bg-[#e2e2e2] flex items-center justify-center transition-all">
                                                            <FaRegEye className="text-[rgba(0,0,0,0.7)] text-[18px] " />
                                                        </button>
                                                    </Link>

                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:!bg-[#e2e2e2] flex items-center justify-center transition-all" onClick={() => deleteProduct(product?._id)}>
                                                        <GoTrash className="text-[rgba(0,0,0,0.7)] text-[18px] " />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })


                                    :

                                    <>
                                        <TableRow>
                                            <TableCell colspan={8}>
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
                    rowsPerPageOptions={[50, 100, 150, 200]}
                    component="div"
                    count={productData?.totalPages * rowsPerPage}
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
