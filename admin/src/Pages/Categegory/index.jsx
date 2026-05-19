import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import { Link } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
import { MyContext } from '../../App';
import { fetchDataFromApi, deleteData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";



const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "image", label: "HÌNH ẢNH", minWidth: 150, align: "center" },
    { id: "catName", label: "Tên danh mục", minWidth: 150, align: "center" },
    { id: "action", label: "Thao Tác", minWidth: 100, align: "center" },
];

export const CategoryList = () => {
    const [categoryFilterVal, setcategoryFilterVal] = React.useState("");
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const context = useContext(MyContext);

    useEffect(() => {
        context?.setProgress(50);
        fetchDataFromApi("/api/category").then((res) => {
            context?.setCatData(res?.data)
            context?.setProgress(100);
        })
    }, [context?.isOpenFullScreenPanel])

    const handleChangeCatFilter = (event) => {
        setcategoryFilterVal(event.target.value);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const deleteCat = (id) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            context?.showConfirmDelete(
                "Xóa danh mục?",
                "Bạn có chắc chắn muốn xóa danh mục này?",
                () => {
                    deleteData(`/api/category/${id}`).then((res) => {
                        fetchDataFromApi("/api/category").then((res) => {
                            context?.setCatData(res?.data)
                        })
                    })
                })
        } else {
            context.alertBox("error", "Only admin can delete data");
        }
    }

    return (
        <>
            <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="flex items-center w-full px-5 pb-4 justify-between">
                    <div className="col">
                        <h2 className="text-[18px] font-[600]">
                            Danh sách danh mục
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center justify-end gap-3">
                        <Button className="btn-blue btn !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add New Category'
                        })}>Thêm danh mục</Button>
                    </div>
                </div>


                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>

                                {columns.map((column) => (
                                    <TableCell
                                        width={column.minWidth}
                                        key={column.id}
                                        align={column.align}

                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                context?.catData?.length !== 0 && context?.catData?.map((item, index) => {
                                    return (
                                        <TableRow key={index}>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-4 w-[50px] mx-auto">
                                                    <div className="img w-full rounded-md overflow-hidden group">
                                                        <Link to="/product/45745" data-discover="true">
                                                            <LazyLoadImage
                                                                alt={"image"}
                                                                effect="blur"
                                                                className="w-full group-hover:scale-105 transition-all"
                                                                src={item.images[0]}
                                                            />

                                                        </Link>
                                                    </div>

                                                </div>
                                            </TableCell>

                                            <TableCell width={100} align="center">
                                                {item?.name}
                                            </TableCell>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'Edit Category',
                                                            id: item?._id
                                                        })}
                                                    >
                                                        <AiOutlineEdit className="text-[rgba(0,0,0,0.7)] text-[20px] " />
                                                    </button>


                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all"
                                                        onClick={() => deleteCat(item?._id)}>
                                                        <GoTrash className="text-[rgba(0,0,0,0.7)] text-[18px] " />
                                                    </button>
                                                </div>
                                            </TableCell>

                                        </TableRow>
                                    )
                                })
                            }




                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    labelRowsPerPage="Số hàng mỗi trang:"
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={10}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </div>


        </>
    )
}

export default CategoryList;
