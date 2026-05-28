import React, { useContext, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { MyContext } from "../../App";
import { postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from "react-router-dom";

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const Register = () => {

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    password: ""
  })

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0)
    const token = localStorage.getItem('accessToken');

    if (token !== undefined && token !== null && token !== "") {
      history("/")
    }

  }, []);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setFormFields(() => {
      return {
        ...formFields,
        [name]: value
      }
    })
  }

  const valideValue = Object.values(formFields).every(el => el)

  const handleSubmit = (e) => {
    e.preventDefault();

    setIsLoading(true);

    if (formFields.name === "") {
      context.alertBox("error", "Vui lòng nhập họ và tên");
      setIsLoading(false);
      return false
    }

    if (formFields.name.length < 3 || formFields.name.length > 30) {
      context.alertBox("error", "Họ và tên phải từ 3 đến 30 ký tự");
      setIsLoading(false);
      return false;
    }

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(formFields.name)) {
      context.alertBox("error", "Họ và tên chỉ được chứa chữ cái");
      setIsLoading(false);
      return false;
    }

    if (formFields.email === "") {
      context.alertBox("error", "Vui lòng nhập email");
      setIsLoading(false);
      return false
    }

    if (formFields.email.length > 50) {
      context.alertBox("error", "Email không được vượt quá 50 ký tự");
      setIsLoading(false);
      return false;
    }

    if (formFields.password === "") {
      context.alertBox("error", "Vui lòng nhập mật khẩu");
      setIsLoading(false);
      return false
    }

    if (formFields.password.length < 6 || formFields.password.length > 20) {
      context.alertBox("error", "Mật khẩu phải từ 6 đến 20 ký tự");
      setIsLoading(false);
      return false;
    }

    postData("/api/user/register", formFields).then((res) => {

      if (res?.error !== true) {
        setIsLoading(false);
        context.alertBox("success", res?.message);
        localStorage.setItem("userEmail", formFields.email)
        setFormFields({
          name: "",
          email: "",
          password: ""
        })

        history("/verify")
      } else {
        context.alertBox("error", res?.message);
        setIsLoading(false);
      }

    })

  }

  const authWithGoogle = () => {

    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        const idToken = await user.getIdToken();

        const fields = {
          name: user.providerData[0].displayName,
          email: user.providerData[0].email,
          password: null,
          avatar: user.providerData[0].photoURL,
          mobile: user.providerData[0].phoneNumber,
          role: "USER",
          idToken: idToken
        };

        postData("/api/user/authWithGoogle", fields).then((res) => {

          if (res?.error !== true) {
            setIsLoading(false);
            context.alertBox("success", res?.message);
            localStorage.setItem("userEmail", fields.email)
            localStorage.setItem("accessToken", res?.data?.accesstoken);
            localStorage.setItem("refreshToken", res?.data?.refreshToken);

            context.setIsLogin(true);

            history("/")
          } else {
            context.alertBox("error", res?.message);
            setIsLoading(false);
          }

        })

      }).catch((error) => {
        setIsLoading(false);
        const errorMessage = error?.message || "Đã xảy ra lỗi khi đăng ký bằng Google";
        context.alertBox("error", errorMessage);
        console.error("Google Auth Error:", error?.code, error?.message);
      });

  }

  return (
    <section className="section py-5 sm:py-10">
      <div className="container">
        <div className="card shadow-md w-full sm:w-[400px] m-auto rounded-md bg-white p-5 px-10">
          <h3 className="text-center text-[18px] text-black">
            Đăng ký tài khoản mới
          </h3>

          <form className="w-full mt-5" onSubmit={handleSubmit}>
            <div className="form-group w-full mb-5">
              <TextField
                type="text"
                id="name"
                name="name"
                value={formFields.name}
                disabled={isLoading === true ? true : false}
                label="Họ và tên"
                variant="outlined"
                className="w-full"
                onChange={onChangeInput}
              />
            </div>

            <div className="form-group w-full mb-5">
              <TextField
                type="email"
                id="email"
                name="email"
                label="Email"
                value={formFields.email}
                disabled={isLoading === true ? true : false}
                variant="outlined"
                className="w-full"
                onChange={onChangeInput}
              />
            </div>

            <div className="form-group w-full mb-5 relative">
              <TextField
                type={isPasswordShow === false ? 'password' : 'text'}
                id="password"
                name="password"
                label="Mật khẩu"
                variant="outlined"
                className="w-full"
                value={formFields.password}
                disabled={isLoading === true ? true : false}
                onChange={onChangeInput}
              />
              <Button className="!absolute top-[10px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-black" onClick={() => {
                setIsPasswordShow(!isPasswordShow)
              }}>
                {
                  isPasswordShow === false ? <IoMdEye className="text-[20px] opacity-75" /> :
                    <IoMdEyeOff className="text-[20px] opacity-75" />
                }
              </Button>
            </div>

            <div className="flex items-center w-full mt-3 mb-3">
              <Button type="submit" disabled={!valideValue} className="btn-org btn-lg w-full flex gap-3">
                {
                  isLoading === true ? <CircularProgress color="inherit" />
                    :
                    'Đăng ký'
                }

              </Button>
            </div>

            <p className="text-center">Đã có tài khoản? <Link className="link text-[14px] font-[600] text-primary" to="/login"> Đăng nhập</Link></p>

            <p className="text-center font-[500]">Hoặc tiếp tục bằng tài khoản mạng xã hội</p>

            <Button className="flex gap-3 w-full !bg-[#f1f1f1] btn-lg !text-black"
              onClick={authWithGoogle}>
              <FcGoogle className="text-[20px]" /> Đăng ký bằng Google</Button>

          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;
