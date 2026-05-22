import React, { useState, useEffect, useContext } from 'react';
import { Button } from "@mui/material";
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";
import { GoTrash } from "react-icons/go";
import SearchBox from '../../Components/SearchBox';
import { deleteData, editData, fetchDataFromApi } from '../../utils/api';
import Pagination from "@mui/material/Pagination";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { MyContext } from "../../App.jsx";

const addressTypeLabel = {
  Home: "Nhà riêng",
  Office: "Công ty",
};

const formatPhoneNumber = (mobile) => {
  if (!mobile || mobile === "-") return "";
  let cleaned = String(mobile).replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+84")) {
    const remainder = cleaned.substring(3);
    cleaned = remainder.startsWith("0") ? remainder : "0" + remainder;
  } else if (cleaned.startsWith("84")) {
    const remainder = cleaned.substring(2);
    cleaned = remainder.startsWith("0") ? remainder : "0" + remainder;
  } else if (cleaned.length === 9 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
};

// Helper for status styles
const getStatusClasses = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'confirm':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'shipped':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

// Helper for payment status styles
const getPaymentStatusClasses = (status) => {
  switch (status) {
    case 'Paid':
    case 'COMPLETE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'CASH ON DELIVERY':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};


export const Orders = () => {
  const [isOpenOrderdProduct, setIsOpenOrderdProduct] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [ordersData, setOrdersData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pageOrder, setPageOrder] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalOrdersData, setTotalOrdersData] = useState([]);

  const context = useContext(MyContext);

  const isShowOrderdProduct = (index) => {
    if (isOpenOrderdProduct === index) {
      setIsOpenOrderdProduct(null);
    } else {
      setIsOpenOrderdProduct(index);
    }
  };

  const handleChange = (event, id) => {
    const newStatus = event.target.value;
    const obj = {
      id: id,
      order_status: newStatus
    };

    editData(`/api/order/order-status/${id}`, obj).then((res) => {
      const payload = res?.data || res;
      if (payload?.error === false || payload?.success === true) {
        context.alertBox("success", payload?.message || "Đã cập nhật trạng thái");
        
        // Re-fetch the orders list to update UI reactively!
        context?.setProgress(50);
        fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((listRes) => {
          if (listRes?.error === false) {
            setOrdersData(listRes?.data);
            context?.setProgress(100);
          }
        });
      } else {
        context.alertBox("error", payload?.message || "Cập nhật thất bại");
      }
    });
  };

  const handlePaymentStatusChange = (event, id) => {
    const newPaymentStatus = event.target.value;
    const obj = {
      id: id,
      payment_status: newPaymentStatus
    };

    editData(`/api/order/order-status/${id}`, obj).then((res) => {
      const payload = res?.data || res;
      if (payload?.error === false || payload?.success === true) {
        context.alertBox("success", payload?.message || "Đã cập nhật trạng thái thanh toán");
        
        // Re-fetch the orders list to update UI reactively!
        context?.setProgress(50);
        fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((listRes) => {
          if (listRes?.error === false) {
            setOrdersData(listRes?.data);
            context?.setProgress(100);
          }
        });
      } else {
        context.alertBox("error", payload?.message || "Cập nhật thất bại");
      }
    });
  };


  useEffect(() => {
    context?.setProgress(50);
    fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
      if (res?.error === false) {
        setOrders(res);
        setOrdersData(res?.data);
        context?.setProgress(100);
      }
    });
    fetchDataFromApi(`/api/order/order-list`).then((res) => {
      if (res?.error === false) {
        setTotalOrdersData(res);
      }
    });
  }, [pageOrder]);

  useEffect(() => {
    if (searchQuery !== "") {
      const filteredOrders = totalOrdersData?.data?.filter((order) =>
        order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.createdAt?.includes(searchQuery)
      );
      setOrdersData(filteredOrders);
    } else {
      fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
        if (res?.error === false) {
          setOrders(res);
          setOrdersData(res?.data);
        }
      });
    }
  }, [searchQuery]);

  const deleteOrder = (id) => {
    if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
      context?.showConfirmDelete(
        "Xóa đơn hàng?",
        "Bạn có chắc chắn muốn xóa đơn hàng này?",
        () => {
          deleteData(`/api/order/deleteOrder/${id}`).then((res) => {
            fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
              if (res?.error === false) {
                setOrdersData(res?.data);
                context?.setProgress(100);
                context.alertBox("success", "Xóa đơn hàng thành công");
              }
            });

            fetchDataFromApi(`/api/order/order-list`).then((res) => {
              if (res?.error === false) {
                setTotalOrdersData(res);
              }
            });
          });
        }
      );
    } else {
      context.alertBox("error", "Chỉ admin mới có quyền xóa đơn hàng");
    }
  };

  return (
    <div className="card my-4 p-6 shadow-xl border border-slate-100 rounded-2xl bg-white transition-all">
      <div className="flex flex-col sm:flex-row items-center w-full pb-6 justify-between gap-4">
        <div className="col">
          <h2 className="text-[18px] font-[600] text-slate-800">
            Danh sách đơn hàng gần đây
          </h2>
        </div>
        <div className="col sm:ml-auto w-full sm:w-[320px]">
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPageOrder={setPageOrder}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-[12px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th scope="col" className="px-5 py-4 w-[50px] text-center">&nbsp;</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Mã đơn hàng</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Mã thanh toán</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap">Khách hàng</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Số điện thoại</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap min-w-[280px]">Địa chỉ giao hàng</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Tổng tiền</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">T.T Thanh toán</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Trạng thái</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Ngày tạo</th>
              <th scope="col" className="px-5 py-4 whitespace-nowrap text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordersData?.length !== 0 ? (
              ordersData?.map((order, index) => {
                const currentStatus = order?.order_status || 'pending';
                return (
                  <React.Fragment key={order?._id || index}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${isOpenOrderdProduct === index ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => isShowOrderdProduct(index)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition-all shadow-sm focus:outline-none"
                        >
                          {isOpenOrderdProduct === index ? (
                            <FaAngleUp className="text-[14px] text-[#ff5252]" />
                          ) : (
                            <FaAngleDown className="text-[14px] text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-semibold text-center text-slate-800">
                        <span className="text-xs font-mono select-all bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {order?._id}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center font-medium">
                        {order?.paymentId ? (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono">
                            {order?.paymentId}
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                            COD (Nhận hàng)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-semibold">{order?.userId?.name || "Khách ẩn danh"}</span>
                          <span className="text-xs text-slate-400 font-normal">{order?.userId?.email}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-medium text-slate-700">
                        {formatPhoneNumber(order?.delivery_address?.mobile) || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 w-[260px]">
                          <span className='inline-flex self-start text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200 uppercase tracking-wider'>
                            {addressTypeLabel[order?.delivery_address?.addressType] || order?.delivery_address?.addressType || "Địa chỉ"}
                          </span>
                          <span className="text-[12px] leading-relaxed text-slate-700 font-medium">
                            {[
                              order?.delivery_address?.address_line1,
                              order?.delivery_address?.city,
                              order?.delivery_address?.state,
                              order?.delivery_address?.country
                            ].filter(Boolean).join(", ") +
                             (order?.delivery_address?.landmark ? ` (${order?.delivery_address?.landmark})` : "")}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-[#ff5252] text-[14px]">
                        {order?.totalAmt?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="min-w-[130px] inline-block">
                          <Select
                            value={order?.payment_status || 'pending'}
                            size="small"
                            className={`w-full text-xs font-semibold rounded-lg border ${getPaymentStatusClasses(order?.payment_status || 'pending')}`}
                            sx={{
                              fontSize: '12px',
                              fontWeight: '600',
                              '& .MuiSelect-select': {
                                py: '4px',
                                px: '8px',
                              }
                            }}
                            onChange={(e) => handlePaymentStatusChange(e, order?._id)}
                          >
                            <MenuItem value={'pending'} className="text-xs font-semibold text-amber-700">Chờ thanh toán</MenuItem>
                            <MenuItem value={'Paid'} className="text-xs font-semibold text-emerald-700">Đã thanh toán</MenuItem>
                            <MenuItem value={'failed'} className="text-xs font-semibold text-rose-700">Thanh toán lỗi</MenuItem>
                            <MenuItem value={'CASH ON DELIVERY'} className="text-xs font-semibold text-blue-700">COD (Thu hộ)</MenuItem>
                          </Select>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="min-w-[120px] inline-block">
                          <Select
                            value={currentStatus}
                            size="small"
                            className={`w-full text-xs font-semibold rounded-lg border ${getStatusClasses(currentStatus)}`}
                            sx={{
                              fontSize: '12px',
                              fontWeight: '600',
                              '& .MuiSelect-select': {
                                py: '4px',
                                px: '8px',
                              }
                            }}
                            onChange={(e) => handleChange(e, order?._id)}
                          >
                            <MenuItem value={'pending'} className="text-xs font-semibold text-amber-700">Chờ xử lý</MenuItem>
                            <MenuItem value={'confirm'} className="text-xs font-semibold text-sky-700">Đã xác nhận</MenuItem>
                            <MenuItem value={'shipped'} className="text-xs font-semibold text-indigo-700">Đang giao</MenuItem>
                            <MenuItem value={'delivered'} className="text-xs font-semibold text-emerald-700">Đã giao</MenuItem>
                            <MenuItem value={'cancelled'} disabled className="text-xs font-semibold text-rose-700">Đã hủy</MenuItem>
                          </Select>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center font-medium text-slate-500">
                        {order?.createdAt ? order.createdAt.split("T")[0] : "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => deleteOrder(order?._id)} 
                          className="w-[32px] h-[32px] mx-auto bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300"
                          title="Xóa đơn hàng"
                        >
                          <GoTrash className="text-[15px]" />
                        </button>
                      </td>
                    </tr>

                    {isOpenOrderdProduct === index && (
                      <tr className="bg-slate-50/50">
                        <td className="px-6 py-4" colSpan={11}>
                          <div className="my-2 p-5 bg-white border border-slate-100 rounded-xl shadow-inner">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              Chi tiết sản phẩm thuộc đơn hàng
                            </h4>
                            <div className="relative overflow-x-auto rounded-lg border border-slate-100">
                              <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                  <tr>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Mã sản phẩm</th>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Tên sản phẩm</th>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap text-center">Hình ảnh</th>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap text-center">Số lượng</th>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap text-right">Đơn giá</th>
                                    <th scope="col" className="px-4 py-3 whitespace-nowrap text-right">Tạm tính</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {order?.products?.map((item, itemIdx) => (
                                    <tr key={item?._id || itemIdx} className="hover:bg-slate-50/40 transition-colors">
                                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                        {item?._id}
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[320px]">
                                        {item?.productTitle}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <div className="w-[45px] h-[45px] mx-auto rounded-lg overflow-hidden shadow-sm border border-slate-100">
                                          <img
                                            src={item?.image}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                            alt="product"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                                        {item?.quantity}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                                        {item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-[#ff5252]">
                                        {(item?.price * item?.quantity)?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                  Không tìm thấy đơn hàng nào tương ứng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {orders?.totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 pt-4 border-t border-slate-50">
          <Pagination
            showFirstButton 
            showLastButton
            count={orders?.totalPages}
            page={pageOrder}
            onChange={(e, value) => setPageOrder(value)}
            color="primary"
            className="text-indigo-600"
          />
        </div>
      )}
    </div>
  );
};

export default Orders;
