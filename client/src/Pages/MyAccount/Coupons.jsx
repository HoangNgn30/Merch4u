import React, { useContext, useEffect, useState } from "react";
import AccountSidebar from "../../components/AccountSidebar";
import { MyContext } from "../../App";
import { fetchDataFromApi, deleteData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { Button } from "@mui/material";
import { FaTrashAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Coupons = () => {
    const context = useContext(MyContext);
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getCoupons();
    }, []);

    const getCoupons = () => {
        setIsLoading(true);
        fetchDataFromApi("/api/coupon/my-coupons").then((res) => {
            if (res?.success) {
                setCoupons(res?.coupons || []);
            }
            setIsLoading(false);
        });
    };

    const deleteCoupon = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa 1 lượt mã giảm giá này?")) {
            deleteData(`/api/coupon/my-coupons/${id}`).then((res) => {
                if (res?.success) {
                    context?.alertBox("success", "Xóa mã giảm giá thành công");
                    getCoupons();
                } else {
                    context?.alertBox("error", res?.message || "Xóa thất bại");
                }
            });
        }
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const isExpired = (dateString) => new Date(dateString).getTime() < Date.now();

    return (
        <section className="py-3 lg:py-10 w-full">
            <div className="container flex flex-col lg:flex-row gap-5">
                <div className="w-full lg:w-[20%]">
                    <AccountSidebar />
                </div>

                <div className="col2 w-full lg:w-[80%]">
                    <div className="card bg-white p-5 shadow-md rounded-md mb-5">
                        <div className="flex items-center justify-between pb-3">
                            <h2 className="pb-0">Kho Coupon của bạn</h2>
                            <Link to="/coupon-game">
                                <Button className="!bg-primary !text-white !capitalize !text-[13px] !rounded-md !px-4" size="small">
                                    Quay thêm mã
                                </Button>
                            </Link>
                        </div>
                        <hr />

                        {isLoading ? (
                            <div className="flex justify-center p-10">
                                <CircularProgress />
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-500">
                                <h3 className="text-lg">Bạn chưa có mã giảm giá nào</h3>
                                <p>Tham gia minigame để nhận ngay các mã giảm giá hấp dẫn!</p>
                                <Link to="/coupon-game">
                                    <Button className="!bg-primary !text-white !capitalize !mt-3 !rounded-md !px-6" size="small">
                                        Quay ngay
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                {coupons.map((coupon, index) => (
                                    <div key={index} className={`relative border rounded-xl p-4 shadow-sm overflow-hidden flex flex-col justify-between ${isExpired(coupon.expiryDate) ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-gradient-to-br from-white to-orange-50 border-[rgba(0,0,0,0.1)]'}`}>
                                        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            HSD: {formatDate(coupon.expiryDate)}
                                        </div>

                                        {/* Quantity badge */}
                                        <div className="absolute top-0 left-0 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                                            x{coupon.quantity || 1}
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-primary font-bold text-xl">{coupon.code}</h3>
                                            <p className="text-sm font-medium text-gray-700 mt-1">
                                                Giảm {coupon.type === "percent" ? `${coupon.discount}%` : `${coupon.discount?.toLocaleString("vi-VN")}đ`}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Đơn tối thiểu {coupon.minOrder?.toLocaleString("vi-VN")}đ
                                            </p>
                                            {isExpired(coupon.expiryDate) && (
                                                <p className="text-xs text-red-500 mt-1 font-bold">Đã hết hạn</p>
                                            )}
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <span className="text-xs text-gray-400">
                                                Mỗi lần dùng trừ 1 lượt
                                            </span>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                className="!min-w-0 !p-2"
                                                onClick={() => deleteCoupon(coupon._id)}
                                                title="Xóa 1 lượt mã giảm giá này"
                                            >
                                                <FaTrashAlt />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Coupons;
