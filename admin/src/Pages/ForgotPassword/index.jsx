import { Button } from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CgLogIn } from "react-icons/cg";
import { FaRegUser } from "react-icons/fa6";
import CircularProgress from '@mui/material/CircularProgress';
import { MyContext } from "../../App";
import { postData, fetchDataFromApi } from "../../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    fetchDataFromApi("/api/logo").then((res) => {
      if (res?.logo && res.logo.length > 0) {
        localStorage.setItem('logo', res.logo[0]?.logo);
      }
    }).catch((err) => {
      console.error("Failed to fetch logo:", err);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === "") {
      context.alertBox("error", "Vui lòng nhập email");
      return;
    }

    setIsLoading(true);

    postData("/api/user/forgot-password", { email }).then((res) => {
      setIsLoading(false);
      if (res?.error === false) {
        context.alertBox("success", res?.message);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("actionType", 'forgot-password');
        history("/verify-account");
      } else {
        context.alertBox("error", res?.message || "Có lỗi xảy ra, vui lòng thử lại");
      }
    }).catch((err) => {
      setIsLoading(false);
      context.alertBox("error", err?.message || "Kết nối máy chủ thất bại");
    });
  };

  return (
    <section className="bg-white w-full h-[100vh]">
      <header className="w-full fixed top-0 left-0  px-4 py-3 flex items-center justify-between z-50">
        <Link to="/">
          <img
            src={localStorage.getItem('logo')}
            className="w-[200px]"
            alt="Logo"
          />
        </Link>

        <div className="flex items-center gap-0">
          <NavLink to="/login" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <CgLogIn className="text-[18px]" /> Đăng nhập
            </Button>
          </NavLink>

          <NavLink to="/sign-up" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <FaRegUser className="text-[15px]" /> Đăng ký
            </Button>
          </NavLink>
        </div>
      </header>
      <img src="/patern.webp" className="w-full fixed top-0 left-0 opacity-5" />

      <div className="loginBox card w-full md:w-[600px] h-[auto] pb-20 mx-auto pt-20 relative z-50">
        <div className="text-center">
          <img src="/icon.svg" className="m-auto" alt="Icon" />
        </div>

        <h1 className="text-center text-[18px] sm:text-[35px] font-[800] mt-4">
          Gặp sự cố khi đăng nhập?<br />
          Đặt lại mật khẩu của bạn.
        </h1>

        <br />

        <form className="w-full px-8 mt-3" onSubmit={handleSubmit}>
          <div className="form-group mb-4 w-full">
            <h4 className="text-[14px] font-[500] mb-1">Email</h4>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="w-full h-[50px] border-2 border-[rgba(0,0,0,0.1)] rounded-md focus:border-[rgba(0,0,0,0.7)] focus:outline-none px-3"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="btn-blue btn-lg w-full">
            {isLoading ? <CircularProgress color="inherit" size={24} /> : "Đặt lại mật khẩu"}
          </Button>

          <br/><br/>
          <div className="text-center flex items-center justify-center gap-4">
            <span>Không muốn đặt lại? </span>
            <Link
              to="/login"
              className="text-primary font-[700] text-[15px] hover:underline hover:text-gray-700"
            >
              Đăng nhập?
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
