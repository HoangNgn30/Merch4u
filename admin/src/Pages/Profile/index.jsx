import React, { useContext, useEffect, useState } from "react";
import { MyContext } from "../../App";
import { FaCloudUploadAlt } from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";
import { editData, postData, uploadImage } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { Collapse } from "react-collapse";

const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181";

const Profile = () => {
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);
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
            history("/login");
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

    useEffect(() => {
        if (context?.userData?.avatar) {
            setPreviews([context.userData.avatar]);
        }
    }, [context?.userData]);

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value;

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

        if (formFields.email.trim() === "") {
            context.alertBox("error", "Vui lòng nhập email");
            setIsLoading(false);
            return;
        }

        if (!PHONE_REGEX.test(formFields.mobile)) {
            context.alertBox("error", PHONE_MESSAGE);
            setIsLoading(false);
            return;
        }

        editData(`/api/user/${userId}`, formFields, { withCredentials: true }).then((res) => {
            if (res?.data?.error !== true) {
                context.alertBox("success", res?.data?.message || "Cập nhật hồ sơ thành công");
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

    const onChangeFile = async (e) => {
        try {
            setPreviews([]);
            const files = e.target.files;
            setUploading(true);
            const formdata = new FormData();

            for (let i = 0; i < files.length; i++) {
                if (
                    files[i] &&
                    (files[i].type === "image/jpeg" ||
                        files[i].type === "image/jpg" ||
                        files[i].type === "image/png" ||
                        files[i].type === "image/webp")
                ) {
                    formdata.append("avatar", files[i]);
                } else {
                    context.alertBox("error", "Vui lòng chọn ảnh JPG, PNG hoặc WebP hợp lệ");
                    setUploading(false);
                    return;
                }
            }

            uploadImage("/api/user/user-avatar", formdata).then((res) => {
                setUploading(false);
                setPreviews([res?.data?.avtar]);
                context?.getUserDetails?.();
            });
        } catch (error) {
            setUploading(false);
            context.alertBox("error", "Không thể tải ảnh lên");
        }
    };

    return (
        <>
            <div className="card my-2 pt-3 w-[100%] sm:w-[100%] lg:w-[65%] shadow-md sm:rounded-lg bg-white px-5 pb-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-[18px] font-[600]">Hồ sơ người dùng</h2>
                    <Button className="!ml-auto" onClick={() => setIsChangePasswordFormShow(!isChangePasswordFormShow)}>
                        Đổi mật khẩu
                    </Button>
                </div>

                <br />

                <div className="w-[110px] h-[110px] rounded-full overflow-hidden mb-4 relative group flex items-center justify-center bg-gray-200">
                    {uploading === true ? (
                        <CircularProgress color="inherit" />
                    ) : previews?.length !== 0 ? (
                        previews.map((img, index) => (
                            <img src={img} key={index} className="w-full h-full object-cover" />
                        ))
                    ) : (
                        <img src="/user.jpg" className="w-full h-full object-cover" />
                    )}

                    <div className="overlay w-[100%] h-[100%] absolute top-0 left-0 z-50 bg-[rgba(0,0,0,0.7)] flex items-center justify-center cursor-pointer opacity-0 transition-all group-hover:opacity-100">
                        <FaCloudUploadAlt className="text-[#fff] text-[25px]" />
                        <input
                            type="file"
                            className="absolute top-0 left-0 w-full h-full opacity-0"
                            accept="image/*"
                            onChange={onChangeFile}
                            name="avatar"
                        />
                    </div>
                </div>

                <form className="form mt-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="col">
                            <input
                                type="text"
                                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                name="name"
                                value={formFields.name}
                                disabled={isLoading === true}
                                onChange={onChangeInput}
                                placeholder="Họ và tên"
                            />
                        </div>

                        <div className="col">
                            <input
                                type="email"
                                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                name="email"
                                value={formFields.email}
                                disabled={true}
                                onChange={onChangeInput}
                                placeholder="Email"
                            />
                        </div>

                        <div className="col">
                            <input
                                type="text"
                                className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                name="mobile"
                                value={formFields.mobile}
                                disabled={isLoading === true}
                                onChange={onChangeInput}
                                placeholder="VD: 0326851181"
                                maxLength={10}
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    <br />

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={!validProfile} className="btn-blue btn-lg w-full">
                            {isLoading === true ? <CircularProgress color="inherit" /> : "Cập nhật hồ sơ"}
                        </Button>
                    </div>
                </form>
            </div>

            <Collapse isOpened={isChangePasswordFormShow}>
                <div className="card w-[100%] sm:w-[100%] lg:w-[65%] bg-white p-5 shadow-md rounded-md">
                    <div className="flex items-center pb-3">
                        <h2 className="text-[18px] font-[600] pb-0">Đổi mật khẩu</h2>
                    </div>
                    <hr />

                    <form className="mt-8" onSubmit={handleSubmitChangePassword}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {context?.userData?.signUpWithGoogle === false && (
                                <div className="col">
                                    <input
                                        type="password"
                                        className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                        name="oldPassword"
                                        value={changePassword.oldPassword}
                                        disabled={isLoading2 === true}
                                        onChange={onChangeInput}
                                        placeholder="Mật khẩu cũ"
                                    />
                                </div>
                            )}

                            <div className="col">
                                <input
                                    type="password"
                                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                    name="newPassword"
                                    value={changePassword.newPassword}
                                    disabled={isLoading2 === true}
                                    onChange={onChangeInput}
                                    placeholder="Mật khẩu mới"
                                />
                            </div>

                            <div className="col">
                                <input
                                    type="password"
                                    className="w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm"
                                    name="confirmPassword"
                                    value={changePassword.confirmPassword}
                                    disabled={isLoading2 === true}
                                    onChange={onChangeInput}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                        </div>

                        <br />

                        <div className="flex items-center gap-4">
                            <Button type="submit" className="btn-blue btn-lg w-[100%]">
                                {isLoading2 === true ? <CircularProgress color="inherit" /> : "Đổi mật khẩu"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Collapse>
        </>
    );
};

export default Profile;
