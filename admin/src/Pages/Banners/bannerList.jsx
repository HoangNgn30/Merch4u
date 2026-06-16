import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { AiOutlineEdit } from "react-icons/ai";
import { GoTrash } from "react-icons/go";
import { MyContext } from '../../App';
import { deleteData, fetchDataFromApi } from '../../utils/api';

const columns = [
    { id: "image", label: "Hình Ảnh Banner", minWidth: 200, align: "center" },
    { id: "action", label: "Thao Tác", minWidth: 120, align: "center" },
];

const RightBannerList = () => {
    const [slidesData, setSlidesData] = useState([]);
    const context = useContext(MyContext);

    useEffect(() => {
        getData();
    }, [context?.isOpenFullScreenPanel]);

    const getData = () => {
        fetchDataFromApi("/api/rightBanner").then((res) => {
            setSlidesData(res?.data || []);
        });
    };

    const deleteSlide = (id) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            context?.showConfirmDelete(
                "Xóa banner?",
                "Bạn có chắc chắn muốn xóa banner này?",
                () => {
                    deleteData(`/api/rightBanner/${id}`).then(() => {
                        context.alertBox("success", "Đã xóa banner thành công");
                        getData();
                    });
                }
            );
        } else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    };

    return (
        <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
            <div className="flex items-center w-full pb-6 justify-between">
                <div className="col">
                    <h2 className="text-[18px] font-[600] text-slate-800">
                        Danh Sách Banner 
                    </h2>
                </div>

                <div className="col ml-auto">
                    {slidesData?.length === 0 && (
                        <Button 
                            variant="contained"
                            size="small"
                            className="btn-blue !text-white !normal-case font-semibold rounded-xl px-4 py-2" 
                            onClick={() => context.setIsOpenFullScreenPanel({
                                open: true,
                                model: 'addRightBanner'
                            })}
                        >
                            Thêm Banner Mới
                        </Button>
                    )}
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
                            {slidesData?.length !== 0 ? (
                                slidesData?.map((item, index) => {
                                    return (
                                        <TableRow key={item?._id || index} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell align="center">
                                                <div className="w-[180px] lg:w-[240px] mx-auto rounded-xl overflow-hidden shadow-md border border-slate-100 bg-slate-50 group cursor-pointer p-1">
                                                    {item?.images && item?.images[0] ? (
                                                        <img
                                                            src={item?.images[0]}
                                                            className="w-full h-auto rounded-lg group-hover:scale-105 transition-transform duration-300 object-cover"
                                                            alt="banner"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-slate-300 italic">No image</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell align="center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        className="w-[32px] h-[32px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'editRightBanner',
                                                            id: item?._id
                                                        })}
                                                        title="Sửa Banner"
                                                    >
                                                        <AiOutlineEdit className="text-[16px]" />
                                                    </button>

                                                    <button 
                                                        className="w-[32px] h-[32px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        onClick={() => deleteSlide(item?._id)}
                                                        title="Xóa Banner"
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
                                    <td colSpan={2} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                                        Chưa có banner nào được tạo.
                                    </td>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
};

export default RightBannerList;
