import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        productId: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        viewedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        viewCount: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

userActivitySchema.index({ userId: 1, productId: 1 }, { unique: true });

const UserActivityModel = mongoose.model("UserActivity", userActivitySchema);

export default UserActivityModel;
