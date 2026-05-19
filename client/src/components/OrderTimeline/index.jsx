import React from "react";
import { FaCheck } from "react-icons/fa6";
import { IoBagCheckOutline, IoCubeOutline, IoReceiptOutline } from "react-icons/io5";
import { MdLocalShipping } from "react-icons/md";

const steps = [
  { key: "pending", label: "Đặt hàng", icon: IoReceiptOutline },
  { key: "confirm", label: "Xác nhận", icon: FaCheck },
  { key: "shipped", label: "Đang giao", icon: MdLocalShipping },
  { key: "delivered", label: "Hoàn thành", icon: IoBagCheckOutline },
];

const statusIndex = {
  pending: 0,
  confirm: 1,
  shipped: 2,
  delivered: 3,
};

const OrderTimeline = ({ status = "pending" }) => {
  const isCancelled = status === "cancelled";
  const currentIndex = isCancelled ? -1 : statusIndex[status] ?? 0;

  if (isCancelled) {
    return (
      <div className="orderTimeline rounded-md border border-red-100 bg-red-50 px-4 py-3 text-red-700">
        Đơn hàng đã hủy. Nếu bạn đã thanh toán, bộ phận hỗ trợ sẽ liên hệ để xử lý hoàn tiền.
      </div>
    );
  }

  return (
    <div className="orderTimeline w-full py-3">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon || IoCubeOutline;
          const isDone = index <= currentIndex;

          return (
            <div key={step.key} className="relative flex flex-col items-center text-center">
              {index !== 0 && (
                <span className={`absolute right-[50%] top-[17px] h-[2px] w-full ${index <= currentIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
              <span className={`relative z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full border ${isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 bg-white text-gray-400"}`}>
                <Icon className="text-[16px]" />
              </span>
              <span className={`mt-2 text-[12px] font-[600] ${isDone ? "text-emerald-700" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
