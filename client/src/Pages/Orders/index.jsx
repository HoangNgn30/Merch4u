import React, { useContext, useEffect, useState } from "react";
import AccountSidebar from "../../components/AccountSidebar";
import { Button } from "@mui/material";
import { FaAngleDown } from "react-icons/fa6";
import Badge from "../../components/Badge";
import { FaAngleUp } from "react-icons/fa6";
import { fetchDataFromApi, deleteData } from "../../utils/api";
import { MyContext } from '../../App';
import Pagination from "@mui/material/Pagination";

const Orders = () => {
  const [isOpenOrderdProduct, setIsOpenOrderdProduct] = useState(null);
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState(1);
  const context = useContext(MyContext);

  const handleDeleteOrder = (id) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      deleteData(`/api/order/deleteOrder/${id}`).then((res) => {
        if (res?.error === false) {
          context.alertBox("success", res?.message);
          fetchDataFromApi(`/api/order/order-list/orders?page=${page}&limit=5`).then((res2) => {
            if (res2?.error === false) {
              setOrders(res2)
            }
          })
        } else {
          context.alertBox("error", res?.message);
        }
      });
    }
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
              <h2>My Orders</h2>
              <p className="mt-0 mb-0">
                There are <span className="font-bold text-primary">{ orders?.data?.length}</span>{" "}
                orders
              </p>

              <div className="relative overflow-x-auto mt-5">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        &nbsp;
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Order Id
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Paymant Id
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Phone Number
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Pincode
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Total Amount
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        User Id
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Payment Status
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Order Status
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 whitespace-nowrap">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>

                    {
                      orders?.data?.length !== 0 && orders?.data?.map((order, index) => {
                        return (
                          <>
                            <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                              <td className="px-6 py-4 font-[500]">
                                <Button
                                  className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-[#f1f1f1]"
                                  onClick={() => isShowOrderdProduct(index)}
                                >
                                  {
                                    isOpenOrderdProduct === index ? <FaAngleUp className="text-[16px] text-[rgba(0,0,0,0.7)]" /> : <FaAngleDown className="text-[16px] text-[rgba(0,0,0,0.7)]" />
                                  }

                                </Button>
                              </td>
                              <td className="px-6 py-4 font-[500]">
                                <span className="text-primary">
                                  {order?._id}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500]">
                                <span className="text-primary whitespace-nowrap text-[13px]">{order?.paymentId ? order?.paymentId : 'CASH ON DELIVERY'}</span>
                              </td>

                              <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                {order?.userId?.name}
                              </td>

                              <td className="px-6 py-4 font-[500]">{order?.delivery_address?.mobile}</td>

                              <td className="px-6 py-4 font-[500]">
                               <span className='inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md'>{order?.delivery_address?.addressType}</span>
                                <span className="block w-[400px]">
                                  {order?.delivery_address?.
                                    address_line1 + " " +
                                    order?.delivery_address?.city + " " +
                                    order?.delivery_address?.landmark + " " +
                                    order?.delivery_address?.state + " " +
                                    order?.delivery_address?.country
                                  }
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500]">{order?.delivery_address?.pincode}</td>

                              <td className="px-6 py-4 font-[500]">{order?.totalAmt?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                              <td className="px-6 py-4 font-[500]">
                                {order?.userId?.email}
                              </td>

                              <td className="px-6 py-4 font-[500]">
                                <span className="text-primary">
                                  {order?.userId?._id}
                                </span>
                              </td>

                              <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                {order?.payment_status === 'Paid' ? (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[13px]">
                                    Paid 
                                  </span>
                                ) : (
                                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[13px]">
                                    Pending 
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4 font-[500]">
                                <Badge status={order?.order_status} />
                              </td>
                              <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                {order?.createdAt?.split("T")[0]}
                              </td>
                              <td className="px-6 py-4 font-[500] whitespace-nowrap">
                                {order?.payment_status !== 'Paid' && (
                                  <Button 
                                    className="!bg-red-500 !text-white !text-[12px] !capitalize !min-w-[70px]"
                                    onClick={() => handleDeleteOrder(order?._id)}
                                  >
                                    Delete
                                  </Button>
                                )}
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
                                            Product Id
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Product Title
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Image
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Quantity
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Price
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 whitespace-nowrap"
                                          >
                                            Sub Total
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
                          </>
                        )
                      })

                    }






                  </tbody>
                </table>
              </div>


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
