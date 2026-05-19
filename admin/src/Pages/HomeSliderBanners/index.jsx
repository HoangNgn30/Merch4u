import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";
import { IoMdAdd } from "react-icons/io";

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
import { deleteData, editData, fetchDataFromApi } from '../../utils/api';
import Switch from "@mui/material/Switch";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";


const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "image", label: "HÌNH ẢNH", minWidth: 250, align: "center" },
    { id: "status", label: "TRẠNG THÁI", minWidth: 100, align: "center" },
    { id: "action", label: "Thao Tác", minWidth: 100, align: "center" },
];

export const HomeSliderBanners = () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [slidesData, setSlidesData] = useState([]);
    const [sortedIds, setSortedIds] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [open, setOpen] = useState(false);

    const context = useContext(MyContext);


    useEffect(() => {
        getData();
    }, [context?.isOpenFullScreenPanel])



    const getData = () => {
        context?.setProgress(50);
        fetchDataFromApi("/api/homeSlides").then((res) => {
            setSlidesData(res?.data);
            context?.setProgress(100);
            let arr = [];

            for (let i = 0; i < res?.data?.length; i++) {
                arr.push({
                    src: res?.data[i]?.images[0]
                })
            }

            setPhotos(arr);

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
                "Xóa slide?",
                "Bạn có chắc chắn muốn xóa slide này?",
                () => {
                    deleteData(`/api/homeSlides/${id}`).then((res) => {
                        context.alertBox("success", "Slide deleted");
                        getData();
                    })
                }
            )
        } else {
            context.alertBox("error", "Only admin can delete data");
        }
    }

    const toggleVisibility = (item) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            const newStatus = item.isVisible === false ? true : false;
            editData(`/api/homeSlides/${item._id}`, { isVisible: newStatus }).then((res) => {
                if (res?.status === 200 || res?.data?.error === false) {
                    context.alertBox("success", "Cập nhật trạng thái slide thành công");
                    getData();
                } else {
                    context.alertBox("error", res?.data?.message || "Cập nhật thất bại");
                }
            });
        } else {
            context.alertBox("error", "Only admin can toggle status");
        }
    }


    return (
        <>
            <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="flex items-center w-full px-5 pb-4 justify-between">
                    <div className="col">
                        <h2 className="text-[18px] font-[600]">
                            Slide banner trang chủ
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center gap-3">
                        {
                            sortedIds?.length !== 0 && <Button variant="contained" className="btn-sm" size="small" color="error"
                                onClick={deleteMultipleSlides}>Xóa</Button>
                        }
                        <Button className="btn-blue !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add Home Slide'
                        })}>Thêm slide trang chủ</Button>
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
                                slidesData?.length !== 0 && slidesData?.slice()?.reverse()?.map((item, index) => {
                                    return (
                                        <TableRow>

                                            <TableCell width={300} align="center">
                                                <div className="flex items-center justify-center gap-4 w-[300px] cursor-pointer mx-auto" onClick={() => setOpen(true)}>
                                                    <div className="img w-full rounded-md overflow-hidden group">

                                                        <img
                                                            src={item?.images[0]}
                                                            className="w-full group-hover:scale-105 transition-all"
                                                        />
                                                    </div>

                                                </div>
                                            </TableCell>

                                            <TableCell width={100} align="center">
                                                <Switch 
                                                    checked={item?.isVisible !== false} 
                                                    onChange={() => toggleVisibility(item)}
                                                    color="primary"
                                                />
                                            </TableCell>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all"
                                                        onClick={() => context.setIsOpenFullScreenPanel({
                                                            open: true,
                                                            model: 'Edit Home Slide',
                                                            id: item?._id
                                                        })
                                                        }
                                                    >
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


            <Lightbox
                open={open}
                close={() => setOpen(false)}
                slides={photos}
            />

        </>
    )
}

export default HomeSliderBanners;
