import CouponModel from "../models/coupon.model.js";
import UserModel from "../models/user.model.js";

const normalizeCode = (code = "") => code.trim().toUpperCase();

const isCouponUsable = (coupon) => {
    if (!coupon || coupon.isActive === false) return false;
    if (new Date(coupon.expiryDate).getTime() < Date.now()) return false;
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return false;
    return true;
}

export const calculateCouponDiscount = (coupon, orderTotal) => {
    if (!coupon) return 0;

    const total = Number(orderTotal || 0);
    let rawDiscount = 0;
    if (coupon.type === "percent") {
        rawDiscount = Math.round(total * Number(coupon.discount || 0) / 100);
        if (coupon.maxDiscount > 0) {
            rawDiscount = Math.min(rawDiscount, Number(coupon.maxDiscount));
        }
    } else {
        rawDiscount = Number(coupon.discount || 0);
    }

    return Math.min(Math.max(rawDiscount, 0), total);
}

const requireAdmin = async (request, response) => {
    const user = await UserModel.findById(request.userId).select("role");

    if (!["ADMIN", "SUPERBOSS"].includes(user?.role)) {
        response.status(403).json({
            message: "Chỉ admin mới có quyền quản lý mã giảm giá",
            error: true,
            success: false
        });
        return false;
    }

    return true;
}

export const createCouponController = async (request, response) => {
    try {
        if (!await requireAdmin(request, response)) return;

        let expiry = request.body.expiryDate;
        if (expiry) {
            const date = new Date(expiry);
            date.setUTCHours(23, 59, 59, 999);
            expiry = date;
        }

        const coupon = await CouponModel.create({
            ...request.body,
            expiryDate: expiry,
            code: normalizeCode(request.body.code)
        });

        return response.status(201).json({
            message: "Tạo mã giảm giá thành công",
            error: false,
            success: true,
            coupon
        });
    } catch (error) {
        return response.status(500).json({
            message: error.code === 11000 ? "Mã giảm giá đã tồn tại" : error.message || error,
            error: true,
            success: false
        });
    }
}

export const updateCouponController = async (request, response) => {
    try {
        if (!await requireAdmin(request, response)) return;

        const payload = { ...request.body };
        if (payload.code) payload.code = normalizeCode(payload.code);
        if (payload.expiryDate) {
            const date = new Date(payload.expiryDate);
            date.setUTCHours(23, 59, 59, 999);
            payload.expiryDate = date;
        }

        const coupon = await CouponModel.findByIdAndUpdate(
            request.params.id,
            payload,
            { new: true }
        );

        if (!coupon) {
            return response.status(404).json({
                message: "Không tìm thấy mã giảm giá",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Cập nhật mã giảm giá thành công",
            error: false,
            success: true,
            coupon
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const getCouponsController = async (request, response) => {
    try {
        if (!await requireAdmin(request, response)) return;

        const coupons = await CouponModel.find().sort({ createdAt: -1 });

        return response.json({
            error: false,
            success: true,
            coupons
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const deleteCouponController = async (request, response) => {
    try {
        if (!await requireAdmin(request, response)) return;

        const coupon = await CouponModel.findByIdAndDelete(request.params.id);

        if (!coupon) {
            return response.status(404).json({
                message: "Không tìm thấy mã giảm giá",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Xóa mã giảm giá thành công",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const validateCouponController = async (request, response) => {
    try {
        const code = normalizeCode(request.body.code);
        const orderTotal = Number(request.body.orderTotal || 0);
        const coupon = await CouponModel.findOne({ code });

        if (!isCouponUsable(coupon)) {
            return response.status(400).json({
                message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
                error: true,
                success: false
            });
        }

        if (orderTotal < Number(coupon.minOrder || 0)) {
            return response.status(400).json({
                message: `Đơn hàng cần tối thiểu ${Number(coupon.minOrder).toLocaleString("vi-VN")}đ để dùng mã này`,
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Áp dụng mã giảm giá thành công",
            error: false,
            success: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                discount: coupon.discount,
                minOrder: coupon.minOrder,
                maxDiscount: coupon.maxDiscount,
                expiryDate: coupon.expiryDate
            },
            discountAmount: calculateCouponDiscount(coupon, orderTotal)
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const getMinigameStatusController = async (request, response) => {
    try {
        const userId = request.userId;
        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({ message: "Người dùng không tồn tại", error: true, success: false });
        }

        const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

        let gameData = user.gameData || {};
        let needsSave = false;

        // Reset daily spin
        if (gameData.lastDailySpinDate !== today) {
            gameData.spins = (gameData.spins || 0) + 1;
            gameData.lastDailySpinDate = today;
            needsSave = true;
        }

        // Reset daily missions
        if (!gameData.missions || gameData.missions.date !== today) {
            gameData.missions = {
                date: today,
                ordersCount: 0,
                maxOrderValue: 0,
                claimedMissions: []
            };
            needsSave = true;
        }

        // Clean up old wonCoupons (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const originalWonCount = gameData.wonCoupons?.length || 0;
        gameData.wonCoupons = (gameData.wonCoupons || []).filter(wc => new Date(wc.wonAt) > sevenDaysAgo);
        if (gameData.wonCoupons.length !== originalWonCount) {
            needsSave = true;
        }

        // Generate wheel if needed
        if (!gameData.wheel || gameData.wheel.date !== today) {
            const excludedCouponIds = (gameData.wonCoupons || [])
                .filter(wc => wc.couponId)
                .map(wc => wc.couponId.toString());
            const availableCoupons = await CouponModel.find({
                isActive: true,
                expiryDate: { $gte: new Date() }
            });
            
            const usableCoupons = availableCoupons.filter(c => isCouponUsable(c) && !excludedCouponIds.includes(c._id.toString()));
            
            // Randomly select up to 10
            const shuffled = usableCoupons.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 10).map(c => c._id);
            
            gameData.wheel = {
                date: today,
                coupons: selected
            };
            needsSave = true;
        }

        if (needsSave) {
            user.gameData = gameData;
            await user.save();
        }

        // Populate wheel coupons for response
        await user.populate('gameData.wheel.coupons');

        return response.json({
            message: "Minigame status",
            error: false,
            success: true,
            data: user.gameData
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const claimRandomCouponController = async (request, response) => {
    try {
        const userId = request.userId;
        const user = await UserModel.findById(userId);
        
        if (!user || !user.gameData) {
            return response.status(400).json({ message: "Dữ liệu minigame không hợp lệ", error: true, success: false });
        }

        if ((user.gameData.spins || 0) <= 0) {
            return response.status(400).json({
                message: "Bạn đã hết lượt quay. Hãy làm nhiệm vụ để nhận thêm!",
                error: true,
                success: false
            });
        }

        const today = new Date().toLocaleDateString("en-CA");
        if (!user.gameData.wheel || user.gameData.wheel.date !== today || !user.gameData.wheel.coupons || user.gameData.wheel.coupons.length === 0) {
            return response.status(400).json({
                message: "Vòng quay hôm nay chưa được khởi tạo hoặc không có phần thưởng.",
                error: true,
                success: false
            });
        }

        await user.populate('gameData.wheel.coupons');
        const wheelCoupons = user.gameData.wheel.coupons.filter(c => isCouponUsable(c));
        
        if (wheelCoupons.length === 0) {
            return response.status(400).json({
                message: "Không có mã giảm giá khả dụng trong vòng quay.",
                error: true,
                success: false
            });
        }

        // Random pick one from wheel
        const winnerCoupon = wheelCoupons[Math.floor(Math.random() * wheelCoupons.length)];

        // Update user data
        user.gameData.spins -= 1;

        // Check if user already has this coupon → stack quantity
        const existingWon = user.gameData.wonCoupons.find(
            wc => wc.couponId && wc.couponId.toString() === winnerCoupon._id.toString()
        );
        if (existingWon) {
            existingWon.quantity = (existingWon.quantity || 1) + 1;
            existingWon.wonAt = new Date(); // refresh timestamp
        } else {
            user.gameData.wonCoupons.push({
                couponId: winnerCoupon._id,
                quantity: 1,
                wonAt: new Date()
            });
        }

        // Remove the won coupon from today's wheel so they don't win it again today
        user.gameData.wheel.coupons = user.gameData.wheel.coupons.filter(
            c => c && c._id && c._id.toString() !== winnerCoupon._id.toString()
        );
        
        await user.save();

        return response.json({
            message: "Chúc mừng! Bạn đã nhận được mã giảm giá.",
            error: false,
            success: true,
            coupon: {
                code: winnerCoupon.code,
                type: winnerCoupon.type,
                discount: winnerCoupon.discount,
                minOrder: winnerCoupon.minOrder,
                maxDiscount: winnerCoupon.maxDiscount,
                expiryDate: winnerCoupon.expiryDate
            }
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const getUserCouponsController = async (request, response) => {
    try {
        const userId = request.userId;
        const user = await UserModel.findById(userId).populate({
            path: 'gameData.wonCoupons.couponId',
            model: 'coupon'
        });
        if (!user) {
            return response.status(404).json({ message: "Người dùng không tồn tại", error: true, success: false });
        }

        const validCoupons = [];
        if (user.gameData && user.gameData.wonCoupons) {
            for (const wc of user.gameData.wonCoupons) {
                if (wc.couponId && typeof wc.couponId === 'object' && wc.couponId.code) {
                    const couponObj = typeof wc.couponId.toObject === 'function' ? wc.couponId.toObject() : wc.couponId;
                    validCoupons.push({
                        ...couponObj,
                        quantity: wc.quantity || 1
                    });
                }
            }
        }

        return response.json({
            message: "Danh sách mã giảm giá của bạn",
            error: false,
            success: true,
            coupons: validCoupons
        });
    } catch (error) {
         return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const deleteUserCouponController = async (request, response) => {
    try {
        const userId = request.userId;
        const couponId = request.params.id; 

        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({ message: "Người dùng không tồn tại", error: true, success: false });
        }

        const entry = (user.gameData.wonCoupons || []).find(wc => wc.couponId && wc.couponId.toString() === couponId.toString());
        if (!entry) {
            return response.status(404).json({ message: "Không tìm thấy mã giảm giá trong kho", error: true, success: false });
        }

        if ((entry.quantity || 1) > 1) {
            entry.quantity -= 1;
        } else {
            user.gameData.wonCoupons = user.gameData.wonCoupons.filter(wc => wc.couponId && wc.couponId.toString() !== couponId.toString());
        }
        await user.save();

        return response.json({
            message: "Xóa mã giảm giá thành công",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

// When a coupon from user's inventory is used at checkout, decrement quantity
export const useUserCouponController = async (request, response) => {
    try {
        const userId = request.userId;
        const { couponCode } = request.body;

        if (!couponCode) {
            return response.status(400).json({ message: "Thiếu mã coupon", error: true, success: false });
        }

        const coupon = await CouponModel.findOne({ code: normalizeCode(couponCode) });
        if (!coupon) {
            return response.json({ error: false, success: true }); // Not a user coupon, skip
        }

        const user = await UserModel.findById(userId);
        if (!user) return response.json({ error: false, success: true });

        const entry = (user.gameData.wonCoupons || []).find(
            wc => wc.couponId && wc.couponId.toString() === coupon._id.toString()
        );

        if (entry) {
            if ((entry.quantity || 1) > 1) {
                entry.quantity -= 1;
            } else {
                user.gameData.wonCoupons = user.gameData.wonCoupons.filter(
                    wc => wc.couponId && wc.couponId.toString() !== coupon._id.toString()
                );
            }
            await user.save();
        }

        return response.json({
            message: "Đã sử dụng mã giảm giá",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}
