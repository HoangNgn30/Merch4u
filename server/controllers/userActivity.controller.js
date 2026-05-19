import mongoose from "mongoose";
import ProductModel from "../models/product.modal.js";
import UserActivityModel from "../models/userActivity.model.js";

export async function trackProductView(request, response) {
    try {
        const userId = request.userId;
        const { productId } = request.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Mã sản phẩm không hợp lệ",
            });
        }

        const product = await ProductModel.exists({ _id: productId });
        if (!product) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "Không tìm thấy sản phẩm",
            });
        }

        await UserActivityModel.updateOne(
            { userId, productId },
            {
                $set: { viewedAt: new Date() },
                $inc: { viewCount: 1 },
            },
            { upsert: true }
        );

        return response.status(200).json({
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            error: true,
            success: false,
            message: error.message || error,
        });
    }
}
