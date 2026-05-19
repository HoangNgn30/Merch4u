import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Provide name"]
    },
    email: {
        type: String,
        required: [true, "Provide email"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Provide password"]
    },
    avatar: {
        type: String,
        default: ""
    },
    mobile: {
        type: String,
        default: ""
    },
    verify_email: {
        type: Boolean,
        default: false
    },
    access_token: {
        type: String,
        default: ''
    },
    refresh_token: {
        type: String,
        default: ''
    },
    last_login_date: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended"],
        default: "Active"
    },
    address_details: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'address'
        }
    ],
    orderHistory: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'order'
        }
    ],
    otp:{
        type:String
    },
    otpExpires:{
        type:Date
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN', 'SUPERBOSS'],
        default: "USER"
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'active'
    },
    signUpWithGoogle:{
        type:Boolean,
        default:false
    },
    gameData: {
        spins: { type: Number, default: 0 },
        lastDailySpinDate: { type: String, default: "" }, // Format: YYYY-MM-DD
        wonCoupons: [
            {
                couponId: { type: mongoose.Schema.ObjectId, ref: 'coupon' },
                quantity: { type: Number, default: 1 },
                wonAt: { type: Date, default: Date.now }
            }
        ],
        missions: {
            date: { type: String, default: "" }, // Format: YYYY-MM-DD
            ordersCount: { type: Number, default: 0 },
            maxOrderValue: { type: Number, default: 0 },
            claimedMissions: [{ type: String }] // Array of mission IDs claimed
        },
        wheel: {
            date: { type: String, default: "" }, // Format: YYYY-MM-DD
            coupons: [
                { type: mongoose.Schema.ObjectId, ref: 'coupon' }
            ]
        }
    }
},
    { timestamps: true }
)

userSchema.index(
    { role: 1 },
    {
        unique: true,
        partialFilterExpression: { role: "SUPERBOSS" }
    }
);


const UserModel = mongoose.model("User",userSchema);

export default UserModel
