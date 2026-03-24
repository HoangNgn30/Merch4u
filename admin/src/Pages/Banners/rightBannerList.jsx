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
    { id: "image", label: "IMAGE", minWidth: 100 },
    { id: "action", label: "Action", minWidth: 100 },
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
        if (context?.userData?.role === "ADMIN") {
            deleteData(`/api/rightBanner/${id}`).then((res) => {
                context.alertBox("success", "Banner deleted");
                getData();
            })
        } else {
            context.alertBox("error", "Only admin can delete data");
        }
    }

    return (
        <>

            <div className="flex items-center justify-between px-2 py-0 mt-1 md:mt-3">
                <h2 className="text-[18px] font-[600]">
                    Banners List
                    <span className="font-[400] text-[14px]"></span>
                </h2>

                <div className="col  ml-auto flex items-center justify-end gap-3">

                    {slidesData?.length === 0 && (
                        <Button className="btn-blue !text-white btn-sm" onClick={() => context.setIsOpenFullScreenPanel({
                            open: true,
                            model: 'addRightBanner'
                        })}>Add Banner</Button>
                    )}
                </div>


            </div>


            <div className="card my-4 pt-5 shadow-md sm:rounded-lg bg-white">

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

                                            <TableCell width={100}>
                                                <div className="flex items-center gap-4 w-[130px] lg:w-[200px]">
                                                    <div className="img w-full rounded-md overflow-hidden group">

                                                        <img
                                                            src={item?.images[0]}
                                                            className="w-full group-hover:scale-105 transition-all"
                                                        />
                                                    </div>

                                                </div>
                                            </TableCell>


                                            <TableCell width={100}>
                                                <div className="flex items-center gap-1">
                                                    <Button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:!bg-[#f1f1f1] !min-w-[35px]" onClick={() => context.setIsOpenFullScreenPanel({
                                                        open: true,
                                                        model: 'editRightBanner',
                                                        id: item?._id
                                                    })}>
                                                        <AiOutlineEdit className="text-[rgba(0,0,0,0.7)] text-[20px] " />
                                                    </Button>


                                                    <Button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:!bg-[#f1f1f1] !min-w-[35px]" onClick={() => deleteSlide(item?._id)}>
                                                        <GoTrash className="text-[rgba(0,0,0,0.7)] text-[18px] " />
                                                    </Button>
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
