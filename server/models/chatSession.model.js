import mongoose from "mongoose";

const chatProductSchema = new mongoose.Schema(
    {
        _id: String,
        name: String,
        price: Number,
        oldPrice: Number,
        discount: Number,
        images: [String],
        countInStock: Number,
        rating: Number,
    },
    { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "ai"],
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        products: [chatProductSchema],
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        title: {
            type: String,
            default: "New Chat",
        },
        messages: [chatMessageSchema],
    },
    { timestamps: true }
);

chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const ChatSessionModel = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSessionModel;
