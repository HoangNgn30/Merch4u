import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";
import AccountSidebar from "../../components/AccountSidebar";
import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { editData, postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";
import { Collapse } from "react-collapse";

const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181";

const normalizePhoneNumber = (mobile) => {
  if (!mobile) return "";
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

const MyAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [userId, setUserId] = useState("");
  const [isChangePasswordFormShow, setIsChangePasswordFormShow] = useState(false);

  const [formFields, setFormsFields] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [changePassword, setChangePassword] = useState({
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token === null) {
      history("/");
    }
  }, [context?.isLogin, history]);

  useEffect(() => {
    if (context?.userData?._id) {
      setUserId(context.userData._id);
      setFormsFields({
        name: context?.userData?.name || "",
        email: context?.userData?.email || "",
        mobile: context?.userData?.mobile || "",
      });

      setChangePassword((prev) => ({
        ...prev,
        email: context?.userData?.email || "",
      }));
    }
  }, [context?.userData]);

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "mobile" ? value.replace(/[^\d]/g, "").slice(0, 13) : value;

    if (["name", "email", "mobile"].includes(name)) {
      setFormsFields((prev) => ({
        ...prev,
        [name]: nextValue,
      }));
    }

    if (["oldPassword", "newPassword", "confirmPassword"].includes(name)) {
      setChangePassword((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validProfile = Object.values(formFields).every((el) => el);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formFields.name.trim() === "") {
      context.alertBox("error", "Vui lòng nhập họ và tên");
      setIsLoading(false);
      return;
    }

    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/u;
    if (!nameRegex.test(formFields.name)) {
      context.alertBox("error", "Họ và tên chỉ được chứa chữ cái");
      setIsLoading(false);
      return;
    }

    if (formFields.name.length < 3 || formFields.name.length > 30) {
      context.alertBox("error", "Họ và tên phải từ 3 đến 30 ký tự");
      setIsLoading(false);
      return;
    }

    if (formFields.email.trim() === "") {
      context.alertBox("error", "Vui lòng nhập email");
      setIsLoading(false);
      return;
    }

    const normalizedMobile = normalizePhoneNumber(formFields.mobile);
    if (!PHONE_REGEX.test(normalizedMobile)) {
      context.alertBox("error", PHONE_MESSAGE);
      setIsLoading(false);
      return;
    }

    const payload = { ...formFields, mobile: normalizedMobile };

    editData(`/api/user/update-profile`, payload, { withCredentials: true }).then((res) => {
      if (res?.data?.error !== true) {
        context.alertBox("success", res?.data?.message || "Cập nhật hồ sơ thành công");
        setFormsFields((prev) => ({ ...prev, mobile: normalizedMobile }));
        context?.getUserDetails?.();
      } else {
        context.alertBox("error", res?.data?.message || "Không thể cập nhật hồ sơ");
      }

      setIsLoading(false);
    });
  };

  const handleSubmitChangePassword = (e) => {
    e.preventDefault();
    setIsLoading2(true);

    if (context?.userData?.signUpWithGoogle === false && changePassword.oldPassword === "") {
      context.alertBox("error", "Vui lòng nhập mật khẩu cũ");
      setIsLoading2(false);
      return;
    }

    if (changePassword.newPassword === "") {
      context.alertBox("error", "Vui lòng nhập mật khẩu mới");
      setIsLoading2(false);
      return;
    }

    if (changePassword.confirmPassword === "") {
      context.alertBox("error", "Vui lòng nhập lại mật khẩu mới");
      setIsLoading2(false);
      return;
    }

    if (changePassword.confirmPassword !== changePassword.newPassword) {
      context.alertBox("error", "Mật khẩu xác nhận không khớp");
      setIsLoading2(false);
      return;
    }

    postData("/api/user/reset-password", changePassword, { withCredentials: true }).then((res) => {
      if (res?.error !== true) {
        context.alertBox("success", res?.message || "Đổi mật khẩu thành công");
        setChangePassword((prev) => ({
          ...prev,
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        context.alertBox("error", res?.message || "Không thể đổi mật khẩu");
      }

      setIsLoading2(false);
    });
  };

  return (
    <section className="py-3 lg:py-10 w-full">
      <div className="container flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-[20%]">
          <AccountSidebar />
        </div>

        <div className="col2 w-full lg:w-[50%]">
          <div className="card bg-white p-5 shadow-md rounded-md mb-5">
            <div className="flex items-center pb-3">
              <h2 className="pb-0">Hồ sơ của tôi</h2>
              <Button className="!ml-auto" onClick={() => setIsChangePasswordFormShow(!isChangePasswordFormShow)}>
                Đổi mật khẩu
              </Button>
            </div>
            <hr />

            <form className="mt-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ">
                <div className="col">
                  <TextField
                    label="Họ và tên"
                    variant="outlined"
                    size="small"
                    className="w-full"
                    name="name"
                    value={formFields.name}
                    disabled={isLoading === true}
                    onChange={onChangeInput}
                  />
                </div>

                <div className="col">
                  <TextField
                    type="email"
                    label="Email"
                    variant="outlined"
                    size="small"
                    className="w-full"
                    name="email"
                    value={formFields.email}
                    disabled={true}
                    onChange={onChangeInput}
                  />
                </div>

                <div className="col">
                  <TextField
                    label="Số điện thoại"
                    variant="outlined"
                    size="small"
                    className="w-full"
                    name="mobile"
                    value={formFields.mobile}
                    disabled={isLoading === true}
                    onChange={onChangeInput}
                    placeholder="VD: 0326851181"
                    inputProps={{ inputMode: "numeric", maxLength: 13 }}
                  />
                </div>
              </div>

              <br />

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={!validProfile} className="btn-org btn-sm w-[170px]">
                  {isLoading === true ? <CircularProgress color="inherit" /> : "Cập nhật hồ sơ"}
                </Button>
              </div>
            </form>
          </div>

          <Collapse isOpened={isChangePasswordFormShow}>
            <div className="card bg-white p-5 shadow-md rounded-md">
              <div className="flex items-center pb-3">
                <h2 className="pb-0">Đổi mật khẩu</h2>
              </div>
              <hr />

              <form className="mt-8" onSubmit={handleSubmitChangePassword}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {context?.userData?.signUpWithGoogle === false && (
                    <div className="col">
                      <TextField
                        type="password"
                        label="Mật khẩu cũ"
                        variant="outlined"
                        size="small"
                        className="w-full"
                        name="oldPassword"
                        value={changePassword.oldPassword}
                        disabled={isLoading2 === true}
                        onChange={onChangeInput}
                      />
                    </div>
                  )}

                  <div className="col">
                    <TextField
                      type="password"
                      label="Mật khẩu mới"
                      variant="outlined"
                      size="small"
                      className="w-full"
                      name="newPassword"
                      value={changePassword.newPassword}
                      onChange={onChangeInput}
                    />
                  </div>

                  <div className="col">
                    <TextField
                      type="password"
                      label="Nhập lại mật khẩu mới"
                      variant="outlined"
                      size="small"
                      className="w-full"
                      name="confirmPassword"
                      value={changePassword.confirmPassword}
                      onChange={onChangeInput}
                    />
                  </div>
                </div>

                <br />

                <div className="flex items-center gap-4">
                  <Button type="submit" className="btn-org btn-sm w-[200px]">
                    {isLoading2 === true ? <CircularProgress color="inherit" /> : "Đổi mật khẩu"}
                  </Button>
                </div>
              </form>
            </div>
          </Collapse>
        </div>
      </div>
    </section>
  );
};

export default MyAccount;
