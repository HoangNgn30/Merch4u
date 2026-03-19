const OrderConfirmationEmail = (username, orders) => {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Xác nhận đơn hàng</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: #4CAF50;
            color: white;
            padding: 10px;
            text-align: center;
            font-size: 22px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
        }
        .order-details {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .order-details th, .order-details td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        .order-details th {
            background: #f8f8f8;
        }
        .footer {
            text-align: center;
            padding: 10px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">Xác nhận đơn hàng</div>
        <div class="content">
            <p>Gửi <strong>${username}</strong>,</p>
            <p>Cảm ơn bạn đã đặt hàng! Dưới đây là chi tiết đơn hàng của bạn:</p>

            
 
            <table class="order-details">
              <tr>
                        <th>Sản Phẩm</th>
                        <th>Số Lượng</th>
                        <th>Giá Tiền</th>
             </tr>
    
            
           ${orders?.products.map(
        (product) => `
             <tr>
        <td>${product?.productTitle}</td>
                <td>${product?.quantity}</td>
                        <td>${product?.subTotal?.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        })}</td>
        </tr>
                    `
    )}

    
                    <tr>
                     <td colspan={1}></td>
                        <td colspan={2}>Tổng</td>
                        <td colspan={1}>
                            ${(orders?.products?.length !== 0
            ? orders?.products
                ?.map(
                    (item) =>
                        parseInt(item.subTotal) * item.quantity
                )
                .reduce((total, value) => total + value, 0)
            : 0
        )?.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
        })}
                        </td>
                    </tr>    
          
          </table>
            <p><strong>Order ID:</strong> #${orders?._id}</p>
            <p><strong>Thời gian giao hàng dự kiến:</strong> 3-5 ngày làm việc</p>
            
            <p>Nếu có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi.</p>
        </div >
    <div class="footer">
        &copy; ${new Date().getFullYear()} Your Store. All rights reserved.
    </div>
    </div >
</body >
</html > `;
};

export default OrderConfirmationEmail;
