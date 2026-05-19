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
import { deleteData, deleteMultipleData, fetchDataFromApi } from '../../utils/api';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "image", label: "HÌNH ẢNH", minWidth: 100, align: "center" },
    { id: "title", label: "TIÊU ĐỀ", minWidth: 200 },
    { id: "description", label: "MÔ TẢ", minWidth: 300 },
    { id: "action", label: "THAO TÁC", minWidth: 100, align: "center" },
];

export const BlogList = () => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [blogData, setBlogData] = useState([]);


    const [photos, setPhotos] = useState([]);
    const [open, setOpen] = useState(false);

    const context = useContext(MyContext);


    useEffect(() => {
        getData();
    }, [context?.isOpenFullScreenPanel])



    const getData = () => {
        context?.setProgress(50);
        fetchDataFromApi("/api/blog").then((res) => {
            setBlogData(res?.blogs);
            let arr = [];
            context?.setProgress(100);
            for (let i = 0; i < res?.blogs?.length; i++) {
                arr.push({
                    src: res?.blogs[i]?.images[0]
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
                "Xóa bài viết?",
                "Bạn có chắc chắn muốn xóa bài viết này?",
                () => {
                    deleteData(`/api/blog/${id}`).then((res) => {
                        context.alertBox("success", "Đã xóa bài viết");
                        getData();
                    })
                }
            )
        }else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    }

    return (
        <>
            <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="flex items-center w-full px-5 pb-4 justify-between">
                    <div className="col">
                        <h2 className="text-[18px] font-[600]">
                            Danh sách bài viết
                        </h2>
                    </div>

                    <div className="col ml-auto flex items-center justify-end gap-3">
                        <Button className="btn-blue !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'Add Blog'
                        })}>Thêm bài viết</Button>
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
                                blogData?.length !== 0 && blogData?.slice()?.reverse()?.map((item, index) => {
                                    return (
                                        <TableRow key={index}>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-4 w-[200px] mx-auto">
                                                    <div className="img w-full rounded-md overflow-hidden group cursor-pointer" onClick={() => setOpen(true)}>

                                                        <img
                                                            src={item?.images[0]}
                                                            className="w-full group-hover:scale-105 transition-all"
                                                        />
                                                    </div>

                                                </div>
                                            </TableCell>

                                            <TableCell width={200}>
                                                <span className='text-[15px] font-[500] inline-block w-[200px] sm:w-[200px] md:w-[300px]'>{item?.title}</span>
                                            </TableCell>


                                            <TableCell width={300}>
                                                <div className="w-[250px] sm:w-[200px] md:w-[300px]" dangerouslySetInnerHTML={{ __html: item?.description?.substr(0, 150) + '...' }} />
                                            </TableCell>

                                            <TableCell width={100} align="center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button className="action-btn-edit" onClick={() => context.setIsOpenFullScreenPanel({
                                                        open: true,
                                                        model: 'Edit Blog',
                                                        id: item?._id
                                                    })}
                                                        title="Sửa bài viết"
                                                    >
                                                        <AiOutlineEdit />
                                                    </button>


                                                    <button className="action-btn-delete" onClick={() => deleteSlide(item?._id)}
                                                        title="Xóa bài viết"
                                                    >
                                                        <GoTrash />
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


