import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import paypal from "@paypal/checkout-server-sdk";
import { PayOS } from '@payos/node';
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import CartProductModel from "../models/cartProduct.model.js";
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

const getClientBaseUrl = (request) => {
    if (request.body?.clientUrl) {
        return request.body.clientUrl;
    }
    const origin = request.get("Origin");
    if (origin) return origin;

    const referer = request.get("Referer");
    if (referer) {
        try {
            const parsed = new URL(referer);
            return parsed.origin;
        } catch (e) {
            // ignore
        }
    }
    return process.env.CLIENT_URL || "http://localhost:5174";
}

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

        const newStock = Number(product.countInStock || 0) + quantity;
        const newSale = Math.max(0, Number(product.sale || 0) - quantity);

        await ProductModel.findByIdAndUpdate(
            item.productId,
            { countInStock: newStock, sale: newSale },
            { runValidators: false }
        );
    }

    order.stockRestoredOnCancel = true;
}

const restoreCouponForOrder = async (order) => {
    if (!order || !order.couponCode || order.couponRestoredOnCancel === true) {
        return;
    }

    try {
        const coupon = await CouponModel.findOne({ code: order.couponCode });
        if (coupon) {
            const user = await UserModel.findById(order.userId);
            if (user) {
                if (!user.gameData) {
                    user.gameData = {};
                }
                if (!user.gameData.wonCoupons) {
                    user.gameData.wonCoupons = [];
                }

                const entry = user.gameData.wonCoupons.find(
                    wc => wc.couponId?.toString() === coupon._id.toString()
                );

                if (entry) {
                    entry.quantity = (entry.quantity || 1) + 1;
                } else {
                    user.gameData.wonCoupons.push({
                        couponId: coupon._id,
                        quantity: 1,
                        wonAt: new Date()
                    });
                }
                await user.save();
            }
        }
        order.couponRestoredOnCancel = true;
    } catch (err) {
        console.error("Error restoring coupon on cancel:", err);
    }
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

        const newStock = Math.max(0, Number(product.countInStock || 0) - quantity);
        const newSale = Number(product.sale || 0) + quantity;

        await ProductModel.findByIdAndUpdate(
            item.productId,
            { countInStock: newStock, sale: newSale },
            { runValidators: false }
        );
    }
}

const calculateOrderSubTotal = async (products = []) => {
    let total = 0;
    for (const item of products) {
        const product = await ProductModel.findById(item.productId);
        if (!product) {
            throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
        }
        const price = Number(product.price || 0);
        const quantity = Number(item?.quantity || 0);
        total += price * quantity;
    }
    return total;
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
    const subTotal = await calculateOrderSubTotal(body.products);
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
        const userId = request.userId;

        // Kiểm tra tồn kho trước khi tạo đơn
        await validateInventory(request.body.products);

        const pricing = await resolveOrderPricing(request.body);

        let order = new OrderModel({
            userId: userId,
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
        await markCouponUsed(order.couponCode, userId);

        // Xóa các sản phẩm đã thanh toán khỏi giỏ hàng
        try {
            const cartItemIds = order.products.map(p => p.cartItemId).filter(Boolean);
            if (cartItemIds.length > 0) {
                await CartProductModel.deleteMany({ _id: { $in: cartItemIds } });
            } else {
                // Fallback: Xóa theo productId, size, weight, ram để tránh xóa toàn bộ giỏ hàng
                for (const item of order.products) {
                    await CartProductModel.deleteMany({
                        userId: userId,
                        productId: item.productId,
                        size: item.size || "",
                        weight: item.weight || "",
                        ram: item.ram || ""
                    });
                }
            }
        } catch (err) {
            console.error("Lỗi khi xóa giỏ hàng cho đơn hàng COD:", err);
        }

        // Trừ kho 1 lần duy nhất — dùng dữ liệu từ DB
        await deductInventoryForOrder(request.body.products);

        const user = await UserModel.findOne({ _id: userId });

        if (user?.email) {
            await sendEmailFun({
                sendTo: [user.email],
                subject: "Xác nhận đơn hàng - Merch4u",
                text: "",
                html: OrderConfirmationEmail(user.name, order)
            });
        }

        // Update minigame missions
        await updateMinigameMissionsOnOrder(userId, pricing.totalAmt);

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

        const page = Math.max(parseInt(request.query.page) || 1, 1);
        const limit = Math.max(parseInt(request.query.limit) || 10, 1);

        const orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(limit);

        const total = await OrderModel.countDocuments();

        return response.json({
            message: "Danh sách đơn hàng",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: page,
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

        const page = Math.max(parseInt(request.query.page) || 1, 1);
        const limit = Math.max(parseInt(request.query.limit) || 10, 1);

        const orderlist = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(limit);

        const total = await OrderModel.countDocuments({ userId: userId });

        return response.json({
            message: "Danh sách đơn hàng",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: page,
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
        const { products, couponCode } = request.body;

        // Kiểm tra tồn kho
        await validateInventory(products);

        // Tính giá trị đơn hàng từ database (VND)
        const pricing = await resolveOrderPricing({ products, couponCode });

        // Quy đổi VND -> USD trên server
        const FALLBACK_RATE = 1 / 25000;
        let usdRate = FALLBACK_RATE;
        try {
            const rateResp = await fetch("https://v6.exchangerate-api.com/v6/" + process.env.EXCHANGE_RATE_API_KEY + "/latest/VND");
            const rateData = await rateResp.json();
            if (rateData.result === "success" && rateData.conversion_rates?.USD) {
                usdRate = rateData.conversion_rates.USD;
            }
        } catch (err) {
            console.error("Lỗi lấy tỷ giá USD/VND, sử dụng fallback:", err.message);
        }

        const usdAmount = (pricing.totalAmt * usdRate).toFixed(2);

        const req = new paypal.orders.OrdersCreateRequest();
        req.prefer("return=representation");
        req.requestBody({
            intent: "CAPTURE",
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: usdAmount
                }
            }]
        });

        const client = getPayPalClient();
        const order = await client.execute(req);
        response.json({ id: order.result.id });

    } catch (error) {
        console.error("Lỗi tạo đơn PayPal:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export const captureOrderPaypalController = async (request, response) => {
    try {
        const userId = request.userId;
        const { paymentId, products } = request.body;


        // 1. Kiểm tra tồn kho trước khi thực hiện capture thanh toán
        try {
            await validateInventory(products);
        } catch (err) {
            return response.status(400).json({
                success: false,
                error: true,
                message: err.message || "Sản phẩm không đủ hàng trong kho"
            });
        }

        const req = new paypal.orders.OrdersCaptureRequest(paymentId);
        req.requestBody({});

        const client = getPayPalClient();
        const capture = await client.execute(req);

        if (capture.result.status === "COMPLETED") {
            const orderInfo = {
                userId: userId,
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

            try {
                await markCouponUsed(order.couponCode, userId);
            } catch (err) {
                console.error("Lỗi khi đánh dấu mã giảm giá đã dùng:", err);
            }

            // Clear cart on backend after successful PayPal capture


            try {
                const cartItemIds = order.products.map(p => p.cartItemId).filter(Boolean);
                if (cartItemIds.length > 0) {
                    await CartProductModel.deleteMany({ _id: { $in: cartItemIds } });
                } else {
                    // Fallback: Xóa theo productId, size, weight, ram để tránh xóa toàn bộ giỏ hàng
                    for (const item of order.products) {
                        await CartProductModel.deleteMany({
                            userId: userId,
                            productId: item.productId,
                            size: item.size || "",
                            weight: item.weight || "",
                            ram: item.ram || ""
                        });
                    }
                }
            } catch (err) {
                console.error("Lỗi khi xóa giỏ hàng:", err);
            }

            // Gửi email, cập nhật minigame, trừ kho trong try-catch riêng biệt để tránh lỗi làm gián đoạn phản hồi
            try {
                const user = await UserModel.findOne({ _id: userId })
                if (user?.email) {
                    await sendEmailFun({
                        sendTo: [user.email],
                        subject: "Xác nhận đơn hàng - Merch4u",
                        text: "",
                        html: OrderConfirmationEmail(user?.name, order)
                    });
                }
            } catch (err) {
                console.error("Lỗi gửi email xác nhận:", err);
            }

            try {
                await updateMinigameMissionsOnOrder(userId, pricing.totalAmt);
            } catch (err) {
                console.error("Lỗi cập nhật minigame:", err);
            }

            try {
                await deductInventoryForOrder(request.body.products);
            } catch (err) {
                console.error("Lỗi trừ kho:", err);
            }

            return response.status(200).json(
                {
                    success: true,
                    error: false,
                    order: order,
                    message: "Đơn hàng đã thanh toán thành công và được tạo"
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
        console.error("Lỗi capture PayPal:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const updateOrderStatusController = async (request, response) => {
    try {
        const { order_status, payment_status } = request.body;
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

        const updateData = {};

        if (order_status) {
            if (!allowedStatuses.includes(order_status)) {
                return response.status(400).json({
                    message: "Trạng thái đơn hàng không hợp lệ",
                    success: false,
                    error: true
                })
            }
            updateData.order_status = order_status;
        }

        if (payment_status !== undefined) {
            updateData.payment_status = payment_status;
        }

        if (Object.keys(updateData).length === 0) {
            return response.status(400).json({
                message: "Không có thông tin trạng thái để cập nhật",
                success: false,
                error: true
            });
        }

        const updateOrder = await OrderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        )

        return response.json({
            message: "Cập nhật trạng thái đơn hàng thành công",
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
        await restoreCouponForOrder(order);

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

export const cancelOrderByCodeController = async (request, response) => {
    try {
        const { orderCode } = request.params;
        const order = await OrderModel.findOne({ paymentId: String(orderCode) });

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

        if (order.order_status === "cancelled") {
            return response.status(200).json({
                message: "Đơn hàng đã được hủy trước đó",
                success: true,
                error: false,
                order
            });
        }

        if (CANCEL_BLOCKED_STATUSES.includes(order.order_status)) {
            return response.status(400).json({
                message: "Không thể hủy đơn hàng đã giao hoặc đang vận chuyển",
                error: true,
                success: false
            })
        }

        await restoreInventoryForOrder(order);
        await restoreCouponForOrder(order);

        order.order_status = "cancelled";
        order.cancelledAt = new Date();
        await order.save();

        return response.status(200).json({
            message: "Đơn hàng đã được hủy thành công",
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
        const currentYear = new Date().getFullYear();
        const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        const users = await UserModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                    }
                }
            },
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
        const userId = request.userId;

        // 1. Kiểm tra tồn kho trước khi tạo liên kết thanh toán
        await validateInventory(request.body.products);

        // Sử dụng 10 chữ số cuối của timestamp để đảm bảo độ dài an toàn cho PayOS (thường < 15 chữ số)
        const orderCode = Number(String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 100)).padStart(2, '0'));

        const pricing = await resolveOrderPricing(request.body);

        let order = new OrderModel({
            userId: userId,
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


        const clientUrl = getClientBaseUrl(request);
        const orderBody = {
            orderCode: orderCode,
            amount: pricing.totalAmt,
            description: 'Thanh toan don hang',
            returnUrl: `${clientUrl}/order/success`,
            cancelUrl: `${clientUrl}/checkout`
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

                    const cartItemIds = order.products.map(p => p.cartItemId).filter(Boolean);
                    if (cartItemIds.length > 0) {
                        await CartProductModel.deleteMany({ _id: { $in: cartItemIds } });
                    } else {
                        // Fallback: Xóa theo productId, size, weight, ram để tránh xóa toàn bộ giỏ hàng
                        for (const item of order.products) {
                            await CartProductModel.deleteMany({
                                userId: order.userId,
                                productId: item.productId,
                                size: item.size || "",
                                weight: item.weight || "",
                                ram: item.ram || ""
                            });
                        }
                    }
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

        const paymentInfo = await payos.paymentRequests.get(Number(orderCode));

        if (paymentInfo.status === 'PAID') {
            const order = await OrderModel.findOne({ paymentId: String(orderCode) });

            if (order) {
                // Kiểm tra quyền sở hữu đơn hàng
                if (String(order.userId) !== String(request.userId)) {
                    return response.status(403).json({
                        success: false,
                        message: "Bạn không có quyền xác thực đơn hàng này"
                    });
                }

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

                    const cartItemIds = order.products.map(p => p.cartItemId).filter(Boolean);
                    if (cartItemIds.length > 0) {
                        await CartProductModel.deleteMany({ _id: { $in: cartItemIds } });
                    } else {
                        // Fallback: Xóa theo productId, size, weight, ram để tránh xóa toàn bộ giỏ hàng
                        for (const item of order.products) {
                            await CartProductModel.deleteMany({
                                userId: order.userId,
                                productId: item.productId,
                                size: item.size || "",
                                weight: item.weight || "",
                                ram: item.ram || ""
                            });
                        }
                    }
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

export const getDeliveredChartsData = async (request, response) => {
    try {
        const deliveredOrders = await OrderModel.find({ order_status: "delivered" });

        const productSales = {};
        for (const order of deliveredOrders) {
            for (const item of order.products || []) {
                if (item.productId && mongoose.Types.ObjectId.isValid(item.productId) && item.quantity > 0) {
                    productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                }
            }
        }

        const productIds = Object.keys(productSales);
        const products = await ProductModel.find({ _id: { $in: productIds } }).populate("category");

        const topProductsMap = [];
        const categorySalesMap = {};

        for (const product of products) {
            const sales = productSales[product._id.toString()] || 0;
            topProductsMap.push({
                name: product.name,
                sales: sales
            });

            const catName = product.category?.name || product.catName || "Khác";
            categorySalesMap[catName] = (categorySalesMap[catName] || 0) + sales;
        }

        const topProductsData = topProductsMap
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)
            .map(p => ({
                name: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
                sales: p.sales
            }));

        const categoryData = Object.keys(categorySalesMap)
            .map(cat => ({
                name: cat,
                value: categorySalesMap[cat]
            }))
            .filter(item => item.value > 0);

        return response.status(200).json({
            error: false,
            success: true,
            topProductsData,
            categoryData
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

