/**
 * ai.controller.js
 * RAG-based AI Chat + Personalized Recommendations
 * Sử dụng: Google Gemini (text-embedding-004 + gemini-2.0-flash-001)
 *          MongoDB Atlas Vector Search ($vectorSearch)
 */

import { GoogleGenAI } from '@google/genai';
import ProductModel from '../models/product.modal.js';
import UserModel from '../models/user.model.js';
import OrderModel from '../models/order.model.js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lấy vector embedding từ Gemini gemini-embedding-001 (3072 dims)
 */
async function getEmbedding(text) {
    const result = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: [text],
    });
    return result.embeddings[0].values;
}

/**
 * Tìm sản phẩm liên quan nhất bằng MongoDB Atlas $vectorSearch
 * @param {number[]} queryVector - Vector của câu hỏi/danh mục
 * @param {number}   limit       - Số sản phẩm trả về
 * @param {string[]} excludeIds  - Danh sách productId loại trừ
 */
async function vectorSearchProducts(queryVector, limit = 5, excludeIds = []) {
    const pipeline = [
        {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector,
                numCandidates: 50,
                limit: limit + excludeIds.length, // lấy thêm để bù excludeIds
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                price: 1,
                oldPrice: 1,
                discount: 1,
                images: 1,
                catName: 1,
                subCat: 1,
                brand: 1,
                rating: 1,
                countInStock: 1,
                score: { $meta: 'vectorSearchScore' },
            },
        },
    ];

    const results = await ProductModel.aggregate(pipeline);

    // Loại trừ sản phẩm đã mua
    return results
        .filter((p) => !excludeIds.includes(p._id.toString()))
        .slice(0, limit);
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Chat AI cá nhân hóa với Streaming (SSE)
 * Body: { message: string }
 * userId được lấy từ JWT middleware (request.userId) — bảo mật
 */
export async function chatWithAI(request, response) {
    const { message } = request.body;
    const userId = request.userId; // từ auth middleware, không tin body

    if (!message || !message.trim()) {
        return response.status(400).json({
            error: true,
            message: 'Vui lòng nhập câu hỏi',
        });
    }

    try {
        // 1. Lấy thông tin user
        const user = await UserModel.findById(userId).select('name email');
        const userName = user?.name || 'bạn';

        // 2. Lấy lịch sử đơn hàng gần nhất (tối đa 5 đơn)
        const recentOrders = await OrderModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('products totalAmt createdAt');

        const orderSummary = recentOrders.length > 0
            ? recentOrders.map((o) => {
                const items = o.products.map((p) => p.productTitle).join(', ');
                return `- Đơn ngày ${new Date(o.createdAt).toLocaleDateString('vi-VN')}: ${items} (${o.totalAmt?.toLocaleString('vi-VN')}đ)`;
            }).join('\n')
            : 'Chưa có đơn hàng nào.';

        // 3. Vectorize câu hỏi → tìm sản phẩm liên quan
        const queryVector = await getEmbedding(message);
        const relevantProducts = await vectorSearchProducts(queryVector, 5);

        // 4. Build context từ sản phẩm liên quan
        const productContext = relevantProducts.length > 0
            ? relevantProducts.map((p, i) => {
                const inStock = p.countInStock > 0 ? 'Còn hàng' : 'Hết hàng';
                const price = p.price?.toLocaleString('vi-VN');
                return `[Sản phẩm ${i + 1}]
ID: ${p._id}
Tên: ${p.name}
Giá: ${price}đ${p.discount > 0 ? ` (giảm ${p.discount}%)` : ''}
Danh mục: ${p.catName || ''} > ${p.subCat || ''}
Thương hiệu: ${p.brand || 'N/A'}
Đánh giá: ${p.rating}/5
Tình trạng: ${inStock}
Mô tả ngắn: ${p.description?.slice(0, 120)}...`;
            }).join('\n\n')
            : 'Không tìm thấy sản phẩm phù hợp trong kho.';

        // 5. Build System Prompt (Prompt Engineering)
        const systemPrompt = `
        Bạn là trợ lý ảo thông minh và thân thiện của cửa hàng Merch4u.
        Nhiệm vụ: Tư vấn sản phẩm merchandise (K-pop, Anime, Game...) và hỗ trợ khách hàng.

        THÔNG TIN KHÁCH HÀNG:
        - Tên: ${userName}
        - Lịch sử mua hàng: ${orderSummary}

        DANH SÁCH SẢN PHẨM LIÊN QUAN (CONTEXT):
        ${productContext}

        YÊU CẦU QUAN TRỌNG:
        1. Khi giới thiệu sản phẩm từ danh sách CONTEXT trên, hãy luôn kèm theo link dẫn đến trang chi tiết sản phẩm theo định dạng Markdown: [Tên sản phẩm](/product/ID-sản-phẩm). 
           Ví dụ: "Bạn có thể xem chi tiết [Album Born Pink](/product/65f123...)"
        2. Nếu không tìm thấy sản phẩm cụ thể trong context, hãy gợi ý khách hàng xem qua các danh mục liên quan hoặc thử tìm kiếm từ khóa khác.
        3. Trả lời bằng tiếng Việt, phong cách lịch sự, chuyên nghiệp nhưng vẫn gần gũi.
        4. Sử dụng Markdown để định dạng văn bản (in đậm, danh sách) cho dễ đọc.
        `;

        // 6. Streaming response qua SSE
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Gọi đúng model mà tài khoản của bạn được cấp quyền (Gemini 2.5 Flash)
        const result = await genAI.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: `Chào ${userName}! Mình là trợ lý AI của Merch4u, mình sẵn sàng giúp bạn nhé! 😊` }] },
                { role: 'user', parts: [{ text: message }] },
            ],
            config: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        });

        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunkText) {
                response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        response.end();

    } catch (error) {
        console.error('--- [AI Chat ERROR DEBUG] ---');
        console.error('Message:', error?.message);
        console.error('Stack:', error?.stack);
        console.error('-----------------------------');

        if (!response.headersSent) {
            return response.status(500).json({
                error: true,
                message: `AI Error: ${error?.message || 'Unknown error'}`,
            });
        }
        response.write(`data: ${JSON.stringify({ error: error?.message || 'AI đang bận, vui lòng thử lại sau!' })}\n\n`);
        response.end();
    }
}

/**
 * GET /api/ai/recommendations
 * Gợi ý sản phẩm cá nhân hóa cho user hiện tại
 * userId từ auth middleware (JWT) — bảo mật
 */
// Cache tạm thời cho Recommendations (để tránh tốn quota khi reload trang liên tục)
const recoCache = new Map();

export async function getAIRecommendations(request, response) {
    const userId = request.userId;
    const cacheKey = userId || 'guest';
    const now = Date.now();

    // Nếu đã có cache trong vòng 5 phút, trả về luôn
    if (recoCache.has(cacheKey) && (now - recoCache.get(cacheKey).time < 5 * 60 * 1000)) {
        return response.status(200).json(recoCache.get(cacheKey).data);
    }

    try {
        // 1. Lấy lịch sử đơn hàng
        const orders = await OrderModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('products');

        // 2. Thu thập các productId đã mua để loại trừ
        const purchasedProductIds = [];
        const purchasedCategories = [];
        const purchasedSubCats = [];

        for (const order of orders) {
            for (const item of order.products) {
                if (item.productId) {
                    purchasedProductIds.push(item.productId.toString());
                }
            }
        }

        // 3. Lấy chi tiết category từ sản phẩm đã mua
        if (purchasedProductIds.length > 0) {
            const purchasedDetails = await ProductModel.find({
                _id: { $in: purchasedProductIds },
            }).select('catName subCat brand');

            for (const p of purchasedDetails) {
                if (p.catName) purchasedCategories.push(p.catName);
                if (p.subCat) purchasedSubCats.push(p.subCat);
            }
        }

        let recommendations = [];

        // 4a. Có lịch sử → Vector Search theo sở thích
        if (purchasedCategories.length > 0) {
            const preferenceText = `Merchandise ${[...new Set(purchasedCategories)].join(', ')}. ${[...new Set(purchasedSubCats)].join(', ')}`;
            const queryVector = await getEmbedding(preferenceText);
            recommendations = await vectorSearchProducts(queryVector, 8, purchasedProductIds);
        }

        // 4b. Cold-start (user mới hoặc không đủ vector kết quả)
        if (recommendations.length < 4) {
            const fallback = await ProductModel.find({
                isFeatured: true,
                _id: { $nin: purchasedProductIds },
            })
                .sort({ rating: -1 })
                .limit(8)
                .select('name price oldPrice discount images catName subCat brand rating countInStock');

            // Merge, loại trùng
            const existingIds = new Set(recommendations.map((r) => r._id.toString()));
            for (const p of fallback) {
                if (!existingIds.has(p._id.toString())) {
                    recommendations.push(p);
                    if (recommendations.length >= 8) break;
                }
            }
        }

        // Lưu vào cache trước khi trả về
        recoCache.set(cacheKey, {
            time: Date.now(),
            data: {
                error: false,
                success: true,
                products: recommendations,
                total: recommendations.length,
            }
        });

        return response.status(200).json({
            error: false,
            success: true,
            products: recommendations,
            total: recommendations.length,
        });

    } catch (error) {
        console.error('[AI Recommendations Error]', error?.message || error);
        return response.status(500).json({
            error: true,
            message: 'Không thể tải gợi ý sản phẩm',
        });
    }
}
