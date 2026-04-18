import React, { useContext, useEffect, useState } from 'react';
import Button from "@mui/material/Button";
import { Link, useLocation } from "react-router-dom";
import { MyContext } from '../../App';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';

export const OrderSuccess = () => {
    const context = useContext(MyContext);
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const orderCode = queryParams.get('orderCode');
        const status = queryParams.get('status');

        if (orderCode && status === 'PAID') {
            setIsVerifying(true);
            // Gọi API verify để cập nhật trạng thái đơn hàng
            fetchDataFromApi(`/api/order/verify-payos/${orderCode}`).then((res) => {
                if (res?.success) {
                    context.alertBox("success", "Thanh toán đã được xác nhận!");
                    context.getCartItems();
                }
                setIsVerifying(false);
            }).catch(err => {
                console.error("Verify Error:", err);
                setIsVerifying(false);
            });
        }
    }, [location.search]);

    return (
        <section className='w-full p-10 py-8 lg:py-20 flex items-center justify-center flex-col gap-2 relative'>
            {isVerifying && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col items-center justify-center z-10">
                    <CircularProgress color="inherit" />
                    <p className="mt-2 text-sm font-medium">Đang xác thực thanh toán...</p>
                </div>
            )}
            <img src="/checked.png" className="w-[80px] sm:w-[120px]" />
            <h3 className='mb-0 text-[20px] sm:text-[25px]'>Your order is placed</h3>
            <p className='mt-0 mb-0'>Thank you for your payment.</p>
            <p className='mt-0 text-center'>Order Invoice send to your email <b>{context?.userData?.email}</b></p>
            <Link to="/">
                <Button className="btn-org btn-border">Back to home</Button>
            </Link>
        </section>
    )
}
