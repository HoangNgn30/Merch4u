import React, { useContext, useState, useEffect } from "react";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { IoGiftOutline, IoCheckmarkCircle, IoTimeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { fetchDataFromApi, postData } from "../../utils/api";
import { MyContext } from "../../App";

const CouponGame = () => {
  const [coupon, setCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const context = useContext(MyContext);

  const fetchStatus = () => {
    fetchDataFromApi("/api/coupon/minigame-status").then((res) => {
      if (res?.error === false) {
        setGameData(res.data);
      }
    });
  };

  useEffect(() => {
    if (context.isLogin) {
      fetchStatus();
    }
  }, [context.isLogin]);

  const claimCoupon = () => {
    if (!context.isLogin) {
      context.alertBox("error", "Vui lòng đăng nhập để tham gia");
      return;
    }
    
    setIsLoading(true);
    postData("/api/coupon/claim-random", {}).then((res) => {
      setIsLoading(false);
      if (res?.error === false) {
        setCoupon(res?.coupon);
        context?.alertBox("success", res?.message);
        fetchStatus(); // Refresh spins count
      } else {
        context?.alertBox("error", res?.message || "Chưa có mã giảm giá khả dụng");
      }
    });
  };

  const copyCode = () => {
    if (!coupon?.code) return;
    navigator.clipboard?.writeText(coupon.code);
    context?.alertBox("success", "Đã sao chép mã giảm giá");
  };

  const renderMission = (id, title) => {
    const isCompleted = gameData?.missions?.claimedMissions?.includes(id);
    return (
      <div className={`flex items-center justify-between p-4 border-2 rounded-[16px] transition-all duration-300 ${isCompleted ? 'border-green-100 bg-green-50/50' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-100'}`}>
        <span className={`text-[15px] font-semibold ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>{title}</span>
        {isCompleted ? (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-[13px] font-bold shadow-sm">
            <IoCheckmarkCircle size={16} /> Đã nhận 1 lượt
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400 bg-white border px-3 py-1 rounded-full text-[13px] shadow-sm font-medium">
            <IoTimeOutline size={16} /> Chưa xong
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="pt-[100px] lg:pt-14 pb-14 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50 min-h-screen">
      <div className="container max-w-[1100px] mx-auto">
        
        {/* Header Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 mb-3 drop-shadow-sm">
            Vòng Quay May Mắn
          </h1>
          <p className="text-gray-600 font-medium text-[15px] max-w-xl mx-auto">
            Thử vận may mỗi ngày để nhận ngay các mã giảm giá siêu hấp dẫn! Hoàn thành nhiệm vụ mua hàng để tích lũy thêm lượt quay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch">
          
          {/* LEFT: Game & Prize */}
          <div className="flex flex-col gap-6">
            
            {/* The Wheel Box */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-primary/5 to-transparent rotate-45 -z-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100">
                <span className="w-8 h-8 rounded-full bg-red-100 text-primary flex items-center justify-center">
                  <IoGiftOutline size={20} />
                </span>
                <p className="text-[15px] font-semibold text-gray-700 m-0">Lượt quay của bạn: <strong className="text-primary text-[18px] ml-1">{gameData?.spins || 0}</strong></p>
              </div>

              <div className="relative mx-auto my-4 w-[240px] h-[240px] rounded-full border-[10px] border-white shadow-[0_0_40px_rgba(255,82,82,0.3)] overflow-hidden bg-[conic-gradient(#ff5252_0_25%,#111827_0_50%,#f59e0b_0_75%,#16a34a_0_100%)]">
                <div className={`absolute inset-[30px] rounded-full bg-white flex items-center justify-center shadow-inner transition-all duration-[2000ms] cubic-bezier(0.25, 1, 0.5, 1) ${isLoading ? "rotate-[1440deg] scale-95" : ""}`}>
                  <IoGiftOutline className="text-primary drop-shadow-md" size={64} />
                </div>
              </div>

              <Button 
                className="!mt-6 !bg-gradient-to-r !from-primary !to-orange-500 !text-white !font-bold !text-[16px] !rounded-full !px-10 !py-3 !shadow-lg hover:!shadow-[0_8px_25px_rgba(255,82,82,0.4)] hover:!-translate-y-1 transition-all duration-300"
                onClick={claimCoupon} 
                disabled={isLoading || (gameData?.spins || 0) <= 0}
              >
                {isLoading ? <CircularProgress color="inherit" size={24} /> : "QUAY NHẬN MÃ"}
              </Button>
            </div>

            {/* The Prize Box */}
            <div className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[24px] p-6 text-center border border-gray-50">
              <h2 className="text-[16px] font-[700] mb-4 text-gray-800 uppercase tracking-wide">Phần thưởng của bạn</h2>
              {coupon ? (
                <div className="animate-fade-in-up">
                  <div className="border-2 border-dashed border-primary/50 rounded-xl p-5 bg-red-50/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400"></div>
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Mã Coupon</span>
                    <strong className="block text-[32px] font-black tracking-[4px] text-primary my-1">{coupon.code}</strong>
                    <p className="text-[14px] text-gray-700 font-medium m-0">
                      Giảm <span className="text-primary">{coupon.type === "percent" ? `${coupon.discount}%` : Number(coupon.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
                      {coupon.minOrder > 0 ? ` cho đơn từ ${Number(coupon.minOrder).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <Button className="!border-2 !border-primary !text-primary !font-bold !rounded-xl flex-1 hover:!bg-red-50 transition-colors" onClick={copyCode}>
                      SAO CHÉP
                    </Button>
                    <Link to="/my-coupons" className="flex-1 block">
                      <Button className="!border-2 !border-gray-800 !text-gray-800 !font-bold !rounded-xl w-full h-full hover:!bg-gray-100 transition-colors">
                        KHO COUPON
                      </Button>
                    </Link>
                    <Link to="/checkout" className="flex-1 block">
                      <Button className="!bg-primary !text-white !font-bold !rounded-xl w-full h-full shadow-md hover:!bg-gray-900 transition-colors">
                        DÙNG NGAY
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[14px] text-gray-400 mb-0 font-medium">Bạn chưa quay trúng mã nào. Bấm quay ngay!</p>
                </div>
              )}
            </div>
            
          </div>

          {/* RIGHT: Missions */}
          <div className="flex flex-col h-full">
            <div className="bg-white shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[32px] p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                  <IoCheckmarkCircle size={22} />
                </div>
                <h2 className="text-[20px] font-bold text-gray-800 m-0">Nhiệm vụ nhận lượt</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
                Hệ thống sẽ tự động cộng thêm lượt quay khi bạn mua sắm thành công. Nhiệm vụ sẽ làm mới vào 00:00 mỗi ngày.
              </p>
              
              <div className="flex flex-col gap-3 flex-1">
                {renderMission("M1", "Mua thành công 1 đơn hàng")}
                {renderMission("M2", "Mua thành công 2 đơn hàng")}
                {renderMission("M3", "Mua thành công 3 đơn hàng")}
                {renderMission("M4", "Đơn hàng tối thiểu 500.000đ")}
                {renderMission("M5", "Đơn hàng tối thiểu 1.000.000đ")}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default CouponGame;
