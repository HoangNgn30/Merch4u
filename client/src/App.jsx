import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import "./responsive.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import { ProductDetails } from "./Pages/ProductDetails";
import { createContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import CartPage from "./Pages/Cart";
import Verify from "./Pages/Verify";
import ForgotPassword from "./Pages/ForgotPassword";
import Checkout from "./Pages/Checkout";
import MyAccount from "./Pages/MyAccount";
import MyList from "./Pages/MyList";
import Orders from "./Pages/Orders";
import Coupons from "./Pages/MyAccount/Coupons";

import toast, { Toaster } from 'react-hot-toast';
import { fetchDataFromApi, postData } from "./utils/api";
import Address from "./Pages/MyAccount/address";
import { OrderSuccess } from "./Pages/Orders/success";
import { OrderFailed } from "./Pages/Orders/failed";
import SearchPage from "./Pages/Search";
import BlogDetail from "./Pages/BlogDetail";
import Header2 from "./components/Header2";
import AIChatBot from "./components/AIChatBot";
import ConfirmDialog from "./components/ConfirmDialog";
import CouponGame from "./Pages/CouponGame";

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff5252',
    },
    secondary: {
      main: '#171717',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Chiron GoRound TC", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '25px',
          padding: '8px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(255, 82, 82, 0.25)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
          backgroundImage: 'none',
          transition: 'all 0.3s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          padding: '8px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
        list: {
          padding: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '0 4px',
          padding: '10px 16px',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 82, 82, 0.08)',
            color: '#ff5252',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 82, 82, 0.1) !important',
            color: '#ff5252',
            fontWeight: 600,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          padding: '10px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: '12px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ff5252',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 82, 82, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 30px rgba(255,82,82,0.15)',
          },
        },
      },
    },
  },
});

const MyContext = createContext();

function App() {
  console.log("%c🚀 Client App is running...", "color: #4caf50; font-weight: bold;");
  const [openProductDetailsModal, setOpenProductDetailsModal] = useState({
    open: false,
    item: {}
  });
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [catData, setCatData] = useState([]);
  const [cartData, setCartData] = useState([]);
  const [myListData, setMyListData] = useState([]);

  const [openCartPanel, setOpenCartPanel] = useState(false);
  const [openAddressPanel, setOpenAddressPanel] = useState(false);

  const [addressMode, setAddressMode] = useState("add");
  const [addressId, setAddressId] = useState("");
  const [searchData, setSearchData] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [openFilter, setOpenFilter] = useState(false);
  const [isFilterBtnShow, setisFilterBtnShow] = useState(false);

  const [openSearchPanel, setOpenSearchPanel] = useState(false);

  const [confirmBox, setConfirmBox] = useState({
    open: false,
    title: "Bạn có chắc chắn muốn xóa?",
    msg: "Hành động này không thể hoàn tác.",
    onConfirm: null
  });

  const showConfirmBox = (title, msg, onConfirm) => {
    setConfirmBox({
      open: true,
      title: title || "Bạn có chắc chắn muốn xóa?",
      msg: msg || "Hành động này không thể hoàn tác.",
      onConfirm: onConfirm
    });
  }

  const handleConfirm = () => {
    if (confirmBox.onConfirm) {
      confirmBox.onConfirm();
    }
    setConfirmBox((prev) => ({ ...prev, open: false, onConfirm: null }));
  }

  const handleCloseConfirm = () => {
    setConfirmBox((prev) => ({ ...prev, open: false, onConfirm: null }));
  }

  const handleOpenProductDetailsModal = (status, item) => {
    setOpenProductDetailsModal({
      open: status,
      item: item
    });
  }

  const handleCloseProductDetailsModal = () => {
    setOpenProductDetailsModal({
      open: false,
      item: {}
    });
  };

  const toggleCartPanel = (newOpen) => () => {
    setOpenCartPanel(newOpen);
  };

  const toggleAddressPanel = (newOpen) => () => {
    if (newOpen === false) {
      setAddressMode("add");
    }

    setOpenAddressPanel(newOpen);
  };




  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      if (!isLogin) setIsLogin(true);
      getCartItems();
      getMyListData();
      getUserDetails();
    } else {
      if (isLogin) setIsLogin(false);
    }
  }, [isLogin]);


  const getUserDetails = () => {
    fetchDataFromApi(`/api/user/user-details`).then((res) => {
      setUserData(res.data);
      if (res?.response?.data?.error === true) {
        if (res?.response?.data?.message === "You have not login") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          alertBox("error", "Your session is closed please login again");


          //window.location.href = "/login"

          setIsLogin(false);
        }
      }
    })
  }



  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      if (res?.error === false) {
        setCatData(res?.data);
      }
    })

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, []);

  const alertBox = (type, msg) => {
    if (type === "success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg)
    }
  }



  const addToCart = (product, userId, quantity) => {

    if (!isLogin || userId === undefined) {
      alertBox("error", "Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng");
      return false;
    }

    if (product?.countInStock !== undefined && product?.countInStock <= 0) {
      alertBox("error", "Sản phẩm đã hết hàng");
      return false;
    }
    if (product?.countInStock !== undefined && quantity > product.countInStock) {
      alertBox("error", `Chỉ còn ${product.countInStock} sản phẩm trong kho`);
      return false;
    }

    const getSingleValue = (val) => {
      if (Array.isArray(val)) {
        return val[0] || "";
      }
      return val || "";
    };

    const data = {
      productTitle: product?.name || product?.productTitle,
      image: product?.image,
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity: quantity,
      subTotal: parseInt(product?.price * quantity),
      productId: product?._id || product?.productId,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: getSingleValue(product?.size),
      weight: getSingleValue(product?.weight),
      ram: getSingleValue(product?.ram)
    }


    postData("/api/cart/add", data).then((res) => {
      if (res?.error === false) {
        alertBox("success", res?.message);

        getCartItems();


      } else {
        alertBox("error", res?.message);
      }

    })


  }



  const getCartItems = () => {
    fetchDataFromApi(`/api/cart/get`).then((res) => {
      if (res?.error === false) {
        setCartData(res?.data);
      }
    })
  }



  const getMyListData = () => {
    fetchDataFromApi("/api/myList").then((res) => {
      if (res?.error === false) {
        setMyListData(res?.data)
      }
    })
  }

  const values = {
    openProductDetailsModal,
    setOpenProductDetailsModal,
    handleOpenProductDetailsModal,
    handleCloseProductDetailsModal,
    setOpenCartPanel,
    toggleCartPanel,
    openCartPanel,
    setOpenAddressPanel,
    toggleAddressPanel,
    openAddressPanel,
    isLogin,
    setIsLogin,
    alertBox,
    setUserData,
    userData,
    setCatData,
    catData,
    addToCart,
    cartData,
    setCartData,
    getCartItems,
    myListData,
    setMyListData,
    getMyListData,
    getUserDetails,
    setAddressMode,
    addressMode,
    addressId,
    setAddressId,
    setSearchData,
    searchData,
    windowWidth,
    setOpenFilter,
    openFilter,
    setisFilterBtnShow,
    isFilterBtnShow,
    setOpenSearchPanel,
    openSearchPanel,
    showConfirmBox
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <MyContext.Provider value={values}>
            <AIChatBot />
            <Header2/>
            <Routes>
              <Route path={"/"} exact={true} element={<Home />} />
              <Route
                path={"/products"}
                exact={true}
                element={<ProductListing />}
              />
              <Route
                path={"/product/:id"}
                exact={true}
                element={<ProductDetails />}
              />
              <Route path={"/login"} exact={true} element={<Login />} />
              <Route path={"/register"} exact={true} element={<Register />} />
              <Route path={"/cart"} exact={true} element={<CartPage />} />
              <Route path={"/verify"} exact={true} element={<Verify />} />
              <Route path={"/forgot-password"} exact={true} element={<ForgotPassword />} />
              <Route path={"/checkout"} exact={true} element={<Checkout />} />
              <Route path={"/my-account"} exact={true} element={<MyAccount />} />
              <Route path={"/my-list"} exact={true} element={<MyList />} />
              <Route path={"/my-orders"} exact={true} element={<Orders />} />
              <Route path={"/my-coupons"} exact={true} element={<Coupons />} />
              <Route path={"/order/success"} exact={true} element={<OrderSuccess />} />
              <Route path={"/order/failed"} exact={true} element={<OrderFailed />} />
              <Route path={"/my-coupons"} exact={true} element={<Coupons />} />
              <Route path={"/order/success"} exact={true} element={<OrderSuccess />} />
              <Route path={"/order/failed"} exact={true} element={<OrderFailed />} />
              <Route path={"/address"} exact={true} element={<Address />} />
              <Route path={"/search"} exact={true} element={<SearchPage />} />
              <Route path={"/blog/:id"} exact={true} element={<BlogDetail />} />
              <Route path={"/coupon-game"} exact={true} element={<CouponGame />} />
            </Routes>
            <Footer />
            <ConfirmDialog
              open={confirmBox.open}
              title={confirmBox.title}
              message={confirmBox.msg}
              onClose={handleCloseConfirm}
              onConfirm={handleConfirm}
            />
            <Toaster />
          </MyContext.Provider>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
}

export default App;

export { MyContext };
