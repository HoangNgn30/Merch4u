import React, { useContext, useState, useEffect, useRef } from "react";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { IoGiftOutline, IoCheckmarkCircle, IoTimeOutline, IoCloseCircleOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { fetchDataFromApi, postData } from "../../utils/api";
import { MyContext } from "../../App";

const CouponGame = () => {
  const [coupon, setCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const context = useContext(MyContext);
  const wheelRef = useRef(null);

  // Load canvas-confetti library dynamically from CDN
  useEffect(() => {
    if (!window.confetti) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchStatus = () => {
    fetchDataFromApi("/api/coupon/minigame-status").then((res) => {
      if (res?.error === false) {
        setGameData(res.data);
        generateWheelPrizes(res.data);
      }
    });
  };

  useEffect(() => {
    if (context.isLogin) {
      fetchStatus();
    }
  }, [context.isLogin]);

  // Helper to generate 8 prizes slots from available wheel coupons
  const generateWheelPrizes = (data) => {
    const rawCoupons = data?.wheel?.coupons || [];
    const list = [];
    const fallbacks = [
      { label: "Mất lượt", isCoupon: false },
      { label: "Chúc may mắn", isCoupon: false },
      { label: "Thêm lượt", isCoupon: false }
    ];

    for (let i = 0; i < 8; i++) {
      if (rawCoupons[i]) {
        list.push({
          id: rawCoupons[i]._id,
          code: rawCoupons[i].code,
          label: rawCoupons[i].type === 'percent' 
            ? `${rawCoupons[i].discount}%` 
            : `${Number(rawCoupons[i].discount / 1000).toFixed(0)}k`,
          discount: rawCoupons[i].discount,
          type: rawCoupons[i].type,
          minOrder: rawCoupons[i].minOrder,
          isCoupon: true
        });
      } else {
        list.push({
          ...fallbacks[i % fallbacks.length],
          isCoupon: false
        });
      }
    }
    setPrizes(list);
  };

  const triggerConfetti = () => {
    if (window.confetti) {
      // Create a nice burst
      window.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      // Fire side canons
      setTimeout(() => {
        window.confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
      }, 250);
      setTimeout(() => {
        window.confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
      }, 400);
    }
  };

  const spinWheel = () => {
    if (!context.isLogin) {
      context.alertBox("error", "Vui lòng đăng nhập để tham gia");
      return;
    }
    if (isSpinning) return;
    if ((gameData?.spins || 0) <= 0) {
      context.alertBox("error", "Bạn đã hết lượt quay ngày hôm nay!");
      return;
    }

    setIsSpinning(true);
    setIsLoading(true);

    // Call claim random API
    postData("/api/coupon/claim-random", {}).then((res) => {
      if (res?.error === false) {
        const winningCoupon = res?.coupon;
        setCoupon(winningCoupon);

        // Find the index of the winning coupon on the wheel
        let targetIndex = prizes.findIndex(p => p.isCoupon && p.code === winningCoupon.code);
        if (targetIndex === -1) {
          // Fallback if not found on wheel
          targetIndex = prizes.findIndex(p => p.isCoupon);
        }
        if (targetIndex === -1) targetIndex = 0;

        // Calculate rotation:
        // sector is 45 deg wide (360/8). 
        // Middle of sector is index * 45 + 22.5
        // To make it stop at top pointer (0 deg), we need: 360 - (index * 45 + 22.5)
        const baseRotation = 360 - (targetIndex * 45 + 22.5);
        const extraSpins = 6 * 360; // Spin 6 full rounds
        const finalRotation = rotation + extraSpins + baseRotation - (rotation % 360);

        setRotation(finalRotation);

        // Wait for the transition to finish (4s)
        setTimeout(() => {
          setIsSpinning(false);
          setIsLoading(false);
          setShowWinModal(true);
          triggerConfetti();
          fetchStatus(); // Refresh spins count
        }, 4100);

      } else {
        setIsSpinning(false);
        setIsLoading(false);
        context?.alertBox("error", res?.message || "Hôm nay không còn mã giảm giá nào!");
      }
    }).catch(err => {
      setIsSpinning(false);
      setIsLoading(false);
      context?.alertBox("error", "Có lỗi xảy ra khi quay vòng quay!");
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

  // Helper dynamic SVG sector builder
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  // 8 distinct Shopee-style colors for sectors
  const sectorColors = [
    "#ff4d4f", "#ff7a45", "#ffc53d", "#73d13d",
    "#36cfc9", "#40a9ff", "#9254de", "#f759ab"
  ];

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
            <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden select-none">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-primary/5 to-transparent rotate-45 -z-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100">
                <span className="w-8 h-8 rounded-full bg-red-100 text-primary flex items-center justify-center">
                  <IoGiftOutline size={20} />
                </span>
                <p className="text-[15px] font-semibold text-gray-700 m-0">
                  Lượt quay của bạn: <strong className="text-primary text-[18px] ml-1">{gameData?.spins || 0}</strong>
                </p>
              </div>

              {/* SVG interactive Wheel structure */}
              <div className="relative mx-auto my-4 w-[290px] h-[290px] rounded-full border-[6px] border-amber-400 bg-amber-400 shadow-[0_10px_35px_rgba(255,82,82,0.25)] flex items-center justify-center">
                {/* Pointer Indicator */}
                <div className="absolute top-[-15px] z-50 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-rose-600 drop-shadow-md"></div>
                
                {/* Spinning Wheel */}
                <div 
                  ref={wheelRef}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? "transform 4000ms cubic-bezier(0.15, 0.88, 0.3, 1)" : "none"
                  }}
                  className="w-full h-full rounded-full overflow-hidden"
                >
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {prizes.length === 8 && prizes.map((prize, idx) => {
                      const startAngle = idx * 45;
                      const endAngle = (idx + 1) * 45;
                      const pathData = describeArc(100, 100, 95, startAngle, endAngle);
                      const midAngle = startAngle + 22.5;
                      // Place text at 68% of radius
                      const textPos = polarToCartesian(100, 100, 65, midAngle);
                      
                      return (
                        <g key={idx}>
                          {/* Segment Sector */}
                          <path d={pathData} fill={sectorColors[idx]} stroke="#fff" strokeWidth="0.8" />
                          
                          {/* Rotated text */}
                          <text
                            x={textPos.x}
                            y={textPos.y}
                            fill="#fff"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            transform={`rotate(${midAngle} ${textPos.x} ${textPos.y})`}
                          >
                            {prize.label || prize.label === "" ? prize.label : "Chúc may mắn"}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                
                {/* Center cap element */}
                <div 
                  onClick={spinWheel}
                  className={`absolute w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 border-4 border-white flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-transform z-30 ${isSpinning ? "pointer-events-none" : ""}`}
                >
                  <span className="text-[12px] font-black text-rose-600 text-center uppercase tracking-tighter leading-3">
                    QUAY<br/>NGAY
                  </span>
                </div>
              </div>

              <div className="h-6"></div>
            </div>

            {/* The Prize Box */}
            <div className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[24px] p-6 text-center border border-gray-50">
              <h2 className="text-[16px] font-[700] mb-4 text-gray-800 uppercase tracking-wide">Phần thưởng trúng giải gần nhất</h2>
              {coupon ? (
                <div>
                  <div className="border-2 border-dashed border-primary/50 rounded-xl p-5 bg-red-50/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400"></div>
                    <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Mã Coupon</span>
                    <strong className="block text-[32px] font-black tracking-[4px] text-primary my-1">{coupon.code}</strong>
                    <p className="text-[14px] text-gray-700 font-medium m-0">
                      Giảm <span className="text-primary">{coupon.type === "percent" ? `${coupon.discount}%` : Number(coupon.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</span>
                      {coupon.maxDiscount > 0 ? ` (Tối đa ${Number(coupon.maxDiscount).toLocaleString("vi-VN")}đ)` : ""}
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
                  <p className="text-[14px] text-gray-400 mb-0 font-medium">Bạn chưa quay trúng mã nào. Bấm nút giữa để quay!</p>
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

      {/* Dynamic Pop-up Win Modal */}
      {showWinModal && coupon && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-[0_15px_50px_rgba(0,0,0,0.3)] rounded-[32px] max-w-[450px] w-full p-8 text-center relative animate-scale-up">
            
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
              onClick={() => setShowWinModal(false)}
            >
              <IoCloseCircleOutline size={30} />
            </button>

            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <IoGiftOutline size={48} />
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-1">CHÚC MỪNG BẠN!</h2>
            <p className="text-sm text-slate-500 font-medium mb-5">Bạn đã quay trúng phần thưởng siêu hời:</p>

            <div className="border-2 border-dashed border-rose-500/60 rounded-2xl p-5 bg-rose-50/50 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-amber-500"></div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Mã giảm giá của bạn</span>
              <strong className="block text-[36px] font-black tracking-[4px] text-rose-600 my-1.5 select-all">{coupon.code}</strong>
              <p className="text-sm font-semibold text-slate-700 m-0">
                Giảm {coupon.type === "percent" ? `${coupon.discount}%` : Number(coupon.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                {coupon.maxDiscount > 0 ? ` (Tối đa ${Number(coupon.maxDiscount).toLocaleString("vi-VN")}đ)` : ""}
                {coupon.minOrder > 0 ? ` cho đơn từ ${Number(coupon.minOrder).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}` : ""}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={copyCode}
                className="!bg-gradient-to-r !from-rose-500 !to-orange-500 !text-white !font-bold !py-3 !rounded-xl !shadow-md hover:!shadow-lg transition-all"
              >
                SAO CHÉP MÃ & ĐÓNG
              </Button>
              <div className="flex gap-3">
                <Link to="/my-coupons" className="flex-1" onClick={() => setShowWinModal(false)}>
                  <Button className="!border-2 !border-slate-800 !text-slate-800 !font-bold !py-2.5 !rounded-xl w-full hover:!bg-slate-100 transition-colors">
                    KHO COUPON
                  </Button>
                </Link>
                <Link to="/checkout" className="flex-1" onClick={() => setShowWinModal(false)}>
                  <Button className="!bg-slate-900 !text-white !font-bold !py-2.5 !rounded-xl w-full hover:!bg-slate-800 transition-colors">
                    MUA NGAY
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CouponGame;
