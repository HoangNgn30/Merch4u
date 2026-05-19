import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { AiOutlineEdit } from "react-icons/ai";
import { GoTrash } from "react-icons/go";
import { MyContext } from '../../App';
import { deleteData, deleteMultipleData, fetchDataFromApi } from '../../utils/api';



const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "image", label: "HÌNH ẢNH", minWidth: 100, align: "center" },
    { id: "action", label: "Thao Tác", minWidth: 100, align: "center" },
];

const RightBannerList = (props) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [slidesData, setSlidesData] = useState([]);
    const [sortedIds, setSortedIds] = useState([]);

    const context = useContext(MyContext);


    useEffect(() => {
        getData();
    }, [context?.isOpenFullScreenPanel])



    const getData = () => {
        fetchDataFromApi("/api/rightBanner").then((res) => {
            setSlidesData(res?.data);
        });
    }


    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };


    const deleteSlide = (id) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            context?.showConfirmDelete(
                "Xóa banner?",
                "Bạn có chắc chắn muốn xóa banner này?",
                () => {
                    deleteData(`/api/rightBanner/${id}`).then((res) => {
                        context.alertBox("success", "Banner deleted");
                        getData();
                    })
                }
            )
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
                            Danh sách Banner
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center justify-end gap-3">
                        {slidesData?.length === 0 && (
                            <Button className="btn-blue !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                                open: true,
                                model: 'addRightBanner'
                            })}>Thêm Banner</Button>
                        )}
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
                                slidesData?.length !== 0 && slidesData?.map((item, index) => {
                                    return (
                                        <TableRow>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-4 w-[130px] lg:w-[200px] mx-auto">
                                                    <div className="img w-full rounded-md overflow-hidden group">

                                                        <img
                                                            src={item?.images[0]}
                                                            className="w-full group-hover:scale-105 transition-all"
                                                        />
                                                    </div>

                                                </div>
                                            </TableCell>


                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all" onClick={() => context.setIsOpenFullScreenPanel({
                                                        open: true,
                                                        model: 'editRightBanner',
                                                        id: item?._id
                                                    })}>
                                                        <AiOutlineEdit className="text-[rgba(0,0,0,0.7)] text-[20px] " />
                                                    </button>


                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all" onClick={() => deleteSlide(item?._id)}>
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

            </div>


        </>
    )
}

export default RightBannerList;
