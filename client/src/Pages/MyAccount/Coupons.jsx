import React, { useContext, useEffect, useState } from "react";
import AccountSidebar from "../../components/AccountSidebar";
import { MyContext } from "../../App";
import { fetchDataFromApi, deleteData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { Button } from "@mui/material";
import { FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const Coupons = () => {
    const context = useContext(MyContext);
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("all"); // "all", "active", "inactive"

    const handleUseCoupon = (code) => {
        localStorage.setItem("appliedCouponCode", code);
        if (context?.cartData?.length > 0) {
            context?.alertBox("success", "Đã chọn mã giảm giá, đang đi tới trang thanh toán...");
            navigate("/checkout");
        } else {
            context?.alertBox("success", "Đã chọn mã giảm giá! Hãy chọn sản phẩm mua sắm.");
            navigate("/products");
        }
    };

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

    const getExpiryWarning = (expiryDate) => {
        const diffMs = new Date(expiryDate).getTime() - Date.now();
        if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
            const hours = Math.ceil(diffMs / (60 * 60 * 1000));
            return `Sắp hết hạn: Còn ${hours} giờ`;
        }
        return null;
    };

    const filteredCoupons = coupons.filter(coupon => {
        const expired = isExpired(coupon.expiryDate);
        if (activeTab === "active") return !expired;
        if (activeTab === "inactive") return expired;
        return true;
    });

    return (
        <section className="py-3 lg:py-10 w-full">
            <div className="container flex flex-col lg:flex-row gap-5">
                <div className="w-full lg:w-[20%]">
                    <AccountSidebar />
                </div>

                <div className="col2 w-full lg:w-[80%]">
                    <div className="card bg-white p-5 shadow-md rounded-md mb-5">
                        <div className="flex items-center justify-between pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 pb-0">Kho Voucher</h2>
                                <p className="text-xs text-gray-500 mt-1">Lưu trữ các mã giảm giá đặc quyền của bạn</p>
                            </div>
                            <Link to="/coupon-game">
                                <Button className="!bg-primary !text-white !capitalize !text-[13px] !rounded-md !px-4 hover:!bg-primary/95 shadow-sm" size="small">
                                    Săn thêm mã
                                </Button>
                            </Link>
                        </div>
                        
                        {/* Tab Filter */}
                        <div className="flex border-b border-gray-200 mb-6 mt-2">
                            <button 
                                onClick={() => setActiveTab("all")} 
                                className={`py-2.5 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${activeTab === "all" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"}`}
                            >
                                Tất cả ({coupons.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab("active")} 
                                className={`py-2.5 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${activeTab === "active" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"}`}
                            >
                                Chưa sử dụng ({coupons.filter(c => !isExpired(c.expiryDate)).length})
                            </button>
                            <button 
                                onClick={() => setActiveTab("inactive")} 
                                className={`py-2.5 px-4 font-semibold text-sm transition-all border-b-2 cursor-pointer ${activeTab === "inactive" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-primary"}`}
                            >
                                Hết hạn ({coupons.filter(c => isExpired(c.expiryDate)).length})
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <CircularProgress />
                            </div>
                        ) : filteredCoupons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                                <img src="/images/no-coupon.png" alt="" className="w-24 h-24 object-contain opacity-40 mb-3" onError={(e) => e.target.style.display = 'none'} />
                                <h3 className="text-base font-semibold">Chưa có mã giảm giá nào ở mục này</h3>
                                <p className="text-xs text-gray-400 mt-1">Chơi minigame để rước ngay voucher xịn nhé!</p>
                                <Link to="/coupon-game">
                                    <Button className="!bg-primary !text-white !capitalize !mt-4 !rounded-md !px-6" size="small">
                                        Quay ngay
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                {filteredCoupons.map((coupon, index) => {
                                    const expired = isExpired(coupon.expiryDate);
                                    const warningText = getExpiryWarning(coupon.expiryDate);

                                    return (
                                        <div 
                                            key={coupon._id || index} 
                                            className={`relative flex rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all h-[105px] bg-white ${
                                                expired ? "border-gray-200 opacity-65" : "border-gray-200"
                                            }`}
                                        >
                                            {/* Vết khoét tròn mép trên */}
                                            <div className="absolute top-0 left-[25%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border border-gray-200 z-10"></div>
                                            {/* Vết khoét tròn mép dưới */}
                                            <div className="absolute bottom-0 left-[25%] -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border border-gray-200 z-10"></div>
                                            
                                            {/* Đường kẻ răng cưa ngăn cách */}
                                            <div className="absolute left-[25%] top-2 bottom-2 border-l border-dashed border-gray-300 z-10"></div>

                                            {/* Phần bên trái: Giá trị voucher */}
                                            <div className={`w-[25%] flex flex-col justify-center items-center text-white px-1 relative select-none ${
                                                expired ? "bg-gray-400" : "bg-gradient-to-br from-orange-500 to-red-500"
                                            }`}>
                                                {/* Lượt badge */}
                                                <span className="absolute top-1 left-1 bg-black/40 text-[8px] font-bold px-1 py-0.2 rounded text-white">
                                                    x{coupon.quantity || 1}
                                                </span>
                                                
                                                <span className="text-lg font-black tracking-tight leading-none">
                                                    {coupon.type === "percent" ? `${coupon.discount}%` : `${coupon.discount >= 1000 ? `${coupon.discount / 1000}k` : coupon.discount}`}
                                                </span>
                                                <span className="text-[8px] font-bold tracking-wider uppercase opacity-95 mt-0.5">
                                                    GIẢM GIÁ
                                                </span>
                                            </div>

                                            {/* Phần bên phải: Chi tiết và hành động */}
                                            <div className="w-[75%] p-2.5 flex flex-col justify-between relative bg-white">
                                                <div>
                                                    <div className="flex justify-between items-start gap-1">
                                                        <h3 className={`font-bold text-xs tracking-wide ${expired ? "text-gray-400" : "text-gray-800"} flex items-center gap-1.5 flex-wrap`}>
                                                            Mã: <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[10px] border border-orange-100 font-mono font-bold select-all">{coupon.code}</span>
                                                        </h3>
                                                        
                                                        <button
                                                            onClick={() => deleteCoupon(coupon._id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-0.5 shrink-0"
                                                            title="Xóa mã giảm giá này"
                                                        >
                                                            <FaTrashAlt size={11} />
                                                        </button>
                                                    </div>

                                                    <p className="text-[10px] text-gray-500 mt-1 font-medium leading-none flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                                                        <span>Đơn tối thiểu: <span className="text-gray-800 font-semibold">{coupon.minOrder?.toLocaleString("vi-VN")}đ</span></span>
                                                        {coupon.type === "percent" && coupon.maxDiscount > 0 && (
                                                            <>
                                                                <span className="text-gray-300">|</span>
                                                                <span>Tối đa: <span className="text-gray-800 font-semibold">{coupon.maxDiscount?.toLocaleString("vi-VN")}đ</span></span>
                                                            </>
                                                        )}
                                                    </p>

                                                    {/* Nhãn cảnh báo hết hạn khẩn cấp */}
                                                    {warningText && (
                                                        <div className="mt-0.5">
                                                            <span className="inline-block bg-amber-50 text-amber-600 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-100 animate-pulse leading-none">
                                                                {warningText}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        HSD: {formatDate(coupon.expiryDate)}
                                                    </span>

                                                    {!expired ? (
                                                        <button
                                                            onClick={() => handleUseCoupon(coupon.code)}
                                                            className="bg-primary hover:bg-primary/95 text-white text-[9px] font-extrabold px-2.5 py-1 rounded shadow-sm transition-all transform active:scale-95 cursor-pointer uppercase tracking-wide"
                                                        >
                                                            {context?.cartData?.length > 0 ? "DÙNG NGAY" : "MUA SẮM"}
                                                        </button>
                                                    ) : (
                                                        <div className="border border-dashed border-gray-300 text-gray-300 rounded font-bold text-[8px] uppercase px-1 py-0.2 rotate-[12deg] select-none pointer-events-none absolute right-3 bottom-2">
                                                            Hết hạn
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Coupons;
