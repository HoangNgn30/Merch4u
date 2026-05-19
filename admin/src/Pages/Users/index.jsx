import React, { useContext, useState, useEffect } from 'react';
import { Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
import { MdOutlineMarkEmailRead, MdLocalPhone } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { GoTrash } from "react-icons/go";
import { deleteData, deleteMultipleData, fetchDataFromApi, editData } from '../../utils/api';
import { FaCheckDouble } from "react-icons/fa6";
import CircularProgress from '@mui/material/CircularProgress';

const label = { inputProps: { "aria-label": "Checkbox demo" } };

const columns = [
    { id: "user", label: "Người dùng", minWidth: 200 },
    {
        id: "userPh",
        align: "center",
        label: "Số điện thoại",
        minWidth: 130,
    },
    {
        id: "verifyemail",
        align: "center",
        label: "Xác thực email",
        minWidth: 140,
    },
    {
        id: "role",
        align: "center",
        label: "Vai trò",
        minWidth: 140,
    },
    {
        id: "accountStatus",
        align: "center",
        label: "Trạng thái",
        minWidth: 140,
    },
    {
        id: "createdDate",
        align: "center",
        label: "Ngày tạo",
        minWidth: 130,
    },
    {
        id: "action",
        align: "center",
        label: "Thao tác",
        minWidth: 100,
    },
];

export const Users = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [userData, setUserData] = useState([]);
    const [userTotalData, setUserTotalData] = useState([]);
    const [isLoading, setIsloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortedIds, setSortedIds] = useState([]);

    const context = useContext(MyContext);

    const handleRoleChange = (userId, newRole, currentStatus) => {
        if (context?.userData?.role !== "SUPERBOSS") {
            context.alertBox("error", "Chỉ tài khoản SUPERBOSS mới có quyền thay đổi vai trò");
            return;
        }

        editData(`/api/user/change-role/${userId}`, {
            role: newRole,
            accountStatus: currentStatus
        }).then((res) => {
            if (res?.data?.success || res?.success) {
                context.alertBox("success", "Cập nhật vai trò người dùng thành công");
                getUsers(page, rowsPerPage);
            } else {
                context.alertBox("error", res?.data?.message || res?.message || "Lỗi khi cập nhật vai trò");
            }
        });
    };

    const handleStatusChange = (userId, currentRole, newStatus) => {
        if (context?.userData?.role !== "SUPERBOSS") {
            context.alertBox("error", "Chỉ tài khoản SUPERBOSS mới có quyền thay đổi trạng thái");
            return;
        }

        editData(`/api/user/change-role/${userId}`, {
            role: currentRole,
            accountStatus: newStatus
        }).then((res) => {
            if (res?.data?.success || res?.success) {
                context.alertBox("success", "Cập nhật trạng thái người dùng thành công");
                getUsers(page, rowsPerPage);
            } else {
                context.alertBox("error", res?.data?.message || res?.message || "Lỗi khi cập nhật trạng thái");
            }
        });
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    useEffect(() => {
        getUsers(page, rowsPerPage);
    }, [page, rowsPerPage]);

    const getUsers = (page, limit) => {
        setIsloading(true);
        setPage(page);
        fetchDataFromApi(`/api/user/getAllUsers?page=${page + 1}&limit=${limit}`).then((res) => {
            setUserData(res);
            setUserTotalData(res);
            setIsloading(false);
        });
    };

    useEffect(() => {
        if (searchQuery !== "") {
            const filteredItems = userTotalData?.totalUsers?.filter((user) =>
                user._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user?.createdAt?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setUserData({
                error: false,
                success: true,
                users: filteredItems,
                total: filteredItems?.length,
                page: parseInt(page),
                totalPages: Math.ceil((filteredItems?.length || 0) / rowsPerPage),
                totalUsersCount: userData?.totalUsersCount
            });
        } else {
            getUsers(page, rowsPerPage);
        }
    }, [searchQuery]);

    // Handler to toggle all checkboxes
    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        const updatedItems = userData?.users?.map((item) => ({
            ...item,
            checked: isChecked,
        })) || [];

        setUserData({
            error: false,
            success: true,
            users: updatedItems,
            total: updatedItems?.length,
            page: parseInt(page),
            totalPages: Math.ceil(updatedItems?.length / rowsPerPage),
            totalUsersCount: userData?.totalUsersCount
        });

        if (isChecked) {
            const ids = updatedItems.map((item) => item._id).sort((a, b) => a - b);
            setSortedIds(ids);
        } else {
            setSortedIds([]);
        }
    };

    // Handler to toggle individual checkboxes
    const handleCheckboxChange = (e, id, index) => {
        const updatedItems = userData?.users?.map((item) =>
            item._id === id ? { ...item, checked: !item.checked } : item
        ) || [];

        setUserData({
            error: false,
            success: true,
            users: updatedItems,
            total: updatedItems?.length,
            page: parseInt(page),
            totalPages: Math.ceil(updatedItems?.length / rowsPerPage),
            totalUsersCount: userData?.totalUsersCount
        });

        const selectedIds = updatedItems
            .filter((item) => item.checked)
            .map((item) => item._id)
            .sort((a, b) => a - b);
        setSortedIds(selectedIds);
    };

    const deleteMultiple = () => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            if (sortedIds.length === 0) {
                context.alertBox('error', 'Vui lòng chọn mục cần xóa.');
                return;
            }

            context?.showConfirmDelete(
                "Xóa các người dùng đã chọn?",
                `Bạn có chắc chắn muốn xóa ${sortedIds.length} người dùng đã chọn?`,
                () => {
                    try {
                        deleteMultipleData(`/api/user/deleteMultiple`, {
                            data: { ids: sortedIds },
                        }).then((res) => {
                            getUsers(page, rowsPerPage);
                            context.alertBox("success", "Đã xóa người dùng thành công");
                            setSortedIds([]);
                        });
                    } catch (error) {
                        context.alertBox('error', 'Lỗi khi xóa người dùng.');
                    }
                }
            );
        } else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    };

    const deleteUser = (id) => {
        if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
            context?.showConfirmDelete(
                "Xóa người dùng?",
                "Bạn có chắc chắn muốn xóa người dùng này?",
                () => {
                    deleteData(`/api/user/deleteUser/${id}`).then((res) => {
                        getUsers(page, rowsPerPage);
                        context.alertBox("success", "Xóa người dùng thành công");
                    });
                }
            );
        } else {
            context.alertBox("error", "Chỉ admin mới có quyền xóa dữ liệu");
        }
    };

    return (
        <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
            <div className="flex flex-col sm:flex-row items-center w-full pb-6 justify-between gap-4">
                <div className="col">
                    <h2 className="text-[18px] font-[600] text-slate-800">
                        Danh sách thành viên & Phân quyền
                    </h2>
                </div>
                <div className="col sm:ml-auto flex items-center gap-3 w-full sm:w-auto">
                    {sortedIds?.length !== 0 && (
                        <Button 
                            variant="contained" 
                            size="small" 
                            color="error"
                            className="btn-sm whitespace-nowrap"
                            onClick={deleteMultiple}
                        >
                            Xóa hàng loạt ({sortedIds.length})
                        </Button>
                    )}
                    <SearchBox
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
                <TableContainer>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell className="bg-slate-50/80">
                                    <Checkbox 
                                        {...label} 
                                        size="small"
                                        className="text-indigo-600"
                                        onChange={handleSelectAll}
                                        checked={userData?.users?.length > 0 ? userData?.users?.every((item) => item.checked) : false}
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                        className="!bg-slate-50/80 !text-slate-500 !font-semibold !text-[12px] uppercase"
                                    >
                                        <span className="whitespace-nowrap">{column.label}</span>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                            {isLoading === false ? (
                                userData?.users?.length !== 0 ? (
                                    userData?.users?.map((user, index) => {
                                        return (
                                            <TableRow key={user?._id || index} className={`hover:bg-slate-50/80 transition-colors ${user.checked === true ? '!bg-indigo-50/50' : ''}`}>
                                                <TableCell style={{ minWidth: columns.minWidth }}>
                                                    <Checkbox 
                                                        {...label} 
                                                        size="small" 
                                                        checked={user.checked === true ? true : false}
                                                        className="text-indigo-600"
                                                        onChange={(e) => handleCheckboxChange(e, user._id, index)}
                                                    />
                                                </TableCell>
                                                <TableCell style={{ minWidth: columns.minWidth }}>
                                                    <div className="flex items-center gap-4 w-[280px]">
                                                        <div className="img relative w-[45px] h-[45px] rounded-full overflow-hidden shadow-md border border-slate-100 bg-slate-50 flex-shrink-0 group">
                                                            <img
                                                                src={user?.avatar !== "" && user?.avatar !== undefined ? user?.avatar : '/user.jpg'}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                alt="avatar"
                                                                onError={(e) => {
                                                                    e.target.src = '/user.jpg';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="info flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-800 text-[13px]"> {user?.name || "Khách ẩn danh"}</span>
                                                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium font-mono">
                                                                <MdOutlineMarkEmailRead className="text-[14px]" />
                                                                {user?.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell style={{ minWidth: columns.minWidth }} align="center" className="font-medium text-slate-700">
                                                    <span className="inline-flex items-center justify-center gap-1 text-[13px]"> 
                                                        <MdLocalPhone className="text-slate-400 text-[14px]" />  
                                                        {user?.mobile ? user?.mobile : <span className="text-slate-300 italic">Chưa có</span>}
                                                    </span>
                                                </TableCell>

                                                <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                    {user?.verify_email === false ? (
                                                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                            Chưa Xác Minh
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <FaCheckDouble className="text-[10px]" /> Đã Xác Minh
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell style={{ minWidth: 140 }} align="center">
                                                    {context?.userData?.role === "SUPERBOSS" && user.role !== "SUPERBOSS" ? (
                                                        <select 
                                                            value={user.role} 
                                                            onChange={(e) => handleRoleChange(user._id, e.target.value, user.accountStatus)}
                                                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-[110px] mx-auto p-1 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors"
                                                        >
                                                            <option value="USER">USER</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                        </select>
                                                    ) : (
                                                        user.role === "SUPERBOSS" ? (
                                                            <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-sm uppercase font-mono">
                                                                ★ SUPERBOSS
                                                            </span>
                                                        ) : user.role === "ADMIN" ? (
                                                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                                ADMIN
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                                                                USER
                                                            </span>
                                                        )
                                                    )}
                                                </TableCell>

                                                <TableCell style={{ minWidth: 140 }} align="center">
                                                    {context?.userData?.role === "SUPERBOSS" && user.role !== "SUPERBOSS" ? (
                                                        <select 
                                                            value={user.accountStatus || "active"} 
                                                            onChange={(e) => handleStatusChange(user._id, user.role, e.target.value)}
                                                            className={`border text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-[120px] mx-auto p-1 font-semibold text-center cursor-pointer transition-colors ${
                                                                user.accountStatus === "active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                                                user.accountStatus === "rejected" ? "bg-rose-50 border-rose-200 text-rose-700" :
                                                                "bg-orange-50 border-orange-200 text-orange-700"
                                                            }`}
                                                        >
                                                            <option value="active">Hoạt động</option>
                                                            <option value="rejected">Bị chặn</option>
                                                            <option value="pending">Chờ duyệt</option>
                                                        </select>
                                                    ) : (
                                                        (user.accountStatus === "active" || !user.accountStatus) ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Hoạt động
                                                            </span>
                                                        ) : user.accountStatus === "rejected" ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                                Bị chặn
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                                                Chờ duyệt
                                                            </span>
                                                        )
                                                    )}
                                                </TableCell>

                                                <TableCell style={{ minWidth: columns.minWidth }} align="center" className="font-medium text-slate-500 text-[12px]">
                                                    <span className="inline-flex items-center justify-center gap-1.5"> 
                                                        <SlCalender className="text-slate-400" />  
                                                        {user?.createdAt ? user?.createdAt?.split("T")[0] : "-"}
                                                    </span>
                                                </TableCell>

                                                <TableCell style={{ minWidth: columns.minWidth }} align="center">
                                                    <button 
                                                        onClick={() => deleteUser(user?._id)} 
                                                        className="w-[32px] h-[32px] mx-auto bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                                                        title="Xóa người dùng"
                                                    >
                                                        <GoTrash className="text-[15px]" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                                            Không tìm thấy người dùng nào.
                                        </td>
                                    </TableRow>
                                )
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <div className="flex items-center justify-center w-full min-h-[300px]">
                                            <CircularProgress color="inherit" className="text-indigo-600" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

            <TablePagination
                labelRowsPerPage="Số hàng mỗi trang:"
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={Number(userData?.totalUsersCount) || Number(userData?.total) || (Number(userData?.totalPages) * rowsPerPage) || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </div>
    );
};

export default Users;
