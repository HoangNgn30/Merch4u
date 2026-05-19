import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    discount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ["fixed", "percent"],
        default: "fixed"
    },
    minOrder: {
        type: Number,
        default: 0
    },
    maxUses: {
        type: Number,
        default: 0
    },
    usedCount: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const CouponModel = mongoose.model("coupon", couponSchema);

export default CouponModel;
