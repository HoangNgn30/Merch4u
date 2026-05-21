import "./App.css";
import "./responsive.css";
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import AdminShell from "./Components/AdminShell";
import { createContext, useState } from "react";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import Products from "./Pages/Products";

import HomeSliderBanners from "./Pages/HomeSliderBanners";
import CategoryList from "./Pages/Categegory";
import SubCategoryList from "./Pages/Categegory/subCatList";
import Users from "./Pages/Users";
import Orders from "./Pages/Orders";
import ForgotPassword from "./Pages/ForgotPassword";
import VerifyAccount from "./Pages/VerifyAccount";
import ChangePassword from "./Pages/ChangePassword";

import toast, { Toaster } from 'react-hot-toast';
import { fetchDataFromApi } from "./utils/api";
import { useEffect } from "react";
import Profile from "./Pages/Profile";
import ProductDetails from "./Pages/Products/productDetails";
import RightBannerList from "./Pages/Banners/rightBannerList";
import Coupons from "./Pages/Coupons";
import ConfirmDeleteDialog from "./Components/ConfirmDeleteDialog";
import { BlogList } from "./Pages/Blog";
import ManageLogo from "./Pages/ManageLogo";
import LoadingBar from "react-top-loading-bar";

const MyContext = createContext();

const ProtectedRoute = ({ children, isLogin }) => {
  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
function App() {
  const [isSidebarOpen, setisSidebarOpen] = useState(true);
  const [isLogin, setIsLogin] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return token !== undefined && token !== null && token !== "";
  });
  const [userData, setUserData] = useState(null);
  const [address, setAddress] = useState([]);
  const [catData, setCatData] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [sidebarWidth, setSidebarWidth] = useState(18);

  const [progress, setProgress] = useState(0);
  const [confirmDeleteBox, setConfirmDeleteBox] = useState({
    open: false,
    title: "Xác nhận xóa",
    message: "Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.",
    onConfirm: null,
  });

  const [isOpenFullScreenPanel, setIsOpenFullScreenPanel] = useState({
    open: false,
    id: ""
  });


  useEffect(() => {
    localStorage.removeItem("userEmail")
    if (windowWidth < 992) {
      setisSidebarOpen(false);
      setSidebarWidth(100)
    } else {
      setSidebarWidth(18)
    }
  }, [windowWidth])


  useEffect(() => {
    if (!["ADMIN", "SUPERBOSS"].includes(userData?.role)) {
      const handleContextmenu = e => {
        e.preventDefault()
      }
      document.addEventListener('contextmenu', handleContextmenu)
      return function cleanup() {
        document.removeEventListener('contextmenu', handleContextmenu)
      }
    }
  }, [userData])

  const router = createBrowserRouter([
    {
      path: "/",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Dashboard />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/login",
      exact: true,
      element: (
        <>
          <Login />
        </>
      ),
    },
    {
      path: "/sign-up",
      exact: true,
      element: (
        <>
          <SignUp />
        </>
      ),
    },
    {
      path: "/forgot-password",
      exact: true,
      element: (
        <>
          <ForgotPassword />
        </>
      ),
    },
    {
      path: "/verify-account",
      exact: true,
      element: (
        <>
          <VerifyAccount />
        </>
      ),
    },
    {
      path: "/change-password",
      exact: true,
      element: (
        <>
          <ChangePassword />
        </>
      ),
    },
    {
      path: "/products",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Products />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/homeSlider/list",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <HomeSliderBanners />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/category/list",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <CategoryList />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/subCategory/list",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <SubCategoryList />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/users",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Users />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/orders",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Orders />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/profile",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Profile />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/product/:id",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <ProductDetails />
          </AdminShell>
        </ProtectedRoute>
      ),
    },

    {
      path: "/coupons",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <Coupons />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/rightBanner/list",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <RightBannerList />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/blog/List",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <BlogList />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
    {
      path: "/logo/manage",
      exact: true,
      element: (
        <ProtectedRoute isLogin={isLogin}>
          <AdminShell>
                <ManageLogo />
          </AdminShell>
        </ProtectedRoute>
      ),
    },
  ]);

  const showConfirmDelete = (title, message, onConfirm) => {
    setConfirmDeleteBox({
      open: true,
      title: title || "Xác nhận xóa",
      message: message || "Bạn có chắc chắn muốn xóa mục này?",
      onConfirm,
    });
  };

  const handleCloseConfirmDelete = () => {
    setConfirmDeleteBox((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const handleConfirmDelete = () => {
    if (typeof confirmDeleteBox.onConfirm === "function") {
      confirmDeleteBox.onConfirm();
    }
    handleCloseConfirmDelete();
  };

  const alertBox = (type, msg) => {
    if (type === "success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg)
    }
  }


  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      fetchDataFromApi(`/api/user/user-details`).then((res) => {
        if (res?.response?.data?.message === "You have not login" || res?.error === true) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsLogin(false);
          setUserData(null);
          alertBox("error", "Phiên làm việc hết hạn, vui lòng đăng nhập lại");
        } else {
          setUserData(res?.data);
          setIsLogin(true);
        }
      }).catch((err) => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsLogin(false);
        setUserData(null);
        console.error("Token verification error:", err);
      });
    } else {
      setIsLogin(false);
      setUserData(null);
    }
  }, [isLogin]);


  useEffect(() => {
    getCat();

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, [])


  const getCat = () => {
    fetchDataFromApi("/api/category").then((res) => {
      setCatData(res?.data)
    })
  }


  const values = {
    isSidebarOpen,
    setisSidebarOpen,
    isLogin,
    setIsLogin,
    isOpenFullScreenPanel,
    setIsOpenFullScreenPanel,
    alertBox,
    setUserData,
    userData,
    setAddress,
    address,
    catData,
    setCatData,
    getCat,
    windowWidth,
    setSidebarWidth,
    sidebarWidth,
    setProgress,
    progress,
    showConfirmDelete,
  };

  return (
    <>
      <MyContext.Provider value={values}>
        <RouterProvider router={router} />
        <LoadingBar
          color="#1565c0"
          progress={progress}
          onLoaderFinished={() => setProgress(0)}
          className="topLoadingBar"
          height={3}
        />
        <ConfirmDeleteDialog
          open={confirmDeleteBox.open}
          title={confirmDeleteBox.title}
          message={confirmDeleteBox.message}
          onClose={handleCloseConfirmDelete}
          onConfirm={handleConfirmDelete}
        />
        <Toaster />
      </MyContext.Provider>
    </>
  );
}

export default App;
export { MyContext };
