import React, { useContext, useEffect, useState } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { editData, fetchDataFromApi, postData } from "../../utils/api";
import { MyContext } from "../../App";

const PHONE_REGEX = /^0\d{9}$/;
const PHONE_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181";

const normalizePhoneNumber = (mobile) => {
    if (!mobile) return "";
    let cleaned = String(mobile).replace(/[^\d+]/g, "").trim();
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

const AddAddress = () => {
    const [addressType, setAddressType] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [formFields, setFormsFields] = useState({
        address_line1: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
        mobile: "",
        userId: "",
        addressType: "",
        landmark: "",
    });

    const context = useContext(MyContext);

    useEffect(() => {
        if (context?.userData?._id !== undefined) {
            setFormsFields((prevState) => ({
                ...prevState,
                userId: context?.userData?._id,
            }));
        }
    }, [context?.userData]);

    useEffect(() => {
        if (context?.addressMode === "edit") {
            fetchAddress(context?.addressId);
        }
    }, [context?.addressMode, context?.addressId]);

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "mobile" ? value.replace(/[^\d+]/g, "").slice(0, 13) : value;

        setFormsFields((prev) => ({
            ...prev,
            [name]: nextValue,
        }));
    };

    const handleChangeAddressType = (event) => {
        setAddressType(event.target.value);
        setFormsFields((prev) => ({
            ...prev,
            addressType: event.target.value,
        }));
    };

    const resetForm = () => {
        setFormsFields({
            address_line1: "",
            city: "",
            state: "",
            pincode: "",
            country: "",
            mobile: "",
            userId: context?.userData?._id || "",
            addressType: "",
            landmark: "",
        });
        setAddressType("");
    };

    const validateForm = () => {
        if (formFields.address_line1.trim() === "") {
            context.alertBox("error", "Vui lòng nhập địa chỉ");
            return false;
        }

        if (formFields.city.trim() === "") {
            context.alertBox("error", "Vui lòng nhập thành phố/quận huyện");
            return false;
        }

        if (formFields.state.trim() === "") {
            context.alertBox("error", "Vui lòng nhập tỉnh/thành");
            return false;
        }



        if (formFields.country.trim() === "") {
            context.alertBox("error", "Vui lòng nhập quốc gia");
            return false;
        }

        const normalizedMobile = normalizePhoneNumber(formFields.mobile);
        if (!PHONE_REGEX.test(normalizedMobile)) {
            context.alertBox("error", PHONE_MESSAGE);
            return false;
        }



        if (formFields.addressType === "") {
            context.alertBox("error", "Vui lòng chọn loại địa chỉ");
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const normalizedMobile = normalizePhoneNumber(formFields.mobile);
        const payload = { ...formFields, mobile: normalizedMobile };

        setIsLoading(true);

        if (context?.addressMode === "add") {
            postData("/api/address/add", payload, { withCredentials: true }).then((res) => {
                if (res?.error !== true) {
                    context.alertBox("success", res?.message || "Thêm địa chỉ thành công");
                    context.setOpenAddressPanel(false);
                    context.getUserDetails();
                    resetForm();
                } else {
                    context.alertBox("error", res?.message || "Không thể thêm địa chỉ");
                }

                setIsLoading(false);
            });
        }

        if (context?.addressMode === "edit") {
            editData(`/api/address/${context?.addressId}`, payload, { withCredentials: true }).then((res) => {
                if (res?.data?.error !== true) {
                    context.alertBox("success", res?.data?.message || "Cập nhật địa chỉ thành công");
                } else {
                    context.alertBox("error", res?.data?.message || "Không thể cập nhật địa chỉ");
                }

                fetchDataFromApi(`/api/address/get?userId=${context?.userData?._id}`).then(() => {
                    context?.getUserDetails();
                    context.setOpenAddressPanel(false);
                    resetForm();
                    setIsLoading(false);
                });
            });
        }
    };

    const fetchAddress = (id) => {
        fetchDataFromApi(`/api/address/${id}`).then((res) => {
            setFormsFields({
                address_line1: res?.address?.address_line1 || "",
                city: res?.address?.city || "",
                state: res?.address?.state || "",
                pincode: res?.address?.pincode || "",
                country: res?.address?.country || "",
                mobile: res?.address?.mobile || "",
                userId: res?.address?.userId || context?.userData?._id || "",
                addressType: res?.address?.addressType || "",
                landmark: res?.address?.landmark || "",
            });

            setAddressType(res?.address?.addressType || "");
        });
    };

    return (
        <form className="p-8 py-3 pb-8 px-4" onSubmit={handleSubmit}>
            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Địa chỉ"
                    variant="outlined"
                    size="small"
                    name="address_line1"
                    onChange={onChangeInput}
                    value={formFields.address_line1}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Xã/Phường"
                    variant="outlined"
                    size="small"
                    name="city"
                    onChange={onChangeInput}
                    value={formFields.city}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Tỉnh/Thành Phố"
                    variant="outlined"
                    size="small"
                    name="state"
                    onChange={onChangeInput}
                    value={formFields.state}
                />
            </div>



            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Quốc gia"
                    variant="outlined"
                    size="small"
                    name="country"
                    onChange={onChangeInput}
                    value={formFields.country}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Số điện thoại"
                    variant="outlined"
                    size="small"
                    name="mobile"
                    onChange={onChangeInput}
                    value={formFields.mobile}
                    placeholder="VD: 0326851181"
                    inputProps={{ inputMode: "numeric", maxLength: 13 }}
                />
            </div>

            <div className="col w-[100%] mb-4">
                <TextField
                    className="w-full"
                    label="Ghi chú (Không bắt buộc)"
                    variant="outlined"
                    size="small"
                    name="landmark"
                    onChange={onChangeInput}
                    value={formFields.landmark}
                />
            </div>

            <div className="flex gap-5 pb-5 flex-col">
                <FormControl>
                    <FormLabel id="address-type-label">Loại địa chỉ</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="address-type-label"
                        name="addressType"
                        className="flex items-center gap-5"
                        value={addressType}
                        onChange={handleChangeAddressType}
                    >
                        <FormControlLabel value="Home" control={<Radio />} label="Nhà riêng" />
                        <FormControlLabel value="Office" control={<Radio />} label="Công ty" />
                    </RadioGroup>
                </FormControl>
            </div>

            <div className="flex items-center gap-5">
                <Button type="submit" className="btn-org btn-lg w-full flex gap-2 items-center">
                    {isLoading === true ? <CircularProgress color="inherit" /> : "Lưu địa chỉ"}
                </Button>
            </div>
        </form>
    );
};

export default AddAddress;
