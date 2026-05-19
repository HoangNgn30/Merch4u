import React, { useContext, useEffect, useState } from 'react'
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { fetchDataFromApi, postData } from '../../utils/api';
import { MyContext } from '../../App';


const AddAddress = () => {
    const [isLoading, setIsLoading] = useState(false);

    const [status, setStatus] = React.useState(false);

    const context = useContext(MyContext);

    const [formFields, setFormsFields] = useState({
        address_line1: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        mobile: '',
        status: '',
        userId: '',
        selected: false
    });

    useEffect(() => {
        setFormsFields((prevState) => ({
            ...prevState,
            userId: context?.userData?._id
        }))

    }, [context?.userData]);

    const handleChangeStatus = (event) => {
        setStatus(event.target.value);
        setFormsFields((prevState) => ({
            ...prevState,
            status: event.target.value
        }))
    };


    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormsFields(() => {
            return {
                ...formFields,
                [name]: value
            }
        })

    }


    const handleSubmit = (e) => {
        e.preventDefault();

        setIsLoading(true);

        if (formFields.address_line1 === "") {
            context.alertBox("error", "Vui lòng nhập địa chỉ");
            setIsLoading(false);
            return false
        }


        if (formFields.city === "") {
            context.alertBox("error", "Vui lòng nhập thành phố/quận huyện");
            setIsLoading(false);
            return false
        }


        if (formFields.state === "") {
            context.alertBox("error", "Vui lòng nhập tỉnh/thành");
            setIsLoading(false);
            return false
        }


        if (formFields.pincode === "") {
            context.alertBox("error", "Vui lòng nhập mã bưu chính");
            setIsLoading(false);
            return false
        }


        if (formFields.country === "") {
            context.alertBox("error", "Vui lòng nhập quốc gia");
            setIsLoading(false);
            return false
        }


        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formFields.mobile)) {
            context.alertBox("error", "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0. Ví dụ: 0326851181");
            setIsLoading(false);
            return false
        }


        console.log(formFields)

        postData(`/api/address/add`, formFields, { withCredentials: true }).then((res) => {
            console.log(res)
            if (res?.error !== true) {
                setIsLoading(false);
                context.alertBox("success", res?.data?.message);

                context?.setIsOpenFullScreenPanel({
                    open: false
                })

                fetchDataFromApi(`/api/address/get?userId=${context?.userData?._id}`).then((res) => {
                    context?.setAddress(res.data);
                })



            } else {
                context.alertBox("error", res?.data?.message);
                setIsLoading(false);
            }

        })


    }


    return (
        <section className='p-5 bg-gray-50'>
            <form className='form py-3 p-8' onSubmit={handleSubmit}>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4 pt-4'>
                    <div className='grid grid-cols-2 mb-3 gap-4'>
                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Địa chỉ</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="address_line1" onChange={onChangeInput} value={formFields.address_line1} />
                        </div>

                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Thành phố/Quận huyện</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="city" onChange={onChangeInput} value={formFields.city} />
                        </div>


                    </div>

                    <div className='grid grid-cols-3 mb-3 gap-4'>
                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Tỉnh/Thành</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="state" onChange={onChangeInput} value={formFields.state} />
                        </div>

                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Mã bưu chính</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="pincode" onChange={onChangeInput} value={formFields.pincode} />
                        </div>

                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Quốc gia</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="country" onChange={onChangeInput} value={formFields.country} />
                        </div>


                        <div className='col w-[100%]'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Số điện thoại</h3>
                            <input
                                type="text"
                                className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm'
                                name="mobile"
                                placeholder="VD: 0326851181"
                                maxLength={10}
                                value={formFields.mobile}
                                disabled={isLoading === true ? true : false}
                                onChange={(e) => {
                                    const mobile = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setFormsFields((prevState) => ({
                                        ...prevState,
                                        mobile
                                    }))
                                }}
                            />
                        </div>


                        <div className="col w-[100%]">
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Trạng thái</h3>
                            <Select
                                value={status}
                                onChange={handleChangeStatus}
                                displayEmpty
                                inputProps={{ 'aria-label': 'Without label' }}
                                size="small"
                                className="w-full"
                            >
                                <MenuItem value={true}>Hiển thị</MenuItem>
                                <MenuItem value={false}>Ẩn</MenuItem>

                            </Select>
                        </div>


                    </div>

                    <br />



                </div>

                <br />

                <br />
                <div className='w-[250px]'>
                    <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                        <FaCloudUploadAlt className='text-[25px] text-white' />
                        Lưu địa chỉ</Button>
                </div>


            </form>
        </section>
    )
}

export default AddAddress;
