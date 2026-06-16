import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { MyContext } from "../../App";
import { deleteData, editData, fetchDataFromApi, postData } from "../../utils/api";
import { AiOutlineEdit } from "react-icons/ai";
import { GoTrash } from "react-icons/go";

const defaultForm = {
  code: "",
  type: "fixed",
  discount: "",
  minOrder: 0,
  maxUses: 0,
  maxDiscount: "",
  expiryDate: "",
  isActive: true
};

const formatDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [formFields, setFormFields] = useState(defaultForm);
  const [editId, setEditId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);

  const getCoupons = () => {
    fetchDataFromApi("/api/coupon").then((res) => {
      if (res?.error === false) {
        setCoupons(res?.coupons || []);
      }
    });
  };

  useEffect(() => {
    getCoupons();
  }, []);

  const onChangeInput = (e) => {
    const { name, value, checked, type } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setFormFields(defaultForm);
    setEditId("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formFields.code || !formFields.discount || !formFields.expiryDate) {
      context?.alertBox("error", "Vui lòng nhập mã, giá trị giảm và ngày hết hạn");
      return;
    }

    setIsLoading(true);
    const payload = {
      ...formFields,
      code: formFields.code.toUpperCase(),
      discount: Number(formFields.discount),
      minOrder: Number(formFields.minOrder || 0),
      maxUses: Number(formFields.maxUses || 0),
      maxDiscount: formFields.type === "percent" ? Number(formFields.maxDiscount || 0) : 0
    };

    const request = editId
      ? editData(`/api/coupon/${editId}`, payload)
      : postData("/api/coupon/create", payload);

    request.then((res) => {
      setIsLoading(false);
      const data = editId ? res?.data : res;
      if (data?.error === false) {
        context?.alertBox("success", data?.message || "Đã lưu mã giảm giá thành công");
        resetForm();
        getCoupons();
      } else {
        context?.alertBox("error", data?.message || "Không thể lưu mã giảm giá");
      }
    });
  };

  const editCoupon = (coupon) => {
    setEditId(coupon?._id);
    setFormFields({
      code: coupon?.code || "",
      type: coupon?.type || "fixed",
      discount: coupon?.discount || "",
      minOrder: coupon?.minOrder || 0,
      maxUses: coupon?.maxUses || 0,
      maxDiscount: coupon?.maxDiscount || "",
      expiryDate: formatDateInput(coupon?.expiryDate),
      isActive: coupon?.isActive !== false
    });
  };

  const removeCoupon = (id) => {
    context?.showConfirmDelete(
      "Xóa mã giảm giá?",
      "Bạn có chắc chắn muốn xóa mã giảm giá này?",
      () => {
        deleteData(`/api/coupon/${id}`).then(() => {
          context?.alertBox("success", "Đã xóa mã giảm giá thành công");
          getCoupons();
        });
      }
    );
  };

  return (
    <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
      <div className="flex items-center justify-between pb-6 border-b border-slate-50 mb-6">
        <h2 className="text-[18px] font-[600] text-slate-800">Quản Lý Mã Giảm Giá (Coupons)</h2>
        {editId && (
          <Button 
            variant="outlined" 
            size="small" 
            className="!normal-case font-bold !border-slate-200 !text-slate-500 hover:!bg-slate-50 rounded-xl"
            onClick={resetForm}
          >
            Hủy chỉnh sửa
          </Button>
        )}
      </div>

      <form className="bg-slate-50/40 border border-slate-100 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Mã giảm giá</h4>
          <input 
            name="code" 
            value={formFields.code} 
            onChange={onChangeInput} 
            placeholder="Ví Dụ: MERCH4U50"
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800 uppercase" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Loại giảm giá</h4>
          <select 
            name="type" 
            value={formFields.type} 
            onChange={onChangeInput} 
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-2 text-xs font-semibold text-slate-800 bg-white"
          >
            <option value="fixed">Số tiền cố định (VND)</option>
            <option value="percent">Phần trăm (%)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Giá trị giảm</h4>
          <input 
            type="number" 
            name="discount" 
            value={formFields.discount} 
            onChange={onChangeInput} 
            placeholder="0"
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Ngày hết hạn</h4>
          <input 
            type="date" 
            name="expiryDate" 
            value={formFields.expiryDate} 
            onChange={onChangeInput} 
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Đơn hàng tối thiểu</h4>
          <input 
            type="number" 
            name="minOrder" 
            value={formFields.minOrder} 
            onChange={onChangeInput} 
            placeholder="0"
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Lượt dùng tối đa</h4>
          <input 
            type="number" 
            name="maxUses" 
            value={formFields.maxUses} 
            onChange={onChangeInput} 
            placeholder="0"
            className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800" 
          />
        </div>
        {formFields.type === "percent" && (
          <div className="flex flex-col gap-1.5">
            <h4 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Mức giảm tối đa (đ)</h4>
            <input 
              type="number" 
              name="maxDiscount" 
              value={formFields.maxDiscount} 
              onChange={onChangeInput} 
              placeholder="0 (không giới hạn)"
              className="w-full h-[40px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 text-xs font-semibold text-slate-800" 
            />
          </div>
        )}
        <div className="flex items-center gap-2 mt-6 h-[40px]">
          <input 
            type="checkbox" 
            name="isActive" 
            id="isActiveCheckbox"
            checked={formFields.isActive} 
            onChange={onChangeInput} 
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300"
          />
          <label htmlFor="isActiveCheckbox" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
            Kích hoạt ngay
          </label>
        </div>
        <div className="flex items-end">
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading}
            className="w-full !normal-case font-bold !bg-indigo-600 !text-white h-[40px] rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? <CircularProgress color="inherit" size={18} /> : editId ? "Cập Nhật Mã" : "Tạo Mã Mới"}
          </Button>
        </div>
      </form>

      <div className="relative overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-[12px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 text-center">Mã giảm giá</th>
              <th className="px-5 py-4 text-center">Mức giảm</th>
              <th className="px-5 py-4 text-center">Đơn tối thiểu</th>
              <th className="px-5 py-4 text-center">Lượt sử dụng</th>
              <th className="px-5 py-4 text-center">Hết hạn</th>
              <th className="px-5 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.length !== 0 ? (
              coupons.map((coupon) => (
                <tr className="hover:bg-slate-50/50 transition-colors" key={coupon._id}>
                  <td className="px-5 py-4 font-bold text-center">
                    <span className="text-xs font-mono select-all bg-rose-50/60 text-[#ff5252] border border-rose-100/80 px-2.5 py-1 rounded-full">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-slate-800 text-[14px]">
                    {coupon.type === "percent" ? (
                      <div className="flex flex-col items-center">
                        <span className="text-amber-600">{coupon.discount}%</span>
                        {coupon.maxDiscount > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Tối đa: {Number(coupon.maxDiscount).toLocaleString("vi-VN")}đ)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#ff5252]">
                        {Number(coupon.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center font-semibold text-slate-600 text-[13px]">
                    {Number(coupon.minOrder || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[12px] font-semibold text-slate-600">
                      {coupon.usedCount} / {coupon.maxUses || "∞"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-medium text-slate-500 text-[12px]">
                    {formatDateInput(coupon.expiryDate)}
                  </td>
                  
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="w-[32px] h-[32px] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                        onClick={() => editCoupon(coupon)}
                        title="Sửa Coupon"
                      >
                        <AiOutlineEdit className="text-[16px]" />
                      </button>
                      <button 
                        className="w-[32px] h-[32px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                        onClick={() => removeCoupon(coupon._id)}
                        title="Xóa Coupon"
                      >
                        <GoTrash className="text-[16px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                  Không tìm thấy mã giảm giá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Coupons;
