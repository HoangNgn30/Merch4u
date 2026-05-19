import React from 'react';
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";

export const OrderFailed = () => {
    return (
        <section className='w-full p-10 py-8 lg:py-20 flex items-center justify-center flex-col gap-2'>
            <img src="/delete.png"  className="w-[70px] sm:w-[120px]"  />
            <h3 className='mb-0 text-[20px] sm:text-[25px]'>Đơn hàng không thành công</h3>
            <p className='mt-0 text-center'>Đơn hàng của bạn chưa hoàn tất. Vui lòng thử lại hoặc chọn phương thức khác.</p>
            <Link to="/">
                <Button className="btn-org btn-border">Về trang chủ</Button>
            </Link>
        </section>
    )
}
