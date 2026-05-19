import React, { useContext, useEffect, useMemo, useState } from "react";
import { Button, Chip, CircularProgress } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { FaCheck, FaTimes, FaUserMinus, FaUserShield } from "react-icons/fa";
import { MyContext } from "../../App";
import { editData, fetchDataFromApi, postData } from "../../utils/api";

const roleColor = {
    SUPERBOSS: "secondary",
    ADMIN: "primary",
    USER: "default"
};

const statusColor = {
    active: "success",
    pending: "warning",
    rejected: "error"
};

const statusLabel = {
    active: "Đang hoạt động",
    pending: "Chờ duyệt",
    rejected: "Đã từ chối"
};

const AccessControl = () => {
    const context = useContext(MyContext);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");

    const isSuperBoss = context?.userData?.role === "SUPERBOSS";

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const statusA = a.accountStatus || "active";
            const statusB = b.accountStatus || "active";
            if (statusA === "pending" && statusB !== "pending") return -1;
            if (statusA !== "pending" && statusB === "pending") return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }, [users]);

    const getUsers = () => {
        if (!isSuperBoss) return;

        setIsLoading(true);
        fetchDataFromApi("/api/user/getAllUsers?page=1&limit=500").then((res) => {
            if (res?.error) {
                context.alertBox("error", res?.message || "Không thể tải danh sách tài khoản");
                setIsLoading(false);
                return;
            }

            setUsers(res?.users || []);
            setIsLoading(false);
        });
    }

    useEffect(() => {
        getUsers();
    }, [isSuperBoss]);

    const runAction = async (id, request, successMessage) => {
        setActionLoading(id);
        const res = await request();
        const payload = res?.data || res;

        if (payload?.error) {
            context.alertBox("error", payload?.message || "Thao tác thất bại");
        } else {
            context.alertBox("success", payload?.message || successMessage);
            getUsers();
        }

        setActionLoading("");
    }

    const approveAdmin = (id) => {
        runAction(id, () => postData(`/api/user/approve/${id}`, {}), "Đã duyệt tài khoản admin");
    }

    const rejectAdmin = (id) => {
        runAction(id, () => postData(`/api/user/reject/${id}`, {}), "Đã từ chối tài khoản admin");
    }

    const changeRole = (id, role) => {
        runAction(
            id,
            () => editData(`/api/user/change-role/${id}`, { role, accountStatus: "active" }),
            "Đã cập nhật quyền tài khoản"
        );
    }

    const deleteAccount = (user) => {
        context?.showConfirmDelete(
            "Xóa tài khoản?",
            `Bạn có chắc muốn xóa tài khoản ${user?.email}?`,
            async () => {
                setActionLoading(user._id);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/deleteUser/${user._id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json"
                    }
                });
                const payload = await response.json();

                if (payload?.error) {
                    context.alertBox("error", payload?.message || "Không thể xóa tài khoản");
                } else {
                    context.alertBox("success", payload?.message || "Đã xóa tài khoản");
                    getUsers();
                }

                setActionLoading("");
            }
        );
    }

    if (!isSuperBoss) {
        return (
            <div className="card my-2 p-6 shadow-md sm:rounded-lg bg-white">
                <h2 className="text-[18px] font-[600]">Phân quyền</h2>
                <p className="mt-2 text-[14px] text-gray-600">
                    Chỉ SUPERBOSS mới có quyền truy cập trang này.
                </p>
            </div>
        );
    }

    return (
        <div className="card my-2 pt-5 shadow-md sm:rounded-lg bg-white">
            <div className="flex items-center w-full px-5 pb-4 justify-between">
                <div>
                    <h2 className="text-[18px] font-[600]">Phân quyền tài khoản</h2>
                    <p className="text-[13px] text-gray-500 mt-1">
                        Duyệt admin mới, cấp quyền ADMIN, hạ quyền về USER hoặc xóa admin.
                    </p>
                </div>
                <Button variant="outlined" size="small" onClick={getUsers}>
                    Làm mới
                </Button>
            </div>

            <TableContainer sx={{ maxHeight: 560 }}>
                <Table stickyHeader aria-label="access-control-table">
                    <TableHead>
                        <TableRow>
                            <TableCell>TÀI KHOẢN</TableCell>
                            <TableCell align="center">VAI TRÒ</TableCell>
                            <TableCell align="center">TRẠNG THÁI</TableCell>
                            <TableCell align="center">NGÀY TẠO</TableCell>
                            <TableCell align="center">HÀNH ĐỘNG</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <div className="flex items-center justify-center w-full min-h-[260px]">
                                        <CircularProgress color="inherit" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <div className="flex items-center justify-center w-full min-h-[180px] text-gray-500">
                                        Chưa có tài khoản nào.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedUsers.map((user) => {
                                const status = user.accountStatus || "active";
                                const isBusy = actionLoading === user._id;
                                const isSelf = user._id === context?.userData?._id;

                                return (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-[42px] h-[42px] rounded-md overflow-hidden bg-gray-100">
                                                    <img
                                                        src={user?.avatar || "/user.jpg"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-[600] text-[14px]">{user?.name}</div>
                                                    <div className="text-[12px] text-gray-500">{user?.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={user.role}
                                                color={roleColor[user.role] || "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={statusLabel[status] || status}
                                                color={statusColor[status] || "default"}
                                                size="small"
                                                variant={status === "active" ? "filled" : "outlined"}
                                            />
                                        </TableCell>
                                        <TableCell align="center">{user?.createdAt?.split("T")[0] || "-"}</TableCell>
                                        <TableCell align="center">
                                            <div className="flex justify-center gap-2 flex-wrap">
                                                {user.role === "ADMIN" && status === "pending" && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            disabled={isBusy}
                                                            startIcon={<FaCheck />}
                                                            onClick={() => approveAdmin(user._id)}
                                                        >
                                                            Duyệt
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="outlined"
                                                            disabled={isBusy}
                                                            startIcon={<FaTimes />}
                                                            onClick={() => rejectAdmin(user._id)}
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </>
                                                )}

                                                {user.role === "USER" && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        disabled={isBusy}
                                                        startIcon={<FaUserShield />}
                                                        onClick={() => changeRole(user._id, "ADMIN")}
                                                    >
                                                        Cấp ADMIN
                                                    </Button>
                                                )}

                                                {user.role === "ADMIN" && status === "active" && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        disabled={isBusy}
                                                        startIcon={<FaUserMinus />}
                                                        onClick={() => changeRole(user._id, "USER")}
                                                    >
                                                        Hạ USER
                                                    </Button>
                                                )}

                                                {user.role !== "SUPERBOSS" && !isSelf && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        disabled={isBusy}
                                                        onClick={() => deleteAccount(user)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default AccessControl;
