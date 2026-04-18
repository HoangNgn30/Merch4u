import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import paypal from "@paypal/checkout-server-sdk";
import { PayOS } from '@payos/node';
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import CartProductModel from "../models/cartProduct.modal.js";


const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

export const createOrderController = async (request, response) => {
    try {

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt,
            date: request.body.date
        });

        if (!order) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        order = await order.save();

        for (let i = 0; i < request.body.products.length; i++) {

            const product = await ProductModel.findOne({ _id: request.body.products[i].productId })
            console.log(product)

            await ProductModel.findByIdAndUpdate(
                request.body.products[i].productId,
                {
                    countInStock: parseInt(request.body.products[i].countInStock - request.body.products[i].quantity),
                    sale: parseInt(product?.sale + request.body.products[i].quantity)
                },
                { new: true }
            );
        }

        const user = await UserModel.findOne({ _id: request.body.userId })

        const recipients = [];
        recipients.push(user?.email);

        // Send verification email
        await sendEmailFun({
            sendTo: recipients,
            subject: "Order Confirmation",
            text: "",
            html: OrderConfirmationEmail(user?.name, order)
        })


        return response.status(200).json({
            error: false,
            success: true,
            message: "Đơn hàng đã được đặt",
            order: order
        });


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        const orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));

        const total = await OrderModel.countDocuments(orderlist);

        return response.json({
            message: "Danh sách đơn hàng",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        const orderlist = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));

        const orderTotal = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId');

        const total = await orderTotal?.length;

        return response.json({
            message: "Danh sách đơn hàng",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getTotalOrdersCountController(request, response) {
    try {
        const ordersCount = await OrderModel.countDocuments();
        return response.status(200).json({
            error: false,
            success: true,
            count: ordersCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



function getPayPalClient() {

    const environment =
        process.env.PAYPAL_MODE === "live"
            ? new paypal.core.LiveEnvironment(
                process.env.PAYPAL_CLIENT_ID_LIVE,
                process.env.PAYPAL_SECRET_LIVE
            )
            : new paypal.core.SandboxEnvironment(
                process.env.PAYPAL_CLIENT_ID_TEST,
                process.env.PAYPAL_SECRET_TEST
            );

    return new paypal.core.PayPalHttpClient(environment);


}


export const createOrderPaypalController = async (request, response) => {
    try {

        const req = new paypal.orders.OrdersCreateRequest();
        req.prefer("return=representation");

        req.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: request.query.totalAmount
                }
            }]
        });


        try {
            const client = getPayPalClient();
            const order = await client.execute(req);
            response.json({ id: order.result.id });
        } catch (error) {
            console.error(error);
            response.status(500).send("Lỗi khi tạo đơn hàng PayPal");
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export const captureOrderPaypalController = async (request, response) => {
    try {
        const { paymentId } = request.body;

        const req = new paypal.orders.OrdersCaptureRequest(paymentId);
        req.requestBody({});

        const client = getPayPalClient();
        const capture = await client.execute(req);

        if (capture.result.status === "COMPLETED") {
            const orderInfo = {
                userId: request.body.userId,
                products: request.body.products,
                paymentId: request.body.paymentId,
                payment_status: "Paid",
                order_status: "confirm",
                delivery_address: request.body.delivery_address,
                totalAmt: request.body.totalAmount,           
                date: request.body.date
            }

            const order = new OrderModel(orderInfo);
            await order.save();

            // Clear cart on backend after successful PayPal capture
            await CartProductModel.deleteMany({ userId: request.body.userId });

            const user = await UserModel.findOne({ _id: request.body.userId })

            const recipients = [];
            recipients.push(user?.email);

            // Send verification email
            await sendEmailFun({
                sendTo: recipients,
                subject: "Order Confirmation",
                text: "",
                html: OrderConfirmationEmail(user?.name, order)
            })


            for (let i = 0; i < request.body.products.length; i++) {

                const product = await ProductModel.findOne({ _id: request.body.products[i].productId })

                await ProductModel.findByIdAndUpdate(
                    request.body.products[i].productId,
                    {
                        countInStock: parseInt(request.body.products[i].countInStock - request.body.products[i].quantity),
                        sale: parseInt(product?.sale + request.body.products[i].quantity)
                    },
                    { new: true }
                );
            }


            return response.status(200).json(
                {
                    success: true,
                    error: false,
                    order: order,
                    message: "Order Placed"
                }
            );
        } else {
            return response.status(400).json({
                success: false,
                error: true,
                message: "Thanh toán PayPal không thành công hoặc chưa hoàn tất"
            });
        }

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const updateOrderStatusController = async (request, response) => {
    try {
        const { id, order_status } = request.body;

        const updateOrder = await OrderModel.updateOne(
            {
                _id: id,
            },
            {
                order_status: order_status,
            },
            { new: true }
        )

        return response.json({
            message: "Cập nhật trạng thái đơn hàng",
            success: true,
            error: false,
            data: updateOrder
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}






export const totalSalesController = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();

        const ordersList = await OrderModel.find();

        let totalSales = 0;
        let monthlySales = [
            {
                name: 'JAN',
                TotalSales: 0
            },
            {
                name: 'FEB',
                TotalSales: 0
            },
            {
                name: 'MAR',
                TotalSales: 0
            },
            {
                name: 'APRIL',
                TotalSales: 0
            },
            {
                name: 'MAY',
                TotalSales: 0
            },
            {
                name: 'JUNE',
                TotalSales: 0
            },
            {
                name: 'JULY',
                TotalSales: 0
            },
            {
                name: 'AUG',
                TotalSales: 0
            },
            {
                name: 'SEP',
                TotalSales: 0
            },
            {
                name: 'OCT',
                TotalSales: 0
            },
            {
                name: 'NOV',
                TotalSales: 0
            },
            {
                name: 'DEC',
                TotalSales: 0
            },
        ]


        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].totalAmt);
            const str = JSON.stringify(ordersList[i]?.createdAt);
            const year = str.substr(1, 4);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            if (currentYear == year) {

                if (month === 1) {
                    monthlySales[0] = {
                        name: 'JAN',
                        TotalSales: monthlySales[0].TotalSales = parseInt(monthlySales[0].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 2) {

                    monthlySales[1] = {
                        name: 'FEB',
                        TotalSales: monthlySales[1].TotalSales = parseInt(monthlySales[1].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 3) {
                    monthlySales[2] = {
                        name: 'MAR',
                        TotalSales: monthlySales[2].TotalSales = parseInt(monthlySales[2].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 4) {
                    monthlySales[3] = {
                        name: 'APRIL',
                        TotalSales: monthlySales[3].TotalSales = parseInt(monthlySales[3].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 5) {
                    monthlySales[4] = {
                        name: 'MAY',
                        TotalSales: monthlySales[4].TotalSales = parseInt(monthlySales[4].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 6) {
                    monthlySales[5] = {
                        name: 'JUNE',
                        TotalSales: monthlySales[5].TotalSales = parseInt(monthlySales[5].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 7) {
                    monthlySales[6] = {
                        name: 'JULY',
                        TotalSales: monthlySales[6].TotalSales = parseInt(monthlySales[6].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 8) {
                    monthlySales[7] = {
                        name: 'AUG',
                        TotalSales: monthlySales[7].TotalSales = parseInt(monthlySales[7].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 9) {
                    monthlySales[8] = {
                        name: 'SEP',
                        TotalSales: monthlySales[8].TotalSales = parseInt(monthlySales[8].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 10) {
                    monthlySales[9] = {
                        name: 'OCT',
                        TotalSales: monthlySales[9].TotalSales = parseInt(monthlySales[9].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 11) {
                    monthlySales[10] = {
                        name: 'NOV',
                        TotalSales: monthlySales[10].TotalSales = parseInt(monthlySales[10].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 12) {
                    monthlySales[11] = {
                        name: 'DEC',
                        TotalSales: monthlySales[11].TotalSales = parseInt(monthlySales[11].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

            }


        }


        return response.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);



        let monthlyUsers = [
            {
                name: 'JAN',
                TotalUsers: 0
            },
            {
                name: 'FEB',
                TotalUsers: 0
            },
            {
                name: 'MAR',
                TotalUsers: 0
            },
            {
                name: 'APRIL',
                TotalUsers: 0
            },
            {
                name: 'MAY',
                TotalUsers: 0
            },
            {
                name: 'JUNE',
                TotalUsers: 0
            },
            {
                name: 'JULY',
                TotalUsers: 0
            },
            {
                name: 'AUG',
                TotalUsers: 0
            },
            {
                name: 'SEP',
                TotalUsers: 0
            },
            {
                name: 'OCT',
                TotalUsers: 0
            },
            {
                name: 'NOV',
                TotalUsers: 0
            },
            {
                name: 'DEC',
                TotalUsers: 0
            },
        ]




        for (let i = 0; i < users.length; i++) {

            if (users[i]?._id?.month === 1) {
                monthlyUsers[0] = {
                    name: 'JAN',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 2) {
                monthlyUsers[1] = {
                    name: 'FEB',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 3) {
                monthlyUsers[2] = {
                    name: 'MAR',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 4) {
                monthlyUsers[3] = {
                    name: 'APRIL',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 5) {
                monthlyUsers[4] = {
                    name: 'MAY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 6) {
                monthlyUsers[5] = {
                    name: 'JUNE',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 7) {
                monthlyUsers[6] = {
                    name: 'JULY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 8) {
                monthlyUsers[7] = {
                    name: 'AUG',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 9) {
                monthlyUsers[8] = {
                    name: 'SEP',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 10) {
                monthlyUsers[9] = {
                    name: 'OCT',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 11) {
                monthlyUsers[10] = {
                    name: 'NOV',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 12) {
                monthlyUsers[11] = {
                    name: 'DEC',
                    TotalUsers: users[i].count
                }
            }

        }



        return response.status(200).json({
            TotalUsers: monthlyUsers,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteOrder(request, response) {
    const order = await OrderModel.findById(request.params.id);

    console.log(request.params.id)

    if (!order) {
        return response.status(404).json({
            message: "Không tìm thấy đơn hàng",
            error: true,
            success: false
        })
    }


    const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

    if (!deletedOrder) {
        response.status(404).json({
            message: "Không thể xóa đơn hàng!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Xóa đơn hàng!",
    });
}




export const createOrderPayosController = async (request, response) => {
    try {
        // Sử dụng 10 chữ số cuối của timestamp để đảm bảo độ dài an toàn cho PayOS (thường < 15 chữ số)
        const orderCode = Number(String(Date.now()).slice(-10)); 
        console.log("Creating PayOS order with code:", orderCode);

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            paymentId: String(orderCode), 
            payment_status: "Pending",   
            order_status: "pending",   
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt || request.body.totalAmount,
            date: request.body.date
        });

        order = await order.save();

        const orderBody = {
            orderCode: orderCode,
            amount: request.body.totalAmt || request.body.totalAmount, 
            description: 'Thanh toan don hang',
            returnUrl: `${process.env.CLIENT_URL}/order/success`, 
            cancelUrl: `${process.env.CLIENT_URL}/checkout`
        };

        const paymentLink = await payos.paymentRequests.create(orderBody);

        return response.status(200).json({
            error: false,
            success: true,
            message: "Created PayOS Link",
            checkoutUrl: paymentLink.checkoutUrl, 
            order: order
        });

    } catch (error) {
        console.error("Lỗi tạo đơn PayOS:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const receivePayosWebhookController = async (request, response) => {
    try {
        const webhookData = request.body;
        console.log("Received PayOS Webhook:", JSON.stringify(webhookData));
        
        const data = await payos.webhooks.verify(webhookData);
        console.log("Verified Webhook Data:", JSON.stringify(data));

        if (data.code === '00' || webhookData.code === '00') {
            const orderCode = data.orderCode || webhookData.data?.orderCode;
            console.log("Searching for order with paymentId:", String(orderCode));
            
            const order = await OrderModel.findOne({ paymentId: String(orderCode) });

            if (order) {
                console.log("Found order:", order._id, "Current status:", order.payment_status);
                if (order.payment_status !== "Paid") {
                    order.payment_status = "Paid";
                    order.order_status = "confirm";
                    await order.save();
                    console.log("Order updated to Paid/confirm");

                    // Clear cart on backend after successful PayOS Webhook confirmation
                    await CartProductModel.deleteMany({ userId: order.userId });
                    console.log("Cart cleared for user:", order.userId);

                    for (let i = 0; i < order.products.length; i++) {
                        const product = await ProductModel.findOne({ _id: order.products[i].productId });
                        await ProductModel.findByIdAndUpdate(
                            order.products[i].productId,
                            {
                                countInStock: parseInt(product?.countInStock - order.products[i].quantity),
                                sale: parseInt(product?.sale + order.products[i].quantity)
                            },
                            { new: true }
                        );
                    }

                    const user = await UserModel.findOne({ _id: order.userId });
                    if(user) {
                        await sendEmailFun({
                            sendTo: [user.email],
                            subject: "Order Confirmation",
                            text: "",
                            html: OrderConfirmationEmail(user.name, order)
                        });
                    }
                }
            } else {
                console.warn("Order not found with paymentId:", orderCode);
            }
            return response.json({ success: true });
        } else {
            console.log("Webhook code not success:", data.code);
            return response.json({ success: false });
        }
    } catch (error) {
        console.error("Lỗi Webhook PayOS:", error);
        return response.status(400).json({ success: false });
    }
}


export const verifyPayosPaymentController = async (request, response) => {
    try {
        const { orderCode } = request.params;
        console.log("Verifying PayOS payment for code:", orderCode);
        
        // Chuyển đổi sang Number trước khi gọi SDK - Dùng đúng method của version 2.0.5
        const paymentInfo = await payos.paymentRequests.get(Number(orderCode));
        console.log("PayOS Payment Info status:", paymentInfo.status);

        if (paymentInfo.status === 'PAID') {
            const order = await OrderModel.findOne({ paymentId: String(orderCode) });

            if (order) {
                console.log("Found order for verification:", order._id, "Current status:", order.payment_status);
                if (order.payment_status !== "Paid") {
                    order.payment_status = "Paid";
                    order.order_status = "confirm";
                    await order.save();
                    console.log("Order updated to Paid via verification");

                    // Clear cart on backend after successful PayOS active verification
                    await CartProductModel.deleteMany({ userId: order.userId });
                    console.log("Cart cleared for user:", order.userId);

                    for (let i = 0; i < order.products.length; i++) {
                        const product = await ProductModel.findOne({ _id: order.products[i].productId });
                        await ProductModel.findByIdAndUpdate(
                            order.products[i].productId,
                            {
                                countInStock: parseInt(product?.countInStock - order.products[i].quantity),
                                sale: parseInt(product?.sale + order.products[i].quantity)
                            },
                            { new: true }
                        );
                    }

                    const user = await UserModel.findOne({ _id: order.userId });
                    if(user) {
                        await sendEmailFun({
                            sendTo: [user.email],
                            subject: "Order Confirmation",
                            text: "",
                            html: OrderConfirmationEmail(user.name, order)
                        });
                    }

                    return response.status(200).json({
                        success: true,
                        message: "Thanh toán thành công và đã được xác thực",
                        order: order
                    });
                } else {
                    return response.status(200).json({
                        success: true,
                        message: "Đơn hàng đã được xử lý trước đó",
                        order: order
                    });
                }
            } else {
                console.warn("Order not found during verification for code:", orderCode);
                return response.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            }
        } else {
            return response.status(200).json({
                success: false,
                message: "Thanh toán chưa hoàn tất hoặc thất bại",
                status: paymentInfo.status
            });
        }
    } catch (error) {
        console.error("Lỗi Verify PayOS:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}