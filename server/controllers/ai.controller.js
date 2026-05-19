import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import ProductModel from "../models/product.modal.js";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import ChatSessionModel from "../models/chatSession.model.js";
import UserActivityModel from "../models/userActivity.model.js";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const PRODUCT_SELECT = "name description price oldPrice discount images catName catId subCat subCatId thirdsubCat brand rating countInStock status isNew sale createdAt";
const SIMILAR_CACHE_TTL = 10 * 60 * 1000;
const SESSION_IDLE_LIMIT = 30 * 60 * 1000;

const similarCache = new Map();
const recoCache = new Map();

function escapeRegExp(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function productEmbeddingText(product = {}) {
    return [
        product.name,
        product.description,
        product.catName,
        product.subCat,
        product.thirdsubCat,
        product.brand,
    ].filter(Boolean).join(". ");
}

function compactProduct(product = {}) {
    return {
        _id: product._id?.toString?.() || product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        discount: product.discount,
        images: product.images || [],
        catName: product.catName,
        catId: product.catId,
        subCat: product.subCat,
        subCatId: product.subCatId,
        thirdsubCat: product.thirdsubCat,
        brand: product.brand,
        rating: product.rating,
        countInStock: product.countInStock,
        status: product.status,
        isNew: product.isNew,
        sale: product.sale,
        score: product.score,
        hybridScore: product.hybridScore,
    };
}

function chatProductCard(product = {}) {
    return {
        _id: product._id?.toString?.() || product._id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        discount: product.discount,
        images: product.images || [],
        countInStock: product.countInStock,
        rating: product.rating,
    };
}

async function getEmbedding(text) {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY chưa được cấu hình.");
    }
    
    const cleanText = String(text || "").trim();
    if (!cleanText) {
        throw new Error("Embedding text is empty");
    }

    const result = await genAI.models.embedContent({
        model: "gemini-embedding-001",
        contents: [cleanText],
    });

    return result.embeddings[0].values;
}

async function vectorSearchProducts(queryVector, limit = 5, excludeIds = []) {
    const excluded = new Set(excludeIds.map((id) => id?.toString?.() || String(id)));

    const pipeline = [
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector,
                numCandidates: Math.max(50, limit * 10),
                limit: limit + excluded.size,
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
                catId: 1,
                subCat: 1,
                subCatId: 1,
                thirdsubCat: 1,
                brand: 1,
                rating: 1,
                countInStock: 1,
                status: 1,
                isNew: 1,
                sale: 1,
                score: { $meta: "vectorSearchScore" },
            },
        },
    ];

    const results = await ProductModel.aggregate(pipeline);
    return results
        .filter((product) => !excluded.has(product._id.toString()))
        .slice(0, limit);
}

function scoreTextProduct(product, query) {
    const q = query.toLowerCase();
    const fields = {
        name: String(product.name || "").toLowerCase(),
        brand: String(product.brand || "").toLowerCase(),
        catName: String(product.catName || "").toLowerCase(),
        subCat: String(product.subCat || "").toLowerCase(),
        thirdsubCat: String(product.thirdsubCat || "").toLowerCase(),
        description: String(product.description || "").toLowerCase(),
    };

    let score = 0;
    if (fields.name === q) score += 1;
    if (fields.name.includes(q)) score += 0.9;
    if (fields.brand.includes(q)) score += 0.7;
    if (fields.catName.includes(q) || fields.subCat.includes(q) || fields.thirdsubCat.includes(q)) score += 0.55;
    if (fields.description.includes(q)) score += 0.35;

    return Math.min(score, 1);
}

async function textSearchProducts(query, limit = 12) {
    const regex = new RegExp(escapeRegExp(query), "i");

    const products = await ProductModel.find({
        $or: [
            { name: regex },
            { brand: regex },
            { catName: regex },
            { subCat: regex },
            { thirdsubCat: regex },
            { description: regex },
        ],
    })
        .select(PRODUCT_SELECT)
        .limit(limit)
        .lean();

    return products.map((product) => ({
        ...product,
        textScore: scoreTextProduct(product, query),
    }));
}

async function hybridSearchProducts(query, limit = 8) {
    const [textResults, vectorResults] = await Promise.all([
        textSearchProducts(query, limit * 2),
        getEmbedding(query)
            .then((vector) => vectorSearchProducts(vector, limit * 2))
            .catch((error) => {
                console.warn("[AI Search] Vector search fallback:", error?.message || error);
                return [];
            }),
    ]);

    const combined = new Map();

    for (const product of textResults) {
        combined.set(product._id.toString(), {
            ...product,
            textScore: product.textScore || 0,
            vectorScore: 0,
        });
    }

    for (const product of vectorResults) {
        const id = product._id.toString();
        const current = combined.get(id) || {};
        combined.set(id, {
            ...product,
            ...current,
            score: product.score,
            textScore: current.textScore || scoreTextProduct(product, query),
            vectorScore: Number(product.score || 0),
        });
    }

    return Array.from(combined.values())
        .map((product) => {
            const hasVector = product.vectorScore > 0;
            const hybridScore = hasVector
                ? (0.3 * Number(product.textScore || 0)) + (0.7 * Number(product.vectorScore || 0))
                : Number(product.textScore || 0);
            return { ...product, hybridScore };
        })
        .sort((a, b) => Number(b.hybridScore || 0) - Number(a.hybridScore || 0))
        .slice(0, limit);
}

async function fallbackSimilarProducts(product, limit, excludeIds = []) {
    const excluded = [product._id?.toString?.() || product._id, ...excludeIds.map(String)].filter(Boolean);
    const filters = {
        _id: { $nin: excluded },
        $or: [
            product.subCatId ? { subCatId: product.subCatId } : null,
            product.subCat ? { subCat: product.subCat } : null,
            product.catId ? { catId: product.catId } : null,
            product.catName ? { catName: product.catName } : null,
            product.brand ? { brand: product.brand } : null,
        ].filter(Boolean),
    };

    return ProductModel.find(filters)
        .select(PRODUCT_SELECT)
        .sort({ rating: -1, sale: -1, createdAt: -1 })
        .limit(limit)
        .lean();
}

async function getSimilarProductsForProduct(productId, limit = 6) {
    const cacheKey = `${productId}:${limit}`;
    const cached = similarCache.get(cacheKey);
    if (cached && Date.now() - cached.time < SIMILAR_CACHE_TTL) {
        return cached.products;
    }

    const product = await ProductModel.findById(productId)
        .select(`${PRODUCT_SELECT} +embedding`)
        .lean();

    if (!product) {
        return null;
    }

    let products = [];

    try {
        const queryVector = product.embedding?.length
            ? product.embedding
            : await getEmbedding(productEmbeddingText(product));
        products = await vectorSearchProducts(queryVector, limit, [productId]);
    } catch (error) {
        console.warn("[AI Similar] Vector fallback:", error?.message || error);
    }

    if (products.length < limit) {
        const existingIds = new Set(products.map((item) => item._id.toString()));
        const fallback = await fallbackSimilarProducts(product, limit - products.length, [productId, ...existingIds]);
        products = products.concat(fallback.filter((item) => !existingIds.has(item._id.toString())));
    }

    products = products.slice(0, limit).map(compactProduct);
    similarCache.set(cacheKey, { time: Date.now(), products });
    return products;
}

async function getBoughtTogetherProducts(productId, limit = 6) {
    const orders = await OrderModel.find({ "products.productId": String(productId) })
        .select("products")
        .limit(250)
        .lean();

    const counts = new Map();
    for (const order of orders) {
        const seen = new Set();
        for (const item of order.products || []) {
            const id = String(item.productId || "");
            if (!id || id === String(productId) || seen.has(id)) continue;
            seen.add(id);
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    }

    const rankedIds = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

    let products = [];
    if (rankedIds.length > 0) {
        const found = await ProductModel.find({ _id: { $in: rankedIds } })
            .select(PRODUCT_SELECT)
            .lean();
        const byId = new Map(found.map((product) => [product._id.toString(), product]));
        products = rankedIds
            .map((id) => byId.get(id))
            .filter(Boolean)
            .slice(0, limit)
            .map((product) => ({
                ...compactProduct(product),
                coOccurrence: counts.get(product._id.toString()) || 0,
            }));
    }

    if (products.length < limit) {
        const fallback = await getSimilarProductsForProduct(productId, limit);
        if (fallback) {
            const existingIds = new Set(products.map((product) => product._id.toString()));
            products = products.concat(fallback.filter((product) => !existingIds.has(product._id.toString())));
        }
    }

    return products.slice(0, limit);
}

function detectOrderIntent(message = "") {
    return /(don hang|order|van chuyen|giao hang|ship|tracking|ma don|trang thai don|đơn hàng|vận chuyển|giao hàng|mã đơn|trạng thái đơn)/i.test(message);
}

function formatOrderStatus(order) {
    if (!order) return "Không có đơn hàng nào gần đây.";

    const items = (order.products || [])
        .map((item) => `${item.productTitle || "Sản phẩm"} x${item.quantity || 1}`)
        .join(", ");

    return [
        `Ma don: ${order.paymentId || order._id}`,
        `Trạng thái: ${order.order_status || "pending"}`,
        `Thanh toán: ${order.payment_status || "N/A"}`,
        `Tong tien: ${Number(order.totalAmt || 0).toLocaleString("vi-VN")}d`,
        `Sản phẩm: ${items || "N/A"}`,
        `Ngày tạo: ${new Date(order.createdAt).toLocaleDateString("vi-VN")}`,
    ].join("\n");
}

async function resolveChatSession(sessionId, userId) {
    const isValidSession = mongoose.Types.ObjectId.isValid(sessionId);
    let session = null;

    if (isValidSession) {
        const filters = { _id: sessionId };
        if (userId) filters.userId = userId;
        session = await ChatSessionModel.findOne(filters);
    }

    const inactiveTooLong = session?.updatedAt && (Date.now() - new Date(session.updatedAt).getTime() > SESSION_IDLE_LIMIT);

    if (!session || inactiveTooLong) {
        session = await ChatSessionModel.create({
            userId: userId || null,
            messages: [],
        });
    }

    return session;
}

async function getRecentOrderContext(userId, orderIntent = false) {
    if (!userId) {
        return {
            orderSummary: "Khách chưa đăng nhập nên chưa có lịch sử đơn hàng.",
            latestOrderStatus: "",
        };
    }

    const recentOrders = await OrderModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(orderIntent ? 5 : 3)
        .select("products totalAmt createdAt order_status payment_status paymentId")
        .lean();

    const orderSummary = recentOrders.length > 0
        ? recentOrders.map((order) => {
            const items = (order.products || []).map((item) => item.productTitle).filter(Boolean).join(", ");
            return `- ${new Date(order.createdAt).toLocaleDateString("vi-VN")}: ${items} (${Number(order.totalAmt || 0).toLocaleString("vi-VN")}d, ${order.order_status})`;
        }).join("\n")
        : "Chưa có đơn hàng nào.";

    return {
        orderSummary,
        latestOrderStatus: orderIntent ? formatOrderStatus(recentOrders[0]) : "",
    };
}

export async function semanticSearchController(request, response) {
    try {
        const query = String(request.query.q || request.query.query || "").trim();
        const limit = Math.min(Number(request.query.limit) || 8, 24);

        if (!query) {
            return response.status(200).json({
                error: false,
                success: true,
                products: [],
                total: 0,
                page: 1,
                totalPages: 0,
            });
        }

        const products = await hybridSearchProducts(query, limit);

        return response.status(200).json({
            error: false,
            success: true,
            query,
            products: products.map(compactProduct),
            total: products.length,
            page: 1,
            totalPages: 1,
        });
    } catch (error) {
        console.error("[AI Search Error]", error?.message || error);
        return response.status(500).json({
            error: true,
            success: false,
            message: "Không thể tìm kiếm bằng AI lúc này",
        });
    }
}

export async function getSimilarProducts(request, response) {
    try {
        const { productId } = request.params;
        const limit = Math.min(Number(request.query.limit) || 6, 12);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Mã sản phẩm không hợp lệ",
            });
        }

        const products = await getSimilarProductsForProduct(productId, limit);
        if (!products) {
            return response.status(404).json({
                error: true,
                success: false,
                message: "Không tìm thấy sản phẩm",
            });
        }

        return response.status(200).json({
            error: false,
            success: true,
            products,
            total: products.length,
        });
    } catch (error) {
        console.error("[AI Similar Error]", error?.message || error);
        return response.status(500).json({
            error: true,
            success: false,
            message: "Không thể tải sản phẩm tương tự",
        });
    }
}

export async function getBoughtTogether(request, response) {
    try {
        const { productId } = request.params;
        const limit = Math.min(Number(request.query.limit) || 6, 12);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Mã sản phẩm không hợp lệ",
            });
        }

        const products = await getBoughtTogetherProducts(productId, limit);

        return response.status(200).json({
            error: false,
            success: true,
            products,
            total: products.length,
        });
    } catch (error) {
        console.error("[AI BoughtTogether Error]", error?.message || error);
        return response.status(500).json({
            error: true,
            success: false,
            message: "Không thể tải gợi ý mua kèm",
        });
    }
}

export async function getAISuggestions(request, response) {
    try {
        const productId = request.query.productId;
        const suggestions = [];

        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            const product = await ProductModel.findById(productId).select("name brand catName subCat countInStock").lean();
            if (product) {
                suggestions.push(`Sản phẩm ${product.name} còn hàng không?`);
                suggestions.push(`Có món nào hợp với ${product.brand || product.catName || product.subCat || product.name} không?`);
            }
        }

        if (request.userId) {
            const latestOrder = await OrderModel.findOne({ userId: request.userId })
                .sort({ createdAt: -1 })
                .select("order_status")
                .lean();
            if (latestOrder) {
                suggestions.push("Đơn hàng gần nhất của tôi đến đâu rồi?");
            }
        }

        suggestions.push("Gợi ý quà tặng cho fan K-pop");
        suggestions.push("Có sản phẩm nào đang sale không?");

        return response.status(200).json({
            error: false,
            success: true,
            suggestions: [...new Set(suggestions)].slice(0, 4),
        });
    } catch (error) {
        return response.status(500).json({
            error: true,
            success: false,
            message: error.message || error,
        });
    }
}

export async function chatWithAI(request, response) {
    const { message, sessionId } = request.body;
    const userId = request.userId || null;

    if (!message || !message.trim()) {
        return response.status(400).json({
            error: true,
            message: "Vui lòng nhập câu hỏi",
        });
    }

    if (!genAI) {
        return response.status(503).json({
            error: true,
            message: "AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
        });
    }

    try {
        const session = await resolveChatSession(sessionId, userId);
        const recentMessages = (session.messages || []).slice(-10);
        const user = userId ? await UserModel.findById(userId).select("name email").lean() : null;
        const userName = user?.name || "bạn";
        const orderIntent = detectOrderIntent(message);
        const { orderSummary, latestOrderStatus } = await getRecentOrderContext(userId, orderIntent);

        let relevantProducts = [];
        try {
            const queryVector = await getEmbedding(message);
            relevantProducts = await vectorSearchProducts(queryVector, 5);
        } catch (error) {
            console.warn("[AI Chat] Text context fallback:", error?.message || error);
            relevantProducts = await textSearchProducts(message, 5);
        }

        const productContext = relevantProducts.length > 0
            ? relevantProducts.map((product, index) => {
                const inStock = product.countInStock > 0 ? "Còn hàng" : "Hết hàng";
                return `[Sản phẩm ${index + 1}]
ID: ${product._id}
Tên: ${product.name}
Giá: ${Number(product.price || 0).toLocaleString("vi-VN")}đ${product.discount > 0 ? ` (giảm ${product.discount}%)` : ""}
Danh mục: ${product.catName || ""} > ${product.subCat || ""}
Thương hiệu: ${product.brand || "N/A"}
Đánh giá: ${product.rating || 0}/5
Tình trạng: ${inStock}
Mô tả ngắn: ${String(product.description || "").slice(0, 160)}...`;
            }).join("\n\n")
            : "Không tìm thấy sản phẩm phù hợp trong kho.";

        const systemPrompt = `
Bạn là trợ lý ảo thông minh, thân thiện của cửa hàng Merch4u.
Nhiệm vụ: tư vấn sản phẩm merchandise K-pop, anime, game và hỗ trợ khách hàng.

THÔNG TIN KHÁCH HÀNG:
- Tên: ${userName}
- Lịch sử mua hàng gần đây:
${orderSummary}

${latestOrderStatus ? `TRẠNG THÁI ĐƠN HÀNG GẦN NHẤT:\n${latestOrderStatus}` : ""}

DANH SÁCH SẢN PHẨM LIÊN QUAN:
${productContext}

YÊU CẦU:
1. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự và dễ mua hàng.
2. Khi giới thiệu sản phẩm trong context, kèm link Markdown dạng [Tên sản phẩm](/product/ID).
3. Nếu hỏi về đơn hàng mà khách chưa đăng nhập hoặc không có dữ liệu, hãy nói rõ cần đăng nhập/không tìm thấy đơn.
4. Không bịa giá, tồn kho, trạng thái đơn hàng ngoài context.
`;

        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");

        response.write(`data: ${JSON.stringify({ sessionId: session._id.toString() })}\n\n`);

        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...recentMessages.map((item) => ({
                role: item.role === "ai" ? "model" : "user",
                parts: [{ text: item.text || "" }],
            })),
            { role: "user", parts: [{ text: message }] },
        ];

        const result = await genAI.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents,
            config: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        });

        let aiText = "";

        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (chunkText) {
                aiText += chunkText;
                response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        const cards = relevantProducts.slice(0, 3).map(chatProductCard);
        if (cards.length > 0) {
            response.write(`data: ${JSON.stringify({ cards })}\n\n`);
        }

        session.messages.push({ role: "user", text: message });
        session.messages.push({ role: "ai", text: aiText, products: cards });
        if (session.messages.length > 30) {
            session.messages = session.messages.slice(-30);
        }
        
        // Give the session a title if it doesn't have one and this is the first real exchange
        if (session.messages.length <= 3 && (!session.title || session.title === 'New Chat')) {
            session.title = String(message).slice(0, 30) + (message.length > 30 ? '...' : '');
        }

        await session.save();

        response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        response.end();
    } catch (error) {
        console.error("[AI Chat Error]", error?.message || error);

        if (!response.headersSent) {
            return response.status(500).json({
                error: true,
                message: `Lỗi AI: ${error?.message || "Lỗi không xác định"}`,
            });
        }

        response.write(`data: ${JSON.stringify({ error: error?.message || "AI dang ban, vui long thu lai sau!" })}\n\n`);
        response.end();
    }
}

export async function getAIRecommendations(request, response) {
    const userId = request.userId || "guest";
    const cacheKey = userId.toString();
    const cached = recoCache.get(cacheKey);

    if (cached && Date.now() - cached.time < 5 * 60 * 1000) {
        return response.status(200).json(cached.data);
    }

    try {
        const purchasedProductIds = [];
        const preferenceParts = [];

        if (request.userId) {
            const orders = await OrderModel.find({ userId: request.userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select("products")
                .lean();

            for (const order of orders) {
                for (const item of order.products || []) {
                    if (item.productId) purchasedProductIds.push(item.productId.toString());
                    if (item.productTitle) preferenceParts.push(item.productTitle);
                }
            }

            const recentActivities = await UserActivityModel.find({ userId: request.userId })
                .sort({ viewedAt: -1 })
                .limit(10)
                .populate("productId", "name catName subCat brand")
                .lean();

            for (const activity of recentActivities) {
                const product = activity.productId;
                if (!product) continue;
                preferenceParts.push(product.name, product.catName, product.subCat, product.brand);
            }
        }

        let recommendations = [];

        if (preferenceParts.length > 0) {
            try {
                const queryVector = await getEmbedding([...new Set(preferenceParts)].filter(Boolean).join(". "));
                recommendations = await vectorSearchProducts(queryVector, 8, purchasedProductIds);
            } catch (error) {
                console.warn("[AI Recommendations] Vector fallback:", error?.message || error);
            }
        }

        if (recommendations.length < 4) {
            const fallback = await ProductModel.find({
                _id: { $nin: purchasedProductIds },
                $or: [{ isFeatured: true }, { isNew: true }, { status: "exclusive" }],
            })
                .sort({ rating: -1, sale: -1, createdAt: -1 })
                .limit(8)
                .select(PRODUCT_SELECT)
                .lean();

            const existingIds = new Set(recommendations.map((item) => item._id.toString()));
            for (const product of fallback) {
                if (!existingIds.has(product._id.toString())) {
                    recommendations.push(product);
                    if (recommendations.length >= 8) break;
                }
            }
        }

        const data = {
            error: false,
            success: true,
            products: recommendations.map(compactProduct),
            total: recommendations.length,
        };

        recoCache.set(cacheKey, { time: Date.now(), data });
        return response.status(200).json(data);
    } catch (error) {
        console.error("[AI Recommendations Error]", error?.message || error);
        return response.status(500).json({
            error: true,
            message: "Không thể tải gợi ý sản phẩm",
        });
    }
}

export async function getChatSessions(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const sessions = await ChatSessionModel.find({ userId: request.userId })
            .select("title updatedAt")
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();
            
        return response.status(200).json({ error: false, success: true, sessions });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

export async function getChatSessionById(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const { id } = request.params;
        const session = await ChatSessionModel.findOne({ _id: id, userId: request.userId }).lean();
        
        if (!session) {
            return response.status(404).json({ error: true, message: "Không tìm thấy phiên chat" });
        }
        
        return response.status(200).json({ error: false, success: true, session });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

export async function deleteChatSession(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const { id } = request.params;
        await ChatSessionModel.findOneAndDelete({ _id: id, userId: request.userId });
        
        return response.status(200).json({ error: false, success: true, message: "Đã xóa phiên chat" });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}
