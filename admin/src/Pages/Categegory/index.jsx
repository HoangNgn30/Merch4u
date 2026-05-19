import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Link } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";
import { GoTrash } from "react-icons/go";
import { MyContext } from '../../App';
import { fetchDataFromApi, deleteData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const columns = [
    { id: "image", label: "Hình Ảnh", minWidth: 120, align: "center" },
    { id: "catName", label: "Tên danh mục lớn", minWidth: 200, align: "left" },
    { id: "action", label: "Thao Tác", minWidth: 120, align: "center" },
];

export const CategoryList = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const context = useContext(MyContext);

    useEffect(() => {
        context?.setProgress(50);
        fetchDataFromApi("/api/category").then((res) => {
            context?.setCatData(res?.data);
            context?.setProgress(100);
        });
    }, [context?.isOpenFullScreenPanel]);

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
                            context?.setCatData(res?.data);
                            context.alertBox("success", "Đã xóa danh mục thành công");
                        });
                    });
                }
            );
        } else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    };

    // Calculate paginated data
    const paginatedData = context?.catData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) || [];

    return (
        <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
            <div className="flex items-center w-full pb-6 justify-between">
                <div className="col">
                    <h2 className="text-[18px] font-[600] text-slate-800">
                        Danh mục lớn hệ thống
                    </h2>
                </div>
                <div className="col ml-auto">
                    <Button 
                        variant="contained"
                        size="small"
                        className="btn-blue !text-white !normal-case font-semibold rounded-xl px-4 py-2" 
                        onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add New Category'
                        })}
                    >
                        Thêm danh mục lớn
                    </Button>
                </div>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                <TableContainer>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                        className="!bg-slate-50/80 !text-slate-500 !font-semibold !text-[12px] uppercase"
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                            {paginatedData.length !== 0 ? (
                                paginatedData.map((item, index) => {
                                    return (
                                        <TableRow key={item?._id || index} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell align="center">
                                                <div className="w-[60px] h-[60px] mx-auto rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 group cursor-pointer">
                                                    {item.images && item.images[0] ? (
                                                        <LazyLoadImage
                                                            alt={"image"}
                                                            effect="blur"
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                            src={item.images[0]}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-300 italic">No image</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell align="left" className="font-semibold text-slate-800 text-[14px]">
                                                {item?.name}
                                            </TableCell>

                                            <TableCell align="center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        className="w-[32px] h-[32px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'Edit Category',
                                                            id: item?._id
                                                        })}
                                                        title="Sửa danh mục"
                                                    >
                                                        <AiOutlineEdit className="text-[16px]" />
                                                    </button>

                                                    <button 
                                                        className="w-[32px] h-[32px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => deleteCat(item?._id)}
                                                        title="Xóa danh mục"
                                                    >
                                                        <GoTrash className="text-[16px]" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                                        Chưa có danh mục nào được tạo.
                                    </td>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            
            <TablePagination
                labelRowsPerPage="Số hàng mỗi trang:"
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={context?.catData?.length || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </div>
    );
};

export default CategoryList;
