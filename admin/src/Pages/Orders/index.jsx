import React, { useState, useEffect } from 'react';
import { Button } from "@mui/material";
import { FaAngleDown } from "react-icons/fa6";
import Badge from "../../Components/Badge";
import SearchBox from '../../Components/SearchBox';
import { FaAngleUp } from "react-icons/fa6";
import { deleteData, editData, fetchDataFromApi } from '../../utils/api';
import Pagination from "@mui/material/Pagination";

import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useContext } from 'react';

import { MyContext } from "../../App.jsx";

const addressTypeLabel = {
  Home: "Nhà riêng",
  Office: "Công ty",
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
    setOrderStatus(event.target.value);

    const obj = {
      id: id,
      order_status: event.target.value
    }

    editData(`/api/order/order-status/${id}`, obj).then((res) => {
      if (res?.data?.error === false) {
        context.alertBox("success", res?.data?.message);
      }
    })

  };


  useEffect(() => {
    context?.setProgress(50);
    fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
      if (res?.error === false) {
        setOrdersData(res?.data)
        context?.setProgress(100);
      }
    })
    fetchDataFromApi(`/api/order/order-list`).then((res) => {
      if (res?.error === false) {
        setTotalOrdersData(res)
      }
    })
  }, [orderStatus, pageOrder])


  useEffect(() => {

    // Filter orders based on search query
    if (searchQuery !== "") {
      const filteredOrders = totalOrdersData?.data?.filter((order) =>
        order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.userId?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.createdAt.includes(searchQuery)
      );
      setOrdersData(filteredOrders)
    } else {
      fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
        if (res?.error === false) {
          setOrders(res)
          setOrdersData(res?.data)
        }
      })
    }

  }, [searchQuery])


    const deleteOrder = (id) => {
          if (["ADMIN", "SUPERBOSS"].includes(context?.userData?.role)) {
              context?.showConfirmDelete(
                "Xóa đơn hàng?",
                "Bạn có chắc chắn muốn xóa đơn hàng này?",
                () => {
                  deleteData(`/api/order/deleteOrder/${id}`).then((res) => {
                    fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
                      if (res?.error === false) {
                        setOrdersData(res?.data)
                        context?.setProgress(100);
                        context.alertBox("success", "Xóa đơn hàng thành công");
                      }
                    })

                    fetchDataFromApi(`/api/order/order-list`).then((res) => {
                      if (res?.error === false) {
                        setTotalOrdersData(res)
                      }
                    })
                    
                  })
                }
              )
          } else {
              context.alertBox("error", "Only admin can delete data");
          }
      }
  

  return (
    <div className="card my-2 md:mt-4 shadow-md sm:rounded-lg bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 px-5 py-5 flex-col sm:flex-row">
        <h2 className="text-[18px] font-[600] text-left mb-2 lg:mb-0">Đơn hàng gần đây</h2>
        <div className="ml-auto w-full">
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setPageOrder={setPageOrder}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto">
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
                Mã bưu chính
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
              ordersData?.length !== 0 && ordersData?.map((order, index) => {
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

                      <td className="px-6 py-4 font-[500] text-center">{order?.delivery_address?.mobile}</td>

                      <td className="px-6 py-4 font-[500]">
                        <span className='inline-block text-[13px] font-[500] px-2.5 py-0.5 bg-[#f1f1f1] rounded-full mb-1 whitespace-nowrap text-gray-600 border border-gray-200'>
                          {addressTypeLabel[order?.delivery_address?.addressType] || order?.delivery_address?.addressType}
                        </span>
                        <span className="block w-[300px] text-[13px] leading-snug text-gray-800 font-[600]">
                          {order?.delivery_address?.address_line1 + " " +
                           order?.delivery_address?.city + " " +
                           order?.delivery_address?.landmark + " " +
                           order?.delivery_address?.state + " " +
                           order?.delivery_address?.country}
                        </span>
                        <span className="block text-[13px] text-gray-500 font-[600] mt-0.5">
                          {order?.delivery_address?.mobile}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-[500] text-center">{order?.delivery_address?.pincode}</td>

                      <td className="px-6 py-4 font-[500] text-center">{order?.totalAmt?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                      <td className="px-6 py-4 font-[500] text-center">
                        {order?.userId?.email?.substr(0,5)+'***'}
                      </td>

                      <td className="px-6 py-4 font-[500] text-center">
                        <span className="text-primary">
                          {order?.userId?._id}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-[500] text-center">
                        <Select
                          labelId="demo-simple-select-helper-label"
                          id="demo-simple-select-helper"
                          value={order?.order_status !== null ? order?.order_status : orderStatus}
                          label="Trạng thái"
                          size="small"
                          style={{ zoom: '80%' }}
                          className="w-full"
                          onChange={(e) => handleChange(e, order?._id)}
                        >
                          <MenuItem value={'pending'}>Chờ xử lý</MenuItem>
                          <MenuItem value={'confirm'}>Đã xác nhận</MenuItem>
                          <MenuItem value={'shipped'}>Đang giao</MenuItem>
                          <MenuItem value={'delivered'}>Đã giao</MenuItem>
                          <MenuItem value={'cancelled'} disabled>Đã hủy</MenuItem>
                        </Select>
                      </td>
                      <td className="px-6 py-4 font-[500] whitespace-nowrap text-center">
                        {order?.createdAt?.split("T")[0]}
                      </td>
                      <td className="px-6 py-4 font-[500] whitespace-nowrap text-center">
                        <Button onClick={() => deleteOrder(order?._id)} variant="outlined" color="error" size="small">Xóa</Button>
                      </td>
                    </tr>

                    {isOpenOrderdProduct === index && (
                      <tr>
                        <td className="pl-20" colSpan="6">
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
                                      <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
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


      {
        orders?.totalPages > 1 &&
        <div className="flex items-center justify-center mt-10 pb-5">
          <Pagination
            showFirstButton showLastButton
            count={orders?.totalPages}
            page={pageOrder}
            onChange={(e, value) => setPageOrder(value)}
          />
        </div>
      }
    </div>
  )
}


export default Orders;
