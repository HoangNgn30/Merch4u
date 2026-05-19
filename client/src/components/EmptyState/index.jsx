import React from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { FiSearch } from "react-icons/fi";
import { IoBagOutline, IoHeartOutline, IoReceiptOutline } from "react-icons/io5";

const icons = {
  cart: IoBagOutline,
  wishlist: IoHeartOutline,
  orders: IoReceiptOutline,
  search: FiSearch,
};

const EmptyState = ({
  type = "search",
  title = "Không có dữ liệu",
  message = "Thử thay đổi bộ lọc hoặc quay lại mua sắm.",
  actionLabel = "Khám phá ngay",
  actionTo = "/products",
  onAction,
}) => {
  const Icon = icons[type] || FiSearch;

  const action = onAction ? (
    <Button className="btn-org btn-sm" onClick={onAction}>
      {actionLabel}
    </Button>
  ) : (
    <Button component={Link} to={actionTo} className="btn-org btn-sm">
      {actionLabel}
    </Button>
  );

  return (
    <div className="emptyState flex flex-col items-center justify-center text-center px-5 py-12 min-h-[260px]">
      <div className="w-[88px] h-[88px] rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4">
        <Icon className="text-[42px] text-primary" />
      </div>
      <h3 className="text-[18px] font-[700] text-[#222] mb-1">{title}</h3>
      <p className="text-[14px] text-gray-500 max-w-[420px] mt-0 mb-5">{message}</p>
      {action}
    </div>
  );
};

export default EmptyState;
