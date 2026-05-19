import React, { useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";

/**
 * QtyBox — Bộ chọn số lượng kiểu +/- với nhập tay
 * Props:
 *   handleSelecteQty(qty) — callback khi qty thay đổi
 *   maxQty (number) — giới hạn tối đa (countInStock), mặc định 999
 *   initialQty (number) — giá trị khởi tạo, mặc định 1
 */
export const QtyBox = ({ handleSelecteQty, maxQty = 999, initialQty = 1 }) => {

  const [qtyVal, setQtyVal] = useState(initialQty);

  const plusQty = () => {
    if (qtyVal >= maxQty) return;
    const newQty = qtyVal + 1;
    setQtyVal(newQty);
    handleSelecteQty(newQty);
  }

  const minusQty = () => {
    if (qtyVal <= 1) return;
    const newQty = qtyVal - 1;
    setQtyVal(newQty);
    handleSelecteQty(newQty);
  }

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > maxQty) val = maxQty;
    setQtyVal(val);
    handleSelecteQty(val);
  }

  return (
    <div className="qtyBox flex items-center justify-between w-full h-full border border-gray-200 rounded-full bg-white overflow-hidden">
      <button
        className="flex items-center justify-center w-[35px] h-full text-gray-700 bg-gray-50 hover:bg-gray-100 border-r border-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={minusQty}
        disabled={qtyVal <= 1}
      >
        <FaMinus size={12} />
      </button>

      <input
        type="number"
        className="flex-1 w-[40px] text-center text-[15px] font-semibold text-gray-800 bg-transparent focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={qtyVal}
        onChange={handleInputChange}
        min={1}
        max={maxQty}
      />

      <button
        className="flex items-center justify-center w-[35px] h-full text-gray-700 bg-gray-50 hover:bg-gray-100 border-l border-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={plusQty}
        disabled={qtyVal >= maxQty}
      >
        <FaPlus size={12} />
      </button>
    </div>
  );
};
