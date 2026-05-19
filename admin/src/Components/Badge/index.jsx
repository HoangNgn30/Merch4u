import React from "react";

const Badge = (props) => {
  const statusLabels = {
    pending: "Chờ xử lý",
    confirm: "Đã xác nhận",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy"
  };

  return (
    <span
      className={`inline-block py-1 px-4 rounded-full text-[11px] capitalize ${
        props.status === "pending" && "bg-pink-500 text-white"
      } ${props.status === "confirm" && "bg-green-500 text-white"} ${props.status === "shipped" && "bg-blue-500 text-white"} ${props.status === "delivered" && "bg-green-700 text-white"} ${props.status === "cancelled" && "bg-red-500 text-white"}`}
    >
      {statusLabels[props.status] || props.status}
    </span>
  );
};

export default Badge;
