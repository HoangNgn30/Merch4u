import React, { useContext, useEffect, useState } from "react";
import AccountSidebar from "../../components/AccountSidebar";
import { Button } from "@mui/material";
import { FaAngleDown } from "react-icons/fa6";
import Badge from "../../components/Badge";
import { FaAngleUp } from "react-icons/fa6";
import { editData, fetchDataFromApi } from "../../utils/api";
import { MyContext } from '../../App';
import Pagination from "@mui/material/Pagination";
import OrderTimeline from "../../components/OrderTimeline";
import EmptyState from "../../components/EmptyState";

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

const Orders = () => {
  const [isOpenOrderdProduct, setIsOpenOrderdProduct] = useState(null);
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const context = useContext(MyContext);

  const canCancelOrder = (order) => {
    return ["pending", "confirm"].includes(order?.order_status);
  }

  const handleCancelOrder = (id) => {
    context?.showConfirmBox(
      "Hủy đơn hàng?",
      "Bạn chỉ có thể hủy đơn khi đơn đang chờ xử lý hoặc đã xác nhận. Tồn kho sẽ được hoàn lại sau khi hủy.",
      () => {
        editData(`/api/order/cancel/${id}`, {}).then((res) => {
          if (res?.data?.error === false) {
            context.alertBox("success", res?.data?.message);
            fetchDataFromApi(`/api/order/order-list/orders?page=${page}&limit=5`).then((res2) => {
              if (res2?.error === false) {
                setOrders(res2)
              }
            })
          } else {
            context.alertBox("error", res?.data?.message || "Không thể hủy đơn hàng");
          }
        });
      }
    )
  };

  const isShowOrderdProduct = (index) => {
    if (isOpenOrderdProduct === index) {
      setIsOpenOrderdProduct(null);
    } else {
      setIsOpenOrderdProduct(index);
    }

  };


  useEffect(() => {
    fetchDataFromApi(`/api/order/order-list/orders?page=${page}&limit=5`).then((res) => {
      if (res?.error === false) {
        setOrders(res)
      }
    })
  }, [page])

  return (
    <section className="py-5 lg:py-10 w-full">
      <div className="container flex flex-col lg:flex-row gap-5">
        <div className="col1 w-[20%] hidden lg:block">
          <AccountSidebar />
        </div>

        <div className="col2 w-full lg:w-[80%]">
          <div className="shadow-md rounded-md bg-white">
            <div className="py-5 px-5 border-b border-[rgba(0,0,0,0.1)]">
              <h2>Đơn hàng của tôi</h2>
              <p className="mt-0 mb-0">
                Có <span className="font-bold text-primary">{ orders?.data?.length || 0}</span>{" "}
                đơn hàng
              </p>

              <div className="orders-table-wrap relative mt-5">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3 w-[50px]">
                        &nbsp;
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Mã đơn hàng
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Mã thanh toán
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Họ tên
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Số điện thoại
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Địa chỉ
                      </th>

                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Tổng tiền
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Mã người dùng
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Trạng thái thanh toán
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Trạng thái đơn hàng
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Ngày tạo
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>

                    {
                      orders?.data?.length !== 0 && orders?.data?.map((order, index) => {
                        return (
                          <React.Fragment key={order?._id || index}>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                              <td className="px-6 py-4 font-[500] w-[50px]">
                                <button
                                  type="button"
                                  onClick={() => isShowOrderdProduct(index)}
                                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors focus:outline-none"
                                >
                                  {isOpenOrderdProduct === index ? (
                                    <FaAngleUp className="text-[15px] text-gray-700" />
                                  ) : (
                                    <FaAngleDown className="text-[15px] text-gray-700" />
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4 font-[500] text-center">
                                <span className="text-primary font-[500]">
                                  {order?._id}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500] text-center">
                                <span className="text-primary whitespace-nowrap text-[13px]">{order?.paymentId ? order?.paymentId : 'Thanh toán khi nhận hàng'}</span>
                              </td>

                              <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                {order?.userId?.name}
                              </td>

                              <td className="px-6 py-4 font-[500] text-center">{formatPhoneNumber(order?.delivery_address?.mobile)}</td>

                              <td className="px-6 py-4 font-[500] min-w-[260px] lg:min-w-[340px]">
                                <span className='inline-block text-[13px] font-[500] px-2.5 py-0.5 bg-[#f1f1f1] dark:bg-gray-700 rounded-full mb-1 whitespace-nowrap text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600'>
                                  {addressTypeLabel[order?.delivery_address?.addressType] || order?.delivery_address?.addressType}
                                </span>
                                <span className="block max-w-[240px] lg:max-w-[320px] text-[13px] leading-snug text-gray-800 dark:text-gray-100 font-[600]">
                                  {[
                                    order?.delivery_address?.address_line1,
                                    order?.delivery_address?.city,
                                    order?.delivery_address?.state,
                                    order?.delivery_address?.country
                                  ].filter(Boolean).join(", ") +
                                   (order?.delivery_address?.landmark ? ` (${order?.delivery_address?.landmark})` : "")}
                                </span>
                                <span className="block text-[13px] text-gray-500 dark:text-gray-400 font-[600] mt-0.5">
                                  {formatPhoneNumber(order?.delivery_address?.mobile)}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500] text-center">{order?.totalAmt?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                              <td className="px-6 py-4 font-[500] text-center">
                                {order?.userId?.email}
                              </td>

                              <td className="px-6 py-4 font-[500] text-center">
                                <span className="text-primary">
                                  {order?.userId?._id}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500] whitespace-nowrap text-center">
                                {order?.payment_status === 'Paid' ? (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[13px]">
                                    Đã thanh toán
                                  </span>
                                ) : (
                                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[13px]">
                                    Chờ thanh toán
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4 font-[500] text-center">
                                <div className="flex justify-center">
                                  <Badge status={order?.order_status} />
                                </div>
                              </td>
                              <td className="px-6 py-4 font-[500] whitespace-nowrap text-center">
                                {order?.createdAt?.split("T")[0]}
                              </td>
                              <td className="px-6 py-4 font-[500] whitespace-nowrap text-center">
                                {canCancelOrder(order) && (
                                  <Button 
                                    className="!bg-red-500 !text-white !text-[12px] !capitalize !min-w-[70px]"
                                    onClick={() => handleCancelOrder(order?._id)}
                                  >
                                    Hủy đơn
                                  </Button>
                                )}
                              </td>
                            </tr>

                            {isOpenOrderdProduct === index && (
                              <tr>
                                <td className="pl-5 lg:pl-20" colSpan="13">
                                  <div className="py-4 pr-5">
                                    <OrderTimeline status={order?.order_status} />
                                  </div>
                                  <div className="relative overflow-x-auto">
                                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Mã sản phẩm
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Tên sản phẩm
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Ảnh
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Số lượng
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Giá
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Tạm tính
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {
                                          order?.products?.map((item, index) => {
                                            return (
                                              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700" key={item?._id || index}>
                                                <td className="px-6 py-4 font-[500]">
                                                  <span className="text-gray-600">
                                                    {item?._id}
                                                  </span>
                                                </td>
                                                <td className="px-6 py-4 font-[500]">
                                                  <div className="w-[200px]">
                                                    {item?.productTitle}
                                                  </div>
                                                </td>

                                                <td className="px-6 py-4 font-[500]">
                                                  <img
                                                    src={item?.image}
                                                    className="w-[40px] h-[40px] object-cover rounded-md"
                                                  />
                                                </td>

                                                <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                                  {item?.quantity}
                                                </td>

                                                <td className="px-6 py-4 font-[500]">{item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                                                <td className="px-6 py-4 font-[500]">{(item?.price * item?.quantity)?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                                              </tr>
                                            )
                                          })
                                        }


                                        <tr>
                                          <td
                                            className="bg-[#f1f1f1]"
                                            colSpan="12"
                                          ></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })

                    }






                  </tbody>
                </table>
              </div>

              {orders?.data?.length === 0 && (
                <EmptyState
                  type="orders"
                  title="Chưa có đơn hàng"
                  message="Đơn hàng của bạn sẽ hiển thị tại đây sau khi thanh toán hoặc đặt hàng thành công."
                  actionLabel="Mua sắm ngay"
                  actionTo="/products"
                />
              )}


              {
                orders?.totalPages > 1 &&
                <div className="flex items-center justify-center mt-10">
                  <Pagination
                    showFirstButton showLastButton
                    count={orders?.totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                  />
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Orders;
