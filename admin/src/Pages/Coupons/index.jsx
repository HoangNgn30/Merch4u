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
      maxUses: Number(formFields.maxUses || 0)
    };

    const request = editId
      ? editData(`/api/coupon/${editId}`, payload)
      : postData("/api/coupon/create", payload);

    request.then((res) => {
      setIsLoading(false);
      const data = editId ? res?.data : res;
      if (data?.error === false) {
        context?.alertBox("success", data?.message);
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
          context?.alertBox("success", "Đã xóa mã giảm giá");
          getCoupons();
        });
      }
    );
  };

  return (
    <div className="card my-2 md:mt-4 shadow-md sm:rounded-lg bg-white p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-[600]">Quản lý coupon</h2>
        {editId && <Button variant="outlined" size="small" onClick={resetForm}>Hủy chỉnh sửa</Button>}
      </div>

      <form className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" onSubmit={handleSubmit}>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Mã</h4>
          <input name="code" value={formFields.code} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm uppercase" />
        </div>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Loại</h4>
          <select name="type" value={formFields.type} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-2 text-sm bg-white">
            <option value="fixed">Số tiền cố định</option>
            <option value="percent">Phần trăm</option>
          </select>
        </div>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Giảm giá</h4>
          <input type="number" name="discount" value={formFields.discount} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm" />
        </div>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Ngày hết hạn</h4>
          <input type="date" name="expiryDate" value={formFields.expiryDate} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm" />
        </div>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Đơn tối thiểu</h4>
          <input type="number" name="minOrder" value={formFields.minOrder} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm" />
        </div>
        <div>
          <h4 className="text-[13px] font-[600] mb-1">Lượt dùng tối đa</h4>
          <input type="number" name="maxUses" value={formFields.maxUses} onChange={onChangeInput} className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] rounded-sm p-3 text-sm" />
        </div>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" name="isActive" checked={formFields.isActive} onChange={onChangeInput} />
          <span className="text-[14px]">Đang hoạt động</span>
        </label>
        <Button type="submit" className="btn-blue !text-white h-[40px] mt-5">
          {isLoading ? <CircularProgress color="inherit" size={22} /> : editId ? "Cập nhật coupon" : "Tạo coupon"}
        </Button>
      </form>

      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-center">Mã</th>
              <th className="px-6 py-3 text-center">Giảm giá</th>
              <th className="px-6 py-3 text-center">Đơn tối thiểu</th>
              <th className="px-6 py-3 text-center">Lượt dùng</th>
              <th className="px-6 py-3 text-center">Hết hạn</th>
              <th className="px-6 py-3 text-center">Trạng thái</th>
              <th className="px-6 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr className="border-b" key={coupon._id}>
                <td className="px-6 py-3 font-[700] text-primary text-center">{coupon.code}</td>
                <td className="px-6 py-3 text-center">{coupon.type === "percent" ? `${coupon.discount}%` : Number(coupon.discount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</td>
                <td className="px-6 py-3 text-center">{Number(coupon.minOrder || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</td>
                <td className="px-6 py-3 text-center">{coupon.usedCount}/{coupon.maxUses || "Không giới hạn"}</td>
                <td className="px-6 py-3 text-center">{formatDateInput(coupon.expiryDate)}</td>
                <td className="px-6 py-3 text-center">{coupon.isActive ? "Đang hoạt động" : "Tạm tắt"}</td>
                <td className="px-6 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all"
                      onClick={() => editCoupon(coupon)}
                    >
                      <AiOutlineEdit className="text-[rgba(0,0,0,0.7)] text-[20px] " />
                    </button>
                    <button className="!w-[35px] !h-[35px] bg-[#f1f1f1] !border !border-[rgba(0,0,0,0.4)] !rounded-full hover:bg-[#e2e2e2] flex items-center justify-center transition-all"
                      onClick={() => removeCoupon(coupon._id)}
                    >
                      <GoTrash className="text-[rgba(0,0,0,0.7)] text-[18px] " />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Coupons;
