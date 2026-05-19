import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import paypal from "@paypal/checkout-server-sdk";
import { PayOS } from '@payos/node';
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import CartProductModel from "../models/cartProduct.modal.js";
import CouponModel from "../models/coupon.model.js";
import { calculateCouponDiscount } from "./coupon.controller.js";

const updateMinigameMissionsOnOrder = async (userId, orderTotal) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) return;

        const today = new Date().toLocaleDateString("en-CA");
        let gameData = user.gameData || {};
        
        if (!gameData.missions || gameData.missions.date !== today) {
            gameData.missions = {
                date: today,
                ordersCount: 0,
                maxOrderValue: 0,
                claimedMissions: []
            };
        }

        const m = gameData.missions;
        m.ordersCount += 1;
        if (orderTotal > m.maxOrderValue) {
            m.maxOrderValue = orderTotal;
        }

        let addedSpins = 0;
        
        // Mission 1: 1 order
        if (m.ordersCount >= 1 && !m.claimedMissions.includes('M1')) {
            m.claimedMissions.push('M1');
            addedSpins += 1;
        }
        // Mission 2: 2 orders
        if (m.ordersCount >= 2 && !m.claimedMissions.includes('M2')) {
            m.claimedMissions.push('M2');
            addedSpins += 1;
        }
        // Mission 3: 3 orders
        if (m.ordersCount >= 3 && !m.claimedMissions.includes('M3')) {
            m.claimedMissions.push('M3');
            addedSpins += 1;
        }
        // Mission 4: > 500k
        if (m.maxOrderValue >= 500000 && !m.claimedMissions.includes('M4')) {
            m.claimedMissions.push('M4');
            addedSpins += 1;
        }
        // Mission 5: > 1M
        if (m.maxOrderValue >= 1000000 && !m.claimedMissions.includes('M5')) {
            m.claimedMissions.push('M5');
            addedSpins += 1;
        }

        if (addedSpins > 0) {
            gameData.spins = (gameData.spins || 0) + addedSpins;
        }

        user.gameData = gameData;
        await user.save();
    } catch (error) {
        console.error("Error updating minigame missions:", error);
    }
}



const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

const CANCEL_ALLOWED_STATUSES = ["pending", "confirm"];
const CANCEL_BLOCKED_STATUSES = ["shipped", "delivered", "cancelled"];
const FIXED_SHIPPING_FEE = 50000;
const FREE_SHIPPING_MIN_ORDER = 1000000;

const isInventoryDeductedForOrder = (order) => {
    return order?.payment_status !== "Pending";
}

const restoreInventoryForOrder = async (order) => {
    if (order?.stockRestoredOnCancel === true || !isInventoryDeductedForOrder(order)) {
        return;
    }

    for (const item of order.products || []) {
        const quantity = Number(item?.quantity || 0);

        if (!item?.productId || quantity <= 0) {
            continue;
        }

        const product = await ProductModel.findById(item.productId);

        if (!product) {
            continue;
        }

        product.countInStock = Number(product.countInStock || 0) + quantity;
        product.sale = Math.max(0, Number(product.sale || 0) - quantity);
        await product.save();
    }

    order.stockRestoredOnCancel = true;
}

/**
 * Kiểm tra tồn kho trước khi tạo đơn hàng.
 * Throw Error nếu có sản phẩm không đủ hàng.
 */
const validateInventory = async (products = []) => {
    for (const item of products) {
        const quantity = Number(item?.quantity || 0);
        if (!item?.productId || quantity <= 0) continue;

        const product = await ProductModel.findById(item.productId).select('name countInStock');
        if (!product) {
            throw new Error(`Sản phẩm ${item.productTitle || item.productId} không tồn tại`);
        }
        if (Number(product.countInStock || 0) < quantity) {
            throw new Error(`Sản phẩm "${product.name}" chỉ còn ${product.countInStock} trong kho`);
        }
    }
}

/**
 * Trừ kho từ database (KHÔNG dùng dữ liệu client).
 * Dùng chung cho COD, PayPal, PayOS.
 */
const deductInventoryForOrder = async (products = []) => {
    for (const item of products) {
        const quantity = Number(item?.quantity || 0);
        if (!item?.productId || quantity <= 0) continue;

        const product = await ProductModel.findById(item.productId);
        if (!product) continue;

        product.countInStock = Math.max(0, Number(product.countInStock || 0) - quantity);
        product.sale = Number(product.sale || 0) + quantity;
        await product.save();
    }
}

const calculateOrderSubTotal = (products = []) => {
    return products.reduce((total, item) => {
        const price = Number(item?.price || 0);
        const quantity = Number(item?.quantity || 0);
        return total + (price * quantity);
    }, 0);
}

const calculateShippingFee = (subTotal) => {
    return Number(subTotal || 0) >= FREE_SHIPPING_MIN_ORDER ? 0 : FIXED_SHIPPING_FEE;
}

const isCouponUsableForOrder = (coupon) => {
    if (!coupon || coupon.isActive === false) return false;
    if (new Date(coupon.expiryDate).getTime() < Date.now()) return false;
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
    return true;
}

const resolveOrderPricing = async (body) => {
    const subTotal = calculateOrderSubTotal(body.products);
    const shippingFee = calculateShippingFee(subTotal);
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : "";
    let couponDiscount = 0;

    if (couponCode) {
        const coupon = await CouponModel.findOne({ code: couponCode });

        if (!isCouponUsableForOrder(coupon)) {
            throw new Error("Mã giảm giá không hợp lệ hoặc đã hết hạn");
        }

        if (subTotal < Number(coupon.minOrder || 0)) {
            throw new Error(`Đơn hàng cần tối thiểu ${Number(coupon.minOrder).toLocaleString("vi-VN")}đ để dùng mã này`);
        }

        couponDiscount = calculateCouponDiscount(coupon, subTotal);
    }

    return {
        subTotal,
        shippingFee,
        couponCode,
        couponDiscount,
        totalAmt: Math.max(0, subTotal - couponDiscount) + shippingFee
    };
}

const markCouponUsed = async (couponCode, userId) => {
    if (!couponCode) return;

    const coupon = await CouponModel.findOneAndUpdate(
        { code: couponCode },
        { $inc: { usedCount: 1 } }
    );

    if (userId && coupon) {
        const user = await UserModel.findById(userId);
        if (user && user.gameData && user.gameData.wonCoupons) {
            const entry = user.gameData.wonCoupons.find(wc => wc.couponId?.toString() === coupon._id.toString());
            if (entry) {
                if ((entry.quantity || 1) > 1) {
                    entry.quantity -= 1;
                } else {
                    user.gameData.wonCoupons = user.gameData.wonCoupons.filter(
                        wc => wc.couponId?.toString() !== coupon._id.toString()
                    );
                }
                await user.save();
            }
        }
    }
}

export const createOrderController = async (request, response) => {
    try {
        // Kiểm tra tồn kho trước khi tạo đơn
        await validateInventory(request.body.products);

        const pricing = await resolveOrderPricing(request.body);

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            subTotal: pricing.subTotal,
            shippingFee: pricing.shippingFee,
            couponCode: pricing.couponCode,
            couponDiscount: pricing.couponDiscount,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: pricing.totalAmt,
            date: request.body.date
        });

        order = await order.save();
        await markCouponUsed(order.couponCode, request.body.userId);

        // Trừ kho 1 lần duy nhất — dùng dữ liệu từ DB
        await deductInventoryForOrder(request.body.products);

        const user = await UserModel.findOne({ _id: request.body.userId });

        if (user?.email) {
            await sendEmailFun({
                sendTo: [user.email],
                subject: "Xác nhận đơn hàng - Merch4u",
                text: "",
                html: OrderConfirmationEmail(user.name, order)
            });
        }

        // Update minigame missions
        await updateMinigameMissionsOnOrder(request.body.userId, pricing.totalAmt);

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

        const total = await OrderModel.countDocuments();

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

        const total = await OrderModel.countDocuments({ userId: userId });

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
                date: request.body.date
            }
            const pricing = await resolveOrderPricing(request.body);

            Object.assign(orderInfo, {
                subTotal: pricing.subTotal,
                shippingFee: pricing.shippingFee,
                couponCode: pricing.couponCode,
                couponDiscount: pricing.couponDiscount,
                totalAmt: pricing.totalAmt,
                date: request.body.date
            });

            const order = new OrderModel(orderInfo);
            await order.save();
            await markCouponUsed(order.couponCode, request.body.userId);

            // Clear cart on backend after successful PayPal capture
            await CartProductModel.deleteMany({ userId: request.body.userId });

            const user = await UserModel.findOne({ _id: request.body.userId })

            const recipients = [];
            recipients.push(user?.email);

            // Send verification email
            await sendEmailFun({
                sendTo: recipients,
                subject: "Xác nhận đơn hàng - Merch4u",
                text: "",
                html: OrderConfirmationEmail(user?.name, order)
            })

            // Update minigame missions
            await updateMinigameMissionsOnOrder(request.body.userId, pricing.totalAmt);

            // Trừ kho — dùng dữ liệu từ DB
            await deductInventoryForOrder(request.body.products);


            return response.status(200).json(
                {
                    success: true,
                    error: false,
                    order: order,
                    message: "Đã đặt hàng"
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
        const { order_status } = request.body;
        const orderId = request.params.id;
        const allowedStatuses = ["pending", "confirm", "shipped", "delivered"];
        const requester = await UserModel.findById(request.userId).select("role");

        if (!["ADMIN", "SUPERBOSS"].includes(requester?.role)) {
            return response.status(403).json({
                message: "Chỉ admin mới có quyền cập nhật trạng thái đơn hàng",
                success: false,
                error: true
            })
        }

        if (!allowedStatuses.includes(order_status)) {
            return response.status(400).json({
                message: "Trạng thái đơn hàng không hợp lệ",
                success: false,
                error: true
            })
        }

        const updateOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            { order_status: order_status },
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

export const cancelOrderController = async (request, response) => {
    try {
        const order = await OrderModel.findById(request.params.id);

        if (!order) {
            return response.status(404).json({
                message: "Không tìm thấy đơn hàng",
                error: true,
                success: false
            })
        }

        const requester = await UserModel.findById(request.userId).select("role");
        const isOwner = String(order.userId) === String(request.userId);
        const isAdmin = ["ADMIN", "SUPERBOSS"].includes(requester?.role);

        if (!isOwner && !isAdmin) {
            return response.status(403).json({
                message: "Bạn không có quyền hủy đơn hàng này",
                error: true,
                success: false
            })
        }

        if (CANCEL_BLOCKED_STATUSES.includes(order.order_status)) {
            const message = order.order_status === "cancelled"
                ? "Đơn hàng đã được hủy trước đó"
                : "Không thể hủy đơn hàng đã giao hoặc đang vận chuyển";

            return response.status(400).json({
                message,
                error: true,
                success: false
            })
        }

        if (!CANCEL_ALLOWED_STATUSES.includes(order.order_status)) {
            return response.status(400).json({
                message: "Chỉ có thể hủy đơn hàng đang chờ xử lý hoặc đã xác nhận",
                error: true,
                success: false
            })
        }

        await restoreInventoryForOrder(order);

        order.order_status = "cancelled";
        order.cancelledAt = new Date();
        await order.save();

        return response.status(200).json({
            message: "Đơn hàng đã được hủy",
            success: true,
            error: false,
            order
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
        const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        const ordersList = await OrderModel.find({ order_status: { $ne: "cancelled" } });

        let totalSales = 0;
        const monthlySales = MONTH_NAMES.map(name => ({ name, TotalSales: 0 }));

        for (const order of ordersList) {
            const amt = Number(order.totalAmt || 0);
            totalSales += amt;

            const date = new Date(order.createdAt);
            if (date.getFullYear() === currentYear) {
                monthlySales[date.getMonth()].TotalSales += amt;
            }
        }

        return response.status(200).json({
            totalSales,
            monthlySales,
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
        const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

        const monthlyUsers = MONTH_NAMES.map(name => ({ name, TotalUsers: 0 }));

        for (const entry of users) {
            const monthIndex = (entry._id?.month || 0) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyUsers[monthIndex].TotalUsers = entry.count;
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
    try {
        const order = await OrderModel.findById(request.params.id);

        if (!order) {
            return response.status(404).json({
                message: "Không tìm thấy đơn hàng",
                error: true,
                success: false
            })
        }

        const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

        if (!deletedOrder) {
            return response.status(404).json({
                message: "Không thể xóa đơn hàng!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Đã xóa đơn hàng!",
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export const createOrderPayosController = async (request, response) => {
    try {
        // Sử dụng 10 chữ số cuối của timestamp để đảm bảo độ dài an toàn cho PayOS (thường < 15 chữ số)
        const orderCode = Number(String(Date.now()).slice(-10)); 
        console.log("Creating PayOS order with code:", orderCode);

        const pricing = await resolveOrderPricing(request.body);

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            paymentId: String(orderCode), 
            payment_status: "Pending",   
            order_status: "pending",   
            delivery_address: request.body.delivery_address,
            subTotal: pricing.subTotal,
            shippingFee: pricing.shippingFee,
            couponCode: pricing.couponCode,
            couponDiscount: pricing.couponDiscount,
            totalAmt: pricing.totalAmt,
            date: request.body.date
        });

        order = await order.save();

        const orderBody = {
            orderCode: orderCode,
            amount: pricing.totalAmt, 
            description: 'Thanh toán đơn hàng',
            returnUrl: `${process.env.CLIENT_URL}/order/success`, 
            cancelUrl: `${process.env.CLIENT_URL}/checkout`
        };

        const paymentLink = await payos.paymentRequests.create(orderBody);

        return response.status(200).json({
            error: false,
            success: true,
            message: "Đã tạo liên kết thanh toán PayOS",
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
        
        const data = await payos.webhooks.verify(webhookData);

        if (data.code === '00' || webhookData.code === '00') {
            const orderCode = data.orderCode || webhookData.data?.orderCode;
            
            const order = await OrderModel.findOne({ paymentId: String(orderCode) });

            if (order) {
                if (order.order_status === "cancelled") {
                    return response.json({ success: true, message: "Đơn hàng đã bị hủy trước đó" });
                }

                if (order.payment_status !== "Paid") {
                    order.payment_status = "Paid";
                    order.order_status = "confirm";
                    await order.save();
                    await markCouponUsed(order.couponCode, order.userId);

                    await CartProductModel.deleteMany({ userId: order.userId });
                    await deductInventoryForOrder(order.products);

                    const user = await UserModel.findOne({ _id: order.userId });
                    if (user?.email) {
                        await sendEmailFun({
                            sendTo: [user.email],
                            subject: "Xác nhận đơn hàng - Merch4u",
                            text: "",
                            html: OrderConfirmationEmail(user.name, order)
                        });
                    }
                }
            }
            return response.json({ success: true });
        } else {
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
        
        const paymentInfo = await payos.paymentRequests.getPaymentLinkById(Number(orderCode));

        if (paymentInfo.status === 'PAID') {
            const order = await OrderModel.findOne({ paymentId: String(orderCode) });

            if (order) {
                if (order.order_status === "cancelled") {
                    return response.status(200).json({
                        success: false,
                        message: "Đơn hàng đã bị hủy trước đó",
                        order: order
                    });
                }

                if (order.payment_status !== "Paid") {
                    order.payment_status = "Paid";
                    order.order_status = "confirm";
                    await order.save();
                    await markCouponUsed(order.couponCode, order.userId);

                    await CartProductModel.deleteMany({ userId: order.userId });
                    await deductInventoryForOrder(order.products);

                    const user = await UserModel.findOne({ _id: order.userId });
                    if (user?.email) {
                        await sendEmailFun({
                            sendTo: [user.email],
                            subject: "Xác nhận đơn hàng - Merch4u",
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
