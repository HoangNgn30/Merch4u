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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { MyContext } from '../../App';
import SearchBox from "../../Components/SearchBox";
import { fetchDataFromApi } from "../../utils/api";
import Products from "../Products";

const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6",
  "#3b82f6", "#f43f5e", "#a855f7", "#0ea5e9", "#22c55e"
];

const translateStatus = (status) => {
  const mapping = {
    pending: "Chờ xử lý",
    confirm: "Đã xác nhận",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
    unknown: "Chưa rõ"
  };
  return mapping[status.toLowerCase()] || status;
};

const addressTypeLabel = {
  Home: "Nhà riêng",
  Office: "Công ty",
};

const formatPhoneNumber = (mobile) => {
  if (!mobile || mobile === "-") return "";
  let cleaned = String(mobile).replace(/[^\d]/g, "").trim();
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

const formatCurrencyCompact = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(0) + " Tr";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + " k";
  }
  return value;
};

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
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [combinedChartData, setCombinedChartData] = useState([]);

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

    fetchDataFromApi("/api/order/delivered-charts-data").then((res) => {
      if (res?.error === false) {
        setTopProductsData(res.topProductsData || []);
        setCategoryData(res.categoryData || []);
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
      updateCombinedData("users", uniqueArr);
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
      updateCombinedData("sales", uniqueArr);
    });
  }

  const updateCombinedData = (type, data) => {
    setCombinedChartData((prev) => {
      const newCombined = [...prev];
      data.forEach((item) => {
        const existingRec = newCombined.find((r) => r.name === item.name);
        if (existingRec) {
          if (type === "sales") existingRec.TotalSales = item.TotalSales;
          if (type === "users") existingRec.TotalUsers = item.TotalUsers;
        } else {
          newCombined.push({
            name: item.name,
            TotalSales: type === "sales" ? item.TotalSales : 0,
            TotalUsers: type === "users" ? item.TotalUsers : 0,
          });
        }
      });
      return newCombined.sort((a, b) => {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return months.indexOf(a.name?.toUpperCase()) - months.indexOf(b.name?.toUpperCase());
      });
    });
  }

  useEffect(() => {
    if (totalOrdersData?.data?.length > 0) {
      const statusCounts = {};
      totalOrdersData.data.forEach((order) => {
        const translated = translateStatus(order.order_status || "unknown");
        statusCounts[translated] = (statusCounts[translated] || 0) + 1;
      });
      const formattedStatusData = Object.keys(statusCounts).map((statusName) => ({
        name: statusName,
        value: statusCounts[statusName],
      }));
      setOrderStatusData(formattedStatusData);
    }
  }, [totalOrdersData]);



  useEffect(() => {
    getTotalUsersByYear();
  }, []);



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

      {/* <Products/> */}

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
          <table className="w-full text-sm text-left rtl:text-right text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-slate-50 border-b border-slate-100">
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
                  Tên
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  SĐT
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap">
                  Địa chỉ
                </th>

                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  Tổng số tiền
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  ID người dùng
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  Trạng thái đơn hàng
                </th>
                <th scope="col" className="px-6 py-3 whitespace-nowrap text-center">
                  Ngày
                </th>
              </tr>
            </thead>
            <tbody>

              {
                ordersData?.length !== 0 && ordersData?.map((order, index) => {
                  return (
                    <React.Fragment key={order?._id || index}>
                      <tr className="bg-white border-b hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-[500] w-[50px]">
                        <button
                          type="button"
                          onClick={() => isShowOrderdProduct(index)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center transition-all shadow-sm focus:outline-none"
                        >
                          {isOpenOrderdProduct === index ? (
                            <FaAngleUp className="text-[15px] text-[#ff5252]" />
                          ) : (
                            <FaAngleDown className="text-[15px] text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-semibold text-center text-slate-800">
                        <span className="text-xs font-mono select-all bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {order?._id}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-[500] text-center">
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

                      <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">
                        {order?.userId?.name || "Khách ẩn danh"}
                      </td>

                      <td className="px-6 py-4 font-[500] text-slate-700 text-center">
                        {formatPhoneNumber(order?.delivery_address?.mobile) || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span className='inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200 uppercase tracking-wider mb-1'>
                          {addressTypeLabel[order?.delivery_address?.addressType] || order?.delivery_address?.addressType || "Địa chỉ"}
                        </span>
                        <span className="block w-[260px] text-[12px] leading-relaxed text-slate-700 font-medium">
                          {[
                            order?.delivery_address?.address_line1,
                            order?.delivery_address?.city,
                            order?.delivery_address?.state,
                            order?.delivery_address?.country
                          ].filter(Boolean).join(", ") +
                           (order?.delivery_address?.landmark ? ` (${order?.delivery_address?.landmark})` : "")}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-[#ff5252] text-center text-[14px]">{order?.totalAmt?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                      <td className="px-6 py-4 font-[500] text-slate-500 text-center">
                        {order?.userId?.email || "-"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {order?.userId?._id || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-[500] text-center">
                        <div className="flex justify-center">
                          <Badge status={order?.order_status} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-[500] text-slate-500 whitespace-nowrap text-center">
                        {order?.createdAt?.split("T")[0]}
                      </td>
                    </tr>

                      {isOpenOrderdProduct === index && (
                        <tr>
                          <td className="pl-20" colSpan="11">
                            <div className="relative overflow-x-auto">
                              <table className="w-full text-sm text-left rtl:text-right text-gray-600">
                                <thead className="text-xs text-gray-500 uppercase bg-slate-50 border-b border-slate-100">
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
                                      Tạm tính
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {
                                    order?.products?.map((item, index) => {
                                      return (
                                        <tr className="bg-white border-b hover:bg-slate-50/50 transition-colors" key={item?._id || index}>
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

                                          <td className="px-6 py-4 font-[500] text-slate-600">{item?.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>

                                          <td className="px-6 py-4 font-bold text-[#ff5252]">{(item?.price * item?.quantity)?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Sales & User Growth Chart */}
        <div className="card shadow-md sm:rounded-lg bg-white p-5 md:col-span-2">
          <h2 className="text-[18px] font-[600] mb-4">Tăng trưởng doanh thu và người dùng</h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tickFormatter={formatCurrencyCompact} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value, name) => {
                    if (name === "Doanh thu") {
                      return [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), name];
                    }
                    return [value + " người", name];
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  yAxisId="left"
                  dataKey="TotalSales"
                  name="Doanh thu"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  yAxisId="right"
                  dataKey="TotalUsers"
                  name="Người dùng mới"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="card shadow-md sm:rounded-lg bg-white p-5">
          <h2 className="text-[18px] font-[600] mb-4">Trạng thái đơn hàng</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {orderStatusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} đơn hàng`, "Số lượng"]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Distribution Chart */}
        <div className="card shadow-md sm:rounded-lg bg-white p-5">
          <h2 className="text-[18px] font-[600] mb-4">Tỉ lệ hàng bán theo danh mục</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 5) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} lượt bán`, "Số lượng"]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products Chart */}
        <div className="card shadow-md sm:rounded-lg bg-white p-5 md:col-span-2">
          <h2 className="text-[18px] font-[600] mb-4">Top 5 sản phẩm bán chạy nhất</h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topProductsData}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorBarSales" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={1} />
                    <stop offset="95%" stopColor="#fdba74" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(249, 115, 22, 0.05)" }}
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value) => [`${value} lượt bán`, "Lượt bán"]}
                />
                <Bar dataKey="sales" name="Lượt bán" fill="url(#colorBarSales)" radius={[0, 6, 6, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
