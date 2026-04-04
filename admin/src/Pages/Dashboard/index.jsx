import React, { useState, PureComponent, useContext, useEffect } from "react";
import DashboardBoxes from "../../Components/DashboardBoxes";
import { FaPlus } from "react-icons/fa6";
import { Button, Pagination } from "@mui/material";
import { FaAngleDown } from "react-icons/fa6";
import Badge from "../../Components/Badge";
import { FaAngleUp } from "react-icons/fa6";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { MyContext } from '../../App';
import SearchBox from "../../Components/SearchBox";
import { fetchDataFromApi } from "../../utils/api";
import Products from "../Products";


const Dashboard = () => {
  const [isOpenOrderdProduct, setIsOpenOrderdProduct] = useState(null);

  const [productCat, setProductCat] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  const [chartData, setChartData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  const [productData, setProductData] = useState([]);
  const [productTotalData, setProductTotalData] = useState([]);

  const [ordersData, setOrdersData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pageOrder, setPageOrder] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const [totalOrdersData, setTotalOrdersData] = useState([]);

  const [users, setUsers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [ordersCount, setOrdersCount] = useState(null);

  const context = useContext(MyContext);


    useEffect(() => {
      context?.setProgress(30);
        getProducts(page, rowsPerPage);
    }, [])


  const isShowOrderdProduct = (index) => {
    if (isOpenOrderdProduct === index) {
      setIsOpenOrderdProduct(null);
    } else {
      setIsOpenOrderdProduct(index);
    }
  };


  useEffect(() => {


    fetchDataFromApi(`/api/order/order-list?page=${pageOrder}&limit=5`).then((res) => {
      if (res?.error === false) {
        setOrdersData(res?.data)
      }
    })
    fetchDataFromApi(`/api/order/order-list`).then((res) => {
      if (res?.error === false) {
        setTotalOrdersData(res)
      }
    })
    fetchDataFromApi(`/api/order/count`).then((res) => {
      if (res?.error === false) {
        setOrdersCount(res?.count)
      }
    })
  }, [pageOrder])


  useEffect(() => {

    // Filter orders based on search query
    if (orderSearchQuery !== "") {
      const filteredOrders = totalOrdersData?.data?.filter((order) =>
        order._id?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order?.userId?.name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order?.userId?.email.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order?.createdAt.includes(orderSearchQuery)
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
  }, [orderSearchQuery])



  useEffect(() => {
    getTotalSalesByYear();

    fetchDataFromApi("/api/user/getAllUsers").then((res) => {
      if (res?.error === false) {
        setUsers(res?.users)
      }
    })

    fetchDataFromApi("/api/user/getAllReviews").then((res) => {
      if (res?.error === false) {
        setAllReviews(res?.reviews)
      }
    })

  }, [])



  const getProducts = async (page, limit) => {
         fetchDataFromApi(`/api/product/getAllProducts?page=${page + 1}&limit=${limit}`).then((res) => {
             setProductData(res)
             setProductTotalData(res)
             context?.setProgress(100);
         })
     }


  const getTotalUsersByYear = () => {
    fetchDataFromApi(`/api/order/users`).then((res) => {
      const users = [];
      res?.TotalUsers?.length !== 0 &&
        res?.TotalUsers?.map((item) => {
          users.push({
            name: item?.name,
            TotalUsers: parseInt(item?.TotalUsers),
          });
        });

      const uniqueArr = users.filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.name === obj.name)
      );
      setChartData(uniqueArr);
    })
  }

  const getTotalSalesByYear = () => {
    fetchDataFromApi(`/api/order/sales`).then((res) => {
      const sales = [];
      res?.monthlySales?.length !== 0 &&
        res?.monthlySales?.map((item) => {
          sales.push({
            name: item?.name,
            TotalSales: parseInt(item?.TotalSales),
          });
        });

      const uniqueArr = sales.filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.name === obj.name)
      );
      setChartData(uniqueArr);
    });
  }



  return (
    <>
      <div className="w-full py-4 lg:py-1 px-5 border bg-[#f1faff] border-[rgba(0,0,0,0.1)] flex items-center gap-8 mb-5 justify-between rounded-md">
        <div className="info">
          <h1 className="text-[26px] lg:text-[35px] font-bold leading-8 lg:leading-10 mb-3">
            Xin chào,
            <br />
            <span className="text-primary">{context?.userData?.name}</span>
          </h1>
          <p>
            Đây là những gì đang diễn ra trên cửa hàng của bạn hôm nay. Xem số liệu thống kê ngay lập tức.
          </p>
          <br />
          <Button className="btn-blue btn !capitalize" onClick={() => context.setIsOpenFullScreenPanel({
            open: true,
            model: "Add Product"
          })}>
            <FaPlus /> Thêm sản phẩm
          </Button>
        </div>

        <img src="/shop-illustration.webp" className="w-[250px] hidden lg:block" />
      </div>

      {
        productData?.products?.length !== 0 && users?.length !== 0 && allReviews?.length !== 0 && <DashboardBoxes orders={ordersCount} products={productData?.products?.length} users={users?.length} reviews={allReviews?.length} category={context?.catData?.length} />
      }

      <Products/>

      <div className="card my-4 shadow-md sm:rounded-lg bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 px-5 py-5 flex-col sm:flex-row">
          <h2 className="text-[18px] font-[600] text-left mb-2 lg:mb-0">Đơn hàng gần đây</h2>
          <div className="ml-auto w-full">
            <SearchBox
              searchQuery={orderSearchQuery}
              setSearchQuery={setOrderSearchQuery}

              setPageOrder={setPageOrder}
            />
          </div>
        </div>

        <div className="relative overflow-x-auto mt-0">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  &nbsp;
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Mã đơn hàng
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Mã thanh toán
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Tên
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  SĐT
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Địa chỉ
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Mã bưu điện
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Tổng số tiền
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  ID người dùng
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Trạng thái đơn hàng
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Ngày
                </th>
              </tr>
            </thead>
            <tbody>

              {
                ordersData?.length !== 0 && ordersData?.map((order, index) => {
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
                              order?.delivery_address?.country + ' ' + order?.delivery_address?.mobile
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

                        <td className="px-6 py-4 font-[500]">
                          <Badge status={order?.order_status} />
                        </td>
                        <td className="px-6 py-4 font-[500] whitespace-nowrap">
                          {order?.createdAt?.split("T")[0]}
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
                                      mã sản phẩm
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


       <div className="card my-4 shadow-md sm:rounded-lg bg-white">
            <div className="flex items-center justify-between px-5 py-5 pb-0">
              <h2 className="text-[18px] font-[600]">Tổng số người dùng và tổng doanh thu</h2>
            </div>
    
            <div className="flex items-center gap-5 px-5 py-5 pt-1">
              <span className="flex items-center gap-1 text-[15px] cursor-pointer" onClick={getTotalUsersByYear}>
                <span className="block w-[8px] h-[8px] rounded-full bg-primary "
                ></span>
                Tổng số người dùng
              </span>
    
              <span className="flex items-center gap-1 text-[15px] cursor-pointer" onClick={getTotalSalesByYear}>
                <span className="block w-[8px] h-[8px] rounded-full bg-green-600  "
                ></span>
                Tổng doanh thu
              </span>
            </div>
    
    
            <div className="px-5 overflow-x-scroll">
    
              {chartData?.length !== 0 &&
                <BarChart
                  width={context?.windowWidth > 920 ? (context?.windowWidth - 350) : 800}
                  height={500}
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: 5,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    dataKey="name"
                    scale="point"
                    padding={{ left: 10, right: 10 }}
                    tick={{ fontSize: 12 }}
                    label={{ position: "insideBottom", fontSize: 14 }}
                    style={{ fill: context?.theme === "dark" ? "white" : "#000" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ position: "insideBottom", fontSize: 14 }}
                    style={{ fill: context?.theme === "dark" ? "white" : "#000" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#071739  ",
                      color: "white",
                    }} // Set tooltip background and text color
                    labelStyle={{ color: "yellow" }} // Label text color
                    itemStyle={{ color: "cyan" }} // Set color for individual items in the tooltip
                    cursor={{ fill: "white" }} // Customize the tooltip cursor background on hover
                  />
                  <Legend />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    vertical={false}
                  />
                  <Bar dataKey="TotalSales" stackId="a" fill="#16a34a" />
                  <Bar dataKey="TotalUsers" stackId="b" fill="#0858f7" />
    
                </BarChart>
              }
            </div>
          </div>
    </>
  );
};

export default Dashboard;
