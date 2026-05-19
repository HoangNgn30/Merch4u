import React from "react";

const statusMap = {
  "pre-order": {
    label: "Pre-order",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  exclusive: {
    label: "Exclusive",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  "sold-out": {
    label: "Hết hàng",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  available: {
    label: "Có sẵn",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const isRecentlyCreated = (date) => {
  if (!date) return false;
  const createdAt = new Date(date).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 14;
};

export const resolveProductStatus = (product) => {
  if (Number(product?.countInStock || 0) <= 0) return "sold-out";
  return product?.status || "available";
};

const ProductStatusBadges = ({ product, compact = false }) => {
  const status = resolveProductStatus(product);
  const statusInfo = statusMap[status] || statusMap.available;
  const showNew = product?.isNew === true || isRecentlyCreated(product?.createdAt);
  const hasDiscount = Number(product?.discount || 0) > 0;

  return (
    <div className="productBadges absolute top-[10px] left-[10px] right-[10px] z-50 flex items-start justify-between gap-2 pointer-events-none">
      <div className="flex flex-col gap-1">
        {status !== "available" && (
          <span className={`inline-flex w-fit items-center rounded border px-2 py-[3px] text-[11px] font-[700] ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        )}
        {showNew && (
          <span className="inline-flex w-fit items-center rounded border border-sky-200 bg-sky-100 px-2 py-[3px] text-[11px] font-[700] text-sky-700">
            Mới
          </span>
        )}
      </div>

      {hasDiscount && (
        <span className={`inline-flex items-center rounded bg-[#ff5252] px-2 py-[3px] font-[700] text-white ${compact ? "text-[10px]" : "text-[12px]"}`}>
          -{product.discount}%
        </span>
      )}
    </div>
  );
};

export default ProductStatusBadges;
