import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import UserModel from "../models/user.model.js";
import OrderModel from "../models/order.model.js";
import ChatSessionModel from "../models/chatSession.model.js";
import UserActivityModel from "../models/userActivity.model.js";
import CouponModel from "../models/coupon.model.js";
import HomeSliderModel from "../models/homeSlider.model.js";

const apiKey = process.env.GMN_API_KEY;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const PRODUCT_SELECT = "name description price oldPrice discount images size catName catId subCat subCatId thirdsubCat brand rating countInStock status isNew sale createdAt";
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
        size: product.size || [],
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
        throw new Error("GMN_API_KEY chưa được cấu hình.");
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

export function scoreTextProduct(product, query) {
    const q = query.toLowerCase().trim();
    if (!q) return 0;
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;

    const fields = {
        name: String(product.name || "").toLowerCase(),
        brand: String(product.brand || "").toLowerCase(),
        catName: String(product.catName || "").toLowerCase(),
        subCat: String(product.subCat || "").toLowerCase(),
        thirdsubCat: String(product.thirdsubCat || "").toLowerCase(),
        description: String(product.description || "").toLowerCase(),
    };

    let matchedWordsCount = 0;
    for (const word of words) {
        const matchesAnyField = 
            fields.name.includes(word) ||
            fields.brand.includes(word) ||
            fields.catName.includes(word) ||
            fields.subCat.includes(word) ||
            fields.thirdsubCat.includes(word) ||
            fields.description.includes(word);
        if (matchesAnyField) {
            matchedWordsCount++;
        }
    }

    const wordMatchScore = matchedWordsCount / words.length;

    let fieldScore = 0;
    const nameMatches = words.filter(word => fields.name.includes(word)).length;
    const brandMatches = words.filter(word => fields.brand.includes(word)).length;
    const catMatches = words.filter(word => fields.catName.includes(word) || fields.subCat.includes(word) || fields.thirdsubCat.includes(word)).length;
    const descMatches = words.filter(word => fields.description.includes(word)).length;

    if (nameMatches > 0) fieldScore += 0.5 * (nameMatches / words.length);
    if (brandMatches > 0) fieldScore += 0.3 * (brandMatches / words.length);
    if (catMatches > 0) fieldScore += 0.2 * (catMatches / words.length);
    if (descMatches > 0) fieldScore += 0.1 * (descMatches / words.length);

    let totalScore = (wordMatchScore * 0.5) + fieldScore;

    if (fields.name === q) {
        totalScore += 0.8;
    } else if (fields.name.includes(q)) {
        totalScore += 0.6;
    } else if (
        fields.brand.includes(q) ||
        fields.catName.includes(q) ||
        fields.subCat.includes(q) ||
        fields.thirdsubCat.includes(q) ||
        fields.description.includes(q)
    ) {
        totalScore += 0.3;
    }

    return Math.min(totalScore, 1);
}

export async function textSearchProducts(query, limit = 12) {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const makeKeywordCondition = (word) => {
        const regex = new RegExp(escapeRegExp(word), "i");
        return {
            $or: [
                { name: regex },
                { brand: regex },
                { catName: regex },
                { subCat: regex },
                { thirdsubCat: regex },
                { description: regex },
            ],
        };
    };

    const andConditions = words.map(makeKeywordCondition);

    let products = await ProductModel.find({ $and: andConditions })
        .select(PRODUCT_SELECT)
        .limit(limit)
        .lean();

    if (products.length < 4) {
        const strictIds = new Set(products.map(p => p._id.toString()));
        const orConditions = { $or: words.map(makeKeywordCondition) };
        const fallbackLimit = limit - products.length;

        if (fallbackLimit > 0) {
            const fallbackProducts = await ProductModel.find({
                $and: [
                    orConditions,
                    { _id: { $nin: Array.from(strictIds).map(id => new mongoose.Types.ObjectId(id)) } }
                ]
            })
                .select(PRODUCT_SELECT)
                .limit(fallbackLimit)
                .lean();

            products = products.concat(fallbackProducts);
        }
    }

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
        const textScore = current.textScore || scoreTextProduct(product, query);

        // Bỏ qua sản phẩm từ vector search mà không khớp bất kỳ từ khóa nào
        if (!combined.has(id) && textScore === 0) {
            continue;
        }

        combined.set(id, {
            ...product,
            ...current,
            score: product.score,
            textScore,
            vectorScore: Number(product.score || 0),
        });
    }

    return Array.from(combined.values())
        .map((product) => {
            const hasVector = product.vectorScore > 0;
            const hybridScore = hasVector
                ? (0.6 * Number(product.textScore || 0)) + (0.4 * Number(product.vectorScore || 0))
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

async function resolveChatSession(sessionId, userId, isAdmin = false) {
    const isValidSession = mongoose.Types.ObjectId.isValid(sessionId);
    let session = null;

    if (isValidSession) {
        const filters = { _id: sessionId, isAdmin };
        if (userId) filters.userId = userId;
        session = await ChatSessionModel.findOne(filters);
    }

    const inactiveTooLong = session?.updatedAt && (Date.now() - new Date(session.updatedAt).getTime() > SESSION_IDLE_LIMIT);

    if (!session || inactiveTooLong) {
        session = await ChatSessionModel.create({
            userId: userId || null,
            isAdmin,
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

// ──── Catalog context for chatbot ────────────────────────────────────────────
let catalogCache = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getStoreCatalogContext() {
    if (catalogCache && Date.now() - catalogCacheTime < CATALOG_CACHE_TTL) {
        return catalogCache;
    }

    const [totalProducts, categories, brands, saleProducts] = await Promise.all([
        ProductModel.countDocuments(),
        CategoryModel.find({ parentId: null }).select("name").lean(),
        ProductModel.distinct("brand"),
        ProductModel.countDocuments({ discount: { $gt: 0 } }),
    ]);

    const catNames = categories.map(c => c.name).filter(Boolean);
    const brandNames = brands.filter(Boolean).slice(0, 30);

    catalogCache = {
        totalProducts,
        categories: catNames,
        brands: brandNames,
        saleCount: saleProducts,
    };
    catalogCacheTime = Date.now();
    return catalogCache;
}

// ──── Keyword extraction for better search ───────────────────────────────────
const STOP_WORDS_VI = new Set([
    "có", "không", "nào", "gì", "cho", "của", "và", "hay", "hoặc", "tôi",
    "mình", "em", "anh", "chị", "bạn", "ơi", "nhé", "ạ", "à", "ừ",
    "vậy", "thì", "là", "được", "rồi", "đi", "với", "đang", "sẽ", "đã",
    "cái", "con", "chiếc", "bộ", "cặp", "đôi", "hàng", "sản", "phẩm",
    "muốn", "cần", "tìm", "kiếm", "xem", "mua", "thêm", "giỏ", "giá",
    "bao", "nhiêu", "tiền", "shop", "cửa", "hàng", "the", "is", "are",
    "what", "how", "can", "do", "you", "have", "any", "this", "that",
    "tìm", "kiếm", "giới", "thiệu", "gợi", "ý", "recommend", "suggest",
]);

function extractSearchKeywords(message) {
    const words = message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS_VI.has(w));
    return [...new Set(words)];
}

// ──── Smart product search for chatbot ───────────────────────────────────────
async function chatSearchProducts(message, limit = 10) {
    const isMostExpensive = /(đắt nhất|mắc nhất|giá cao nhất|giá khủng nhất|nhiều tiền nhất)/i.test(message);
    const isCheapest = /(rẻ nhất|giá rẻ nhất|giá thấp nhất|ít tiền nhất|bình dân nhất)/i.test(message);

    let priceSortedResults = [];
    if (isMostExpensive) {
        try {
            priceSortedResults = await ProductModel.find()
                .select(PRODUCT_SELECT)
                .sort({ price: -1 })
                .limit(limit)
                .lean();
        } catch (err) {
            console.warn("[AI Chat Search] Most expensive search failed:", err?.message);
        }
    } else if (isCheapest) {
        try {
            priceSortedResults = await ProductModel.find({ price: { $gt: 0 } })
                .select(PRODUCT_SELECT)
                .sort({ price: 1 })
                .limit(limit)
                .lean();
        } catch (err) {
            console.warn("[AI Chat Search] Cheapest search failed:", err?.message);
        }
    }

    const keywords = extractSearchKeywords(message);
    const searchQuery = keywords.join(" ");

    // 1. Hybrid search on full message (semantic + text)
    let hybridResults = [];
    try {
        hybridResults = await hybridSearchProducts(message, Math.ceil(limit * 0.7));
    } catch (err) {
        console.warn("[AI Chat Search] Hybrid failed:", err?.message);
    }

    // 2. Keyword-based text search for individual important words
    let keywordResults = [];
    if (keywords.length > 0) {
        const keywordRegexParts = keywords.map(w => escapeRegExp(w));
        const combinedRegex = new RegExp(keywordRegexParts.join("|"), "i");
        try {
            keywordResults = await ProductModel.find({
                $or: [
                    { name: combinedRegex },
                    { brand: combinedRegex },
                    { catName: combinedRegex },
                    { subCat: combinedRegex },
                    { thirdsubCat: combinedRegex },
                    { description: combinedRegex },
                ],
            })
                .select(PRODUCT_SELECT)
                .limit(limit)
                .lean();
        } catch (err) {
            console.warn("[AI Chat Search] Keyword search failed:", err?.message);
        }
    }

    // 3. Merge and deduplicate results, preferring price-sorted, then hybrid, then keyword scores
    const merged = new Map();
    for (const p of priceSortedResults) {
        merged.set(p._id.toString(), { ...p, source: "price_sorted" });
    }
    for (const p of hybridResults) {
        const id = p._id.toString();
        if (!merged.has(id)) {
            merged.set(id, { ...p, source: "hybrid" });
        }
    }
    for (const p of keywordResults) {
        const id = p._id.toString();
        if (!merged.has(id)) {
            merged.set(id, { ...p, source: "keyword" });
        }
    }

    return Array.from(merged.values()).slice(0, limit);
}

// ──── Extract product IDs directly from AI-generated links (/product/ID) ─────
function extractLinkedProductIds(aiText) {
    const ids = [];
    const seen = new Set();
    // Match markdown links like [Name](/product/ID) or plain /product/ID
    const regex = /\/product\/([a-f0-9]{24})/gi;
    let match;
    while ((match = regex.exec(aiText)) !== null) {
        const id = match[1];
        if (!seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }
    return ids;
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
        const session = await resolveChatSession(sessionId, userId, false);
        const recentMessages = (session.messages || []).slice(-10);
        const user = userId ? await UserModel.findById(userId).select("name email").lean() : null;
        const userName = user?.name || "bạn";
        const orderIntent = detectOrderIntent(message);

        // Parallel fetch: orders, products, catalog, and compact featured products list
        const [orderContext, relevantProducts, catalog, featuredProducts] = await Promise.all([
            getRecentOrderContext(userId, orderIntent),
            chatSearchProducts(message, 10),
            getStoreCatalogContext(),
            ProductModel.find({ $or: [{ isFeatured: true }, { isNew: true }] })
                .select("name price countInStock catName brand discount images")
                .limit(15)
                .lean(),
        ]);

        const { orderSummary, latestOrderStatus } = orderContext;

        // Get product IDs from recent orders to include their details in candidate list
        const orderProductIds = [];
        if (userId) {
            const orders = await OrderModel.find({ userId })
                .sort({ createdAt: -1 })
                .limit(orderIntent ? 5 : 3)
                .select("products")
                .lean();
            for (const order of orders) {
                for (const item of order.products || []) {
                    if (item.productId) {
                        orderProductIds.push(item.productId.toString());
                    }
                }
            }
        }

        let orderRelatedProducts = [];
        if (orderProductIds.length > 0) {
            orderRelatedProducts = await ProductModel.find({ _id: { $in: orderProductIds } })
                .select(PRODUCT_SELECT)
                .lean();
        }

        // Combine and deduplicate – add least-detailed first so full-detail overrides
        const candidateMap = new Map();
        for (const p of featuredProducts) {
            candidateMap.set(p._id.toString(), p);
        }
        for (const p of relevantProducts) {
            candidateMap.set(p._id.toString(), p);
        }
        for (const p of orderRelatedProducts) {
            candidateMap.set(p._id.toString(), p);
        }
        const candidateProducts = Array.from(candidateMap.values());

        // Build a strict product reference table for the AI
        const productContext = candidateProducts.length > 0
            ? candidateProducts.map((product, index) => {
                const inStock = product.countInStock > 0 ? "Còn hàng" : "Hết hàng";
                const sizeInfo = product.size?.length > 0 ? `Phiên bản: ${product.size.join(", ")}` : "";
                return `[SP${index + 1}]
ID: ${product._id}
Tên: ${product.name}
Giá: ${Number(product.price || 0).toLocaleString("vi-VN")}đ${product.discount > 0 ? ` (giảm ${product.discount}%)` : ""}
Danh mục: ${product.catName || ""} > ${product.subCat || ""}${product.thirdsubCat ? ` > ${product.thirdsubCat}` : ""}
Thương hiệu: ${product.brand || "N/A"}
Đánh giá: ${product.rating || 0}/5
Tình trạng: ${inStock}${sizeInfo ? `\n${sizeInfo}` : ""}
Mô tả: ${String(product.description || "").slice(0, 200)}`;
            }).join("\n\n")
            : "Không tìm thấy sản phẩm phù hợp trong kho.";

        // Build product ID lookup table for the AI to reference
        const idTable = candidateProducts.map((p, i) => `SP${i + 1} = ${p.name} → ID: ${p._id}`).join("\n");

        // Format compact shop featured product summary
        const featuredSummary = featuredProducts.map((p, i) => {
            return `${i+1}. ${p.name} - Giá: ${p.price.toLocaleString("vi-VN")}đ - Tồn kho: ${p.countInStock} - ID: ${p._id} - Cat: ${p.catName || "N/A"} - Brand: ${p.brand || "N/A"}${p.discount > 0 ? ` (giảm ${p.discount}%)` : ""}`;
        }).join("\n");

        const systemPrompt = `
Bạn là trợ lý ảo thông minh, thân thiện của cửa hàng **Merch4u** — chuyên bán merchandise K-pop, anime, game.

THÔNG TIN CỬA HÀNG:
- Tổng sản phẩm: ${catalog.totalProducts}
- Danh mục chính: ${catalog.categories.join(", ")}
- Thương hiệu nổi bật: ${catalog.brands.slice(0, 15).join(", ")}
- Sản phẩm đang giảm giá: ${catalog.saleCount} sản phẩm

DANH SÁCH SẢN PHẨM NỔI BẬT CỦA CỬA HÀNG (Sử dụng danh sách này để giới thiệu khi khách muốn tìm đồ hot, sản phẩm mới/nổi bật hoặc gợi ý chung chung):
${featuredSummary}

THÔNG TIN KHÁCH HÀNG:
- Tên: ${userName}
- Lịch sử mua hàng gần đây:
${orderSummary}

${latestOrderStatus ? `TRẠNG THÁI ĐƠN HÀNG GẦN NHẤT:\n${latestOrderStatus}` : ""}

BẢNG TRA CỨU SẢN PHẨM KHỚP VỚI CÂU HỎI (BẮT BUỘC dùng ID bên dưới khi giới thiệu các sản phẩm này):
${idTable}

CHI TIẾT SẢN PHẨM LIÊN QUAN:
${productContext}

QUY TẮC BẮT BUỘC (MẤT ĐIỂM NẾU VI PHẠM):
1. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dễ hiểu.
2. **QUAN TRỌNG NHẤT**: Khi giới thiệu bất kỳ sản phẩm nào có trong danh sách cửa hàng, BẮT BUỘC dùng link Markdown dạng [Tên sản phẩm](/product/ID).
   - Tên sản phẩm trong link PHẦI ĐÚNG với tên sản phẩm thực tế.
   - ID trong link PHẦI ĐÚNG với ID của sản phẩm đó.
   - VÍ DỤ ĐÚNG: [Áo BTS Map](/product/6789abc)
   - TUYỆT ĐỐI KHÔNG được bịa ID hoặc viết sai đường dẫn.
   - **BẮT BUỘC - NGOẠC VUÔNG TRONG TÊN SẢN PHẨM**: Tên sản phẩm trong dữ liệu hệ thống có thể chứa dấu ngoặc vuông (ví dụ: 'Sweatshirt [THE POWERPUFF GIRLS x NJ]'). Khi đưa tên này vào link Markdown, bạn **BẮT BUỘC** phải đổi tất cả dấu ngoặc vuông '[' và ']' trong tên thành dấu ngoặc đơn '(' và ')' để tránh làm hỏng hiển thị và cấu trúc link.
     * Ví dụ đúng: '[NewJeans - Sweatshirt (THE POWERPUFF GIRLS x NJ)](/product/69b133e402f21752bfbe2c0f)'
     * Ví dụ sai: '[NewJeans - Sweatshirt [THE POWERPUFF GIRLS x NJ]](/product/69b133e402f21752bfbe2c0f)' hoặc '[POWERPUFF GIRLS x NJ](/product/...)]'
   - **BẮT BUỘC - ĐÁNH SỐ THỨ TỰ (LIST NUMBERING)**: Khi tạo danh sách số (ví dụ: 1., 2., 3.), số thứ tự và dấu chấm **BẮT BUỘC** phải nằm **ngoài** dấu ngoặc vuông của link Markdown.
     * Ví dụ đúng: '1. [BTS - T-Shirt (Arirang)](/product/xyz)'
     * Ví dụ sai: '[1. BTS - T-Shirt (Arirang)](/product/xyz)'
3. CHỈ giới thiệu sản phẩm có thực trong danh sách trên. Không tự bịa sản phẩm, giá cả hay tồn kho.
4. **HÀNG RÀO BẢO VỆ (GUARDRAIL) & GIỚI THIỆU BẢN THÂN**:
   - Khi nhận được các câu hỏi chung xã giao (ví dụ: "chào bạn", "bạn khỏe không"), hãy trả lời lịch sự, thân thiện và khéo léo gợi ý khách mua sắm.
   - **GIỚI THIỆU BẢN THÂN & CÔNG NGHỆ (KHI ĐƯỢC HỎI)**: Nếu khách hàng hoặc ban giám khảo hỏi bạn là ai, mục tiêu sử dụng của bạn là gì, các chức năng chính của bạn, hoặc công nghệ xây dựng nên bạn/dự án này: Hãy tự tin trả lời đầy đủ bằng tiếng Việt rằng bạn là **Trợ lý ảo thông minh (AI Chatbot) của Merch4u**, được xây dựng trên nền tảng **Node.js, React** và tích hợp mô hình ngôn ngữ lớn tiên tiến nhất là **Gemini 2.5 Flash** cùng kỹ thuật **Vector Search / Hybrid Search (Tìm kiếm ngữ nghĩa kết hợp tìm kiếm từ khóa)** dựa trên cơ sở dữ liệu MongoDB. Chức năng chính của bạn là:
     * Hỗ trợ tìm kiếm sản phẩm thông minh và giải thích ngữ nghĩa bằng ngôn ngữ tự nhiên.
     * Gợi ý các sản phẩm cá nhân hóa phù hợp nhất với sở thích và lịch sử mua hàng của khách.
     * Kiểm tra nhanh trạng thái đơn hàng gần nhất (ví dụ: đang xử lý, đã giao) cho người dùng đã đăng nhập.
     * Giải đáp mọi thắc mắc về chính sách, danh mục và các sản phẩm hot của cửa hàng Merch4u.
   - Nếu khách hàng hỏi các câu hỏi hoàn toàn không liên quan đến cửa hàng, sản phẩm, idol K-pop/anime/game, chính sách hay đơn hàng, và KHÔNG PHẢI hỏi về bản thân bạn/công nghệ dự án (ví dụ: công thức nấu ăn, viết code, chính trị, địa lý...): Bạn **BẮT BUỘC phải lịch sự từ chối trả lời** và nhắc nhở khách rằng bạn là trợ lý ảo của Merch4u, chỉ hỗ trợ mua sắm và đơn hàng. Ví dụ: *"Xin lỗi bạn, mình là trợ lý ảo của Merch4u nên chỉ có thể hỗ trợ các thông tin về sản phẩm, đơn hàng hoặc chính sách của shop. Bạn có cần mình gợi ý sản phẩm nào của shop không?"*
5. Trả lời tối đa 3-5 sản phẩm phù hợp nhất, không liệt kê tràn lan.
`;

        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...recentMessages.map((item) => ({
                role: item.role === "ai" ? "model" : "user",
                parts: [{ text: item.text || "" }],
            })),
            { role: "user", parts: [{ text: message }] },
        ];

        // Graceful model fallback array: try primary model first, then fallback
        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let result = null;
        let activeModel = "";
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`[AI Chat] Attempting generateContentStream with model: ${modelName}`);
                result = await genAI.models.generateContentStream({
                    model: modelName,
                    contents,
                    config: {
                        temperature: 0.6,
                        maxOutputTokens: 1024,
                    },
                });
                activeModel = modelName;
                break;
            } catch (err) {
                console.warn(`[AI Chat] Model ${modelName} failed:`, err?.message || err);
                lastError = err;
            }
        }

        if (!result) {
            throw lastError || new Error("Không thể kết nối với dịch vụ AI lúc này. Vui lòng thử lại sau.");
        }

        // Set response headers only AFTER successfully establishing the AI generation stream
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");

        response.write(`data: ${JSON.stringify({ sessionId: session._id.toString() })}\n\n`);

        let aiText = "";

        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (chunkText) {
                aiText += chunkText;
                response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Extract product IDs directly from AI-generated /product/ID links
        // This guarantees cards match exactly the links shown in the text
        const linkedIds = extractLinkedProductIds(aiText);
        let cards = [];
        if (linkedIds.length > 0) {
            // First try to find in candidateProducts (already fetched)
            const candidateById = new Map(candidateProducts.map(p => [p._id.toString(), p]));
            const foundIds = [];
            const missingIds = [];
            for (const id of linkedIds.slice(0, 6)) {
                if (candidateById.has(id) && (candidateById.get(id).images?.length > 0)) {
                    foundIds.push(id);
                } else {
                    missingIds.push(id);
                }
            }

            // Fetch any linked products not in candidates (or missing images) directly from DB
            let dbFetched = new Map();
            if (missingIds.length > 0) {
                try {
                    const fetched = await ProductModel.find({
                        _id: { $in: missingIds.map(id => new mongoose.Types.ObjectId(id)) }
                    }).select(PRODUCT_SELECT).lean();
                    dbFetched = new Map(fetched.map(p => [p._id.toString(), p]));
                } catch (err) {
                    console.warn("[AI Chat] Fetch linked products failed:", err?.message);
                }
            }

            // Build cards in the same order as they appear in the AI text
            for (const id of linkedIds.slice(0, 6)) {
                const product = dbFetched.get(id) || candidateById.get(id);
                if (product) {
                    cards.push(chatProductCard(product));
                }
            }
        }
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
        const sessions = await ChatSessionModel.find({ userId: request.userId, isAdmin: false })
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
        const session = await ChatSessionModel.findOne({ _id: id, userId: request.userId, isAdmin: false }).lean();
        
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
        await ChatSessionModel.findOneAndDelete({ _id: id, userId: request.userId, isAdmin: false });
        
        return response.status(200).json({ error: false, success: true, message: "Đã xóa phiên chat" });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

export async function getAdminChatSessions(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const sessions = await ChatSessionModel.find({ userId: request.userId, isAdmin: true })
            .select("title updatedAt")
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();
            
        return response.status(200).json({ error: false, success: true, sessions });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

export async function getAdminChatSessionById(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const { id } = request.params;
        const session = await ChatSessionModel.findOne({ _id: id, userId: request.userId, isAdmin: true }).lean();
        
        if (!session) {
            return response.status(404).json({ error: true, message: "Không tìm thấy phiên chat" });
        }
        
        return response.status(200).json({ error: false, success: true, session });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

export async function deleteAdminChatSession(request, response) {
    try {
        if (!request.userId) {
            return response.status(401).json({ error: true, message: "Unauthorized" });
        }
        const { id } = request.params;
        await ChatSessionModel.findOneAndDelete({ _id: id, userId: request.userId, isAdmin: true });
        
        return response.status(200).json({ error: false, success: true, message: "Đã xóa phiên chat" });
    } catch (error) {
        return response.status(500).json({ error: true, message: error.message || error });
    }
}

function computeAdminStats(allOrders = [], allProducts = [], allUsers = [], couponsList = []) {
    // 1. Revenue: only count orders that are NOT "cancelled"
    const validOrders = allOrders.filter(o => o.order_status !== "cancelled");
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.totalAmt || 0), 0);

    // Month-over-month revenue comparison
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-11
    
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;

    for (const o of validOrders) {
        if (!o.createdAt) continue;
        const d = new Date(o.createdAt);
        const y = d.getFullYear();
        const m = d.getMonth();

        if (y === curYear && m === curMonth) {
            currentMonthRevenue += Number(o.totalAmt || 0);
        } else if (
            (curMonth === 0 && y === curYear - 1 && m === 11) ||
            (curMonth > 0 && y === curYear && m === curMonth - 1)
        ) {
            lastMonthRevenue += Number(o.totalAmt || 0);
        }
    }

    // 2. Orders by Status
    const totalOrdersCount = allOrders.length;
    const ordersByStatus = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of allOrders) {
        const status = String(o.order_status || 'pending').toLowerCase();
        if (ordersByStatus[status] !== undefined) {
            ordersByStatus[status]++;
        } else {
            ordersByStatus.pending++;
        }
    }

    // 3. Products & Inventory Value & Stocks breakdown
    const totalProductsCount = allProducts.length;
    let totalInventoryValue = 0;
    let totalItemsInStock = 0;
    const lowStockProducts = [];

    for (const p of allProducts) {
        const stock = Number(p.countInStock || 0);
        const price = Number(p.price || 0);
        totalInventoryValue += price * stock;
        totalItemsInStock += stock;

        if (stock <= 5) {
            lowStockProducts.push({
                name: p.name,
                stock,
                price
            });
        }
    }

    // Top 8 highest inventory stock count products
    const mostStockProducts = [...allProducts]
        .sort((a, b) => Number(b.countInStock || 0) - Number(a.countInStock || 0))
        .slice(0, 8)
        .map(p => ({
            name: p.name,
            stock: Number(p.countInStock || 0),
            price: Number(p.price || 0)
        }));

    // Top 8 highest total stock value products (price * stock)
    const highestValueProducts = [...allProducts]
        .sort((a, b) => (Number(b.price || 0) * Number(b.countInStock || 0)) - (Number(a.price || 0) * Number(a.countInStock || 0)))
        .slice(0, 8)
        .map(p => ({
            name: p.name,
            stock: Number(p.countInStock || 0),
            price: Number(p.price || 0),
            value: Number(p.price || 0) * Number(p.countInStock || 0)
        }));

    // Group count and stock by category
    const categoryStats = {};
    for (const p of allProducts) {
        const cat = p.catName || "N/A";
        if (!categoryStats[cat]) {
            categoryStats[cat] = { count: 0, stock: 0 };
        }
        categoryStats[cat].count++;
        categoryStats[cat].stock += Number(p.countInStock || 0);
    }

    // Group count and stock by brand
    const brandStats = {};
    for (const p of allProducts) {
        const brand = p.brand || "N/A";
        if (!brandStats[brand]) {
            brandStats[brand] = { count: 0, stock: 0 };
        }
        brandStats[brand].count++;
        brandStats[brand].stock += Number(p.countInStock || 0);
    }

    // 4. Best Selling Products
    const salesMap = new Map();
    for (const o of validOrders) {
        for (const item of o.products || []) {
            const pid = item.productId?.toString();
            if (!pid) continue;
            const existing = salesMap.get(pid) || { name: item.productTitle || "Sản phẩm", qty: 0, revenue: 0 };
            existing.qty += Number(item.quantity || 0);
            existing.revenue += Number(item.price || 0) * Number(item.quantity || 0);
            salesMap.set(pid, existing);
        }
    }

    const bestSellers = Array.from(salesMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 8);

    // 5. Users
    const totalUsersCount = allUsers.length;
    const usersByRole = { admin: 0, customer: 0 };
    for (const u of allUsers) {
        const role = String(u.role || 'USER').toUpperCase();
        if (['ADMIN', 'SUPERBOSS'].includes(role)) {
            usersByRole.admin++;
        } else {
            usersByRole.customer++;
        }
    }

    // 6. Coupons
    const totalCoupons = couponsList.length;
    const activeCoupons = couponsList.filter(c => c.isActive).map(c => c.code);

    return {
        totalRevenue,
        currentMonthRevenue,
        lastMonthRevenue,
        totalOrdersCount,
        ordersByStatus,
        totalProductsCount,
        totalInventoryValue,
        totalItemsInStock,
        lowStockProducts,
        mostStockProducts,
        highestValueProducts,
        categoryStats,
        brandStats,
        bestSellers,
        totalUsersCount,
        usersByRole,
        totalCoupons,
        activeCoupons
    };
}

export async function adminChatWithAI(request, response) {
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
        const session = await resolveChatSession(sessionId, userId, true);
        const recentMessages = (session.messages || []).slice(-10);
        const user = userId ? await UserModel.findById(userId).select("name email role").lean() : null;
        const userName = user?.name || "Quản trị viên";
        
        // Parallel queries to construct the administrative snapshot with full raw details
        const [
            allOrders,
            allProducts,
            allUsers,
            couponsList,
            slidersList
        ] = await Promise.all([
            OrderModel.find()
                .select("totalAmt order_status payment_status createdAt products.productId products.productTitle products.quantity products.price")
                .lean(),
            ProductModel.find()
                .select("name price countInStock catName brand rating")
                .lean(),
            UserModel.find()
                .select("name email role createdAt")
                .lean(),
            CouponModel.find().lean(),
            HomeSliderModel.find().lean()
        ]);

        // 20 orders in full details
        const recentOrdersData = allOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20)
            .map(o => ({
                id: o.paymentId || o._id.toString(),
                status: o.order_status,
                payment: o.payment_status,
                total: Number(o.totalAmt || 0),
                date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : "N/A",
                items: (o.products || []).map(p => ({ title: p.productTitle, qty: p.quantity, price: p.price }))
            }));

        // Compact list of all orders for fast search/referencing
        const allOrdersCompact = allOrders.map(o => ({
            id: o.paymentId || o._id.toString(),
            status: o.order_status,
            total: Number(o.totalAmt || 0),
            date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : "N/A"
        }));

        const productsData = allProducts.map(p => ({
            id: p._id.toString(),
            name: p.name,
            price: Number(p.price || 0),
            stock: Number(p.countInStock || 0),
            cat: p.catName || "N/A",
            brand: p.brand || "N/A",
            rating: p.rating || 0
        }));

        const usersData = allUsers.map(u => ({
            name: u.name,
            email: u.email,
            role: u.role || "USER",
            date: u.createdAt ? u.createdAt.toISOString().split('T')[0] : "N/A"
        }));

        const stats = computeAdminStats(allOrders, allProducts, allUsers, couponsList);

        const systemPrompt = `
Bạn là trợ lý AI đặc quyền cao cấp (Co-pilot) dành riêng cho Quản trị viên của **Merch4u**.
Bạn được cung cấp BÁO CÁO THỐNG KÊ DOANH THU, TỒN KHO VÀ ĐƠN HÀNG và dữ liệu hệ thống bên dưới để hỗ trợ sếp.
Hãy sử dụng trực tiếp các số liệu thống kê đã tính toán sẵn này để trả lời sếp thay vì tự tính toán lại.

SỐ LIỆU THỐNG KÊ KINH DOANH CHÍNH XÁC:
- Tổng doanh thu thực tế (đơn hàng thành công/khác cancelled): ${stats.totalRevenue.toLocaleString("vi-VN")}đ
- Doanh thu tháng này: ${stats.currentMonthRevenue.toLocaleString("vi-VN")}đ
- Doanh thu tháng trước: ${stats.lastMonthRevenue.toLocaleString("vi-VN")}đ
- Tổng số đơn hàng: ${stats.totalOrdersCount} đơn (Đang xử lý: ${stats.ordersByStatus.pending}, Đang giao: ${stats.ordersByStatus.shipped}, Thành công: ${stats.ordersByStatus.delivered}, Đã hủy: ${stats.ordersByStatus.cancelled})
- Tổng số sản phẩm trong kho: ${stats.totalProductsCount} mẫu
- Tổng số lượng hàng tồn: ${stats.totalItemsInStock} cái
- Tổng giá trị hàng tồn kho: ${stats.totalInventoryValue.toLocaleString("vi-VN")}đ
- Tổng số thành viên đăng ký: ${stats.totalUsersCount} người (Quản trị viên: ${stats.usersByRole.admin}, Khách hàng: ${stats.usersByRole.customer})
- Tổng số mã giảm giá: ${stats.totalCoupons} (Đang hoạt động: ${stats.activeCoupons.join(", ") || "Không có"})

DANH SÁCH SẢN PHẨM SẮP HẾT HÀNG (TỒN KHO <= 5):
${stats.lowStockProducts.map(p => `- ${p.name} (Tồn: ${p.stock}, Giá: ${p.price.toLocaleString("vi-VN")}đ)`).join("\n") || "Không có sản phẩm nào sắp hết hàng."}

TOP SẢN PHẨM CÓ TỒN KHO NHIỀU NHẤT (Sử dụng để trả lời khi sếp hỏi sản phẩm nào tồn nhiều nhất hoặc cần xả hàng):
${stats.mostStockProducts.map((p, idx) => `${idx + 1}. ${p.name} (Tồn kho: ${p.stock} chiếc, Giá: ${p.price.toLocaleString("vi-VN")}đ)`).join("\n") || "Chưa có dữ liệu."}

TOP SẢN PHẨM CÓ GIÁ TRỊ TỒN KHO LỚN NHẤT (Giá trị tồn = Tồn kho * Giá):
${stats.highestValueProducts.map((p, idx) => `${idx + 1}. ${p.name} (Tồn: ${p.stock}, Giá: ${p.price.toLocaleString("vi-VN")}đ -> Tổng giá trị tồn: ${p.value.toLocaleString("vi-VN")}đ)`).join("\n") || "Chưa có dữ liệu."}

THỐNG KÊ TỒN KHO THEO DANH MỤC:
${Object.entries(stats.categoryStats).map(([cat, info]) => `- Danh mục "${cat}": ${info.count} mẫu sản phẩm, tổng tồn kho ${info.stock} chiếc`).join("\n")}

THỐNG KÊ TỒN KHO THEO THƯƠNG HIỆU:
${Object.entries(stats.brandStats).map(([brand, info]) => `- Thương hiệu "${brand}": ${info.count} mẫu sản phẩm, tổng tồn kho ${info.stock} chiếc`).join("\n")}

TOP SẢN PHẨM BÁN CHẠY NHẤT:
${stats.bestSellers.map((p, idx) => `${idx + 1}. ${p.name} - Đã bán: ${p.qty} cái - Doanh thu: ${p.revenue.toLocaleString("vi-VN")}đ`).join("\n") || "Chưa có dữ liệu bán hàng."}

DANH SÁCH 20 ĐƠN HÀNG GẦN NHẤT CHI TIẾT:
${JSON.stringify(recentOrdersData)}

DANH SÁCH TẤT CẢ ĐƠN HÀNG TRÊN HỆ THỐNG (ĐỂ TRA CỨU):
${JSON.stringify(allOrdersCompact)}

DANH SÁCH SẢN PHẨM TRÊN HỆ THỐNG:
${JSON.stringify(productsData)}

DANH SÁCH THÀNH VIÊN ĐĂNG KÝ:
${JSON.stringify(usersData)}

DANH SÁCH MÃ GIẢM GIÁ (COUPONS):
${JSON.stringify(couponsList.map(c => ({ code: c.code, discount: c.discount, type: c.type, active: c.isActive, used: c.usedCount || 0 })))}

CẤU HÌNH BANNER/SLIDER TRANG CHỦ:
${JSON.stringify(slidersList.map(s => ({ title: s.title || "Slider", visible: s.isVisible, imagesCount: s.images?.length || 0 })))}

ĐƯỜNG DẪN DI CHUYỂN NHANH (BẮT BUỘC dùng khi sếp cần quản lý):
- Trang tổng quan (Dashboard): [/](/)
- Quản lý Sản phẩm (Danh sách sản phẩm): [/products](/products)
- Quản lý Mã giảm giá (Coupons): [/coupons](/coupons)
- Quản lý Slider/Banner: [/homeSlider/list](/homeSlider/list)
- Quản lý Danh mục (Category): [/category/list](/category/list)
- Quản lý Danh mục con (Sub Category): [/subCategory/list](/subCategory/list)
- Quản lý Người dùng/Thành viên (Users): [/users](/users)
- Quản lý Đơn hàng (Orders): [/orders](/orders)
- Hồ sơ Admin: [/profile](/profile)
- Thiết lập Logo: [/logo/manage](/logo/manage)
- Quản lý Banner Phải: [/rightBanner/list](/rightBanner/list)
- Quản lý Bài viết/Blogs: [/blog/List](/blog/List)

QUY TẮC PHẢN HỒI BẮT BUỘC (MẤT ĐIỂM NẾU VI PHẠM):
1. **Xưng hô**: Sử dụng ngôn ngữ vô cùng lịch sự, tôn trọng sếp ("Chào sếp", "Tôi đã tính toán...", "Hệ thống ghi nhận...", "Tôi đề xuất sếp...").
2. **Tính toán chính xác**: Sử dụng các số liệu thống kê được tính sẵn ở trên để trả lời trực tiếp sếp, không tự bịa ra thông số giả.
3. **Trực quan hóa**:
   - Khi hiển thị danh sách, bảng thống kê dữ liệu so sánh, doanh thu, tồn kho... BẮT BUỘC sử dụng Markdown Tables (Bảng) để sếp dễ quan sát.
   - **QUAN TRỌNG**: Khi tạo bảng Markdown, hãy sử dụng đường phân cách cực kỳ ngắn gọn (ví dụ: '|---|---|'), TUYỆT ĐỐI không lặp lại dấu gạch ngang kéo dài để căn chỉnh cột. Không dùng quá 5 dấu gạch ngang cho mỗi cột trong dòng phân cách.
   - **GIỚI HẠN DỮ LIỆU**: Khi hiển thị danh sách đơn hàng hoặc sản phẩm gần đây, chỉ hiển thị tối đa 5-8 dòng/đối tượng tiêu biểu hoặc mới nhất trong bảng. Không liệt kê tràn lan toàn bộ danh sách để tránh phản hồi bị cắt ngắn giữa chừng.
   - Dùng thêm các emoji phù hợp (💰 doanh thu, 📦 đơn hàng, ⚠️ cảnh báo tồn kho, 🎫 mã giảm giá).
4. **Liên kết nhanh**: Khi nhắc đến việc quản trị, sửa đổi hoặc thêm mới (ví dụ đơn hàng, sản phẩm, slider, danh mục, người dùng...), hãy đính kèm liên kết Markdown di chuyển nhanh ở trên để sếp click là chuyển trang ngay lập tức. Ví dụ: "Sếp có thể quản lý trực tiếp các đơn hàng tại [Quản lý Đơn hàng](/orders)".
5. **Hành động & Phân tích**: Chủ động đưa ra lời khuyên hoặc cảnh báo hữu ích cho sếp (Ví dụ: "Sản phẩm A đang bán chạy nhất với số lượng X đơn, sếp nên nhập thêm vì tồn kho hiện tại chỉ còn Y chiếc").
6. **HÀNG RÀO BẢO VỆ (GUARDRAIL) & GIỚI THIỆU BẢN THÂN**:
   - **GIỚI THIỆU BẢN THÂN & CÔNG NGHỆ (KHI ĐƯỢC HỎI)**: Nếu sếp hoặc ban giám khảo hỏi mục tiêu sử dụng của bạn, bạn giúp được gì, hoặc công nghệ xây dựng nên bạn/dự án này: Hãy trả lời vô cùng chuyên nghiệp và tự hào rằng bạn là **Trợ lý AI đặc quyền cao cấp (Co-pilot) dành riêng cho Quản trị viên của Merch4u**, được tích hợp mô hình AI tiên tiến **Gemini 2.5 Flash** cùng dữ liệu thời gian thực được đồng bộ từ MongoDB. Bạn được thiết kế để hỗ trợ Admin trong việc:
     * Quét toàn bộ kho dữ liệu hệ thống (sản phẩm, đơn hàng, khách hàng, coupon, banner) để phân tích và thống kê theo yêu cầu.
     * Tính toán chính xác doanh thu thực tế, doanh thu theo tháng, và so sánh hiệu quả kinh doanh.
     * Báo cáo chi tiết tình hình tồn kho: sản phẩm sắp hết hàng, top sản phẩm tồn nhiều nhất để xả kho, top sản phẩm có giá trị tồn kho lớn nhất, thống kê tồn kho theo danh mục/thương hiệu.
     * Tra cứu nhanh 20 đơn hàng gần nhất cũng như thông tin khách hàng đăng ký.
     * Cung cấp các đường liên kết di chuyển nhanh đến tất cả các trang quản trị để sếp truy cập ngay tức khắc.
   - Nếu sếp hỏi các câu hỏi không liên quan đến quản lý, thống kê hay vận hành cửa hàng Merch4u, và KHÔNG PHẢI hỏi về bản thân bạn/công nghệ dự án (ví dụ: công thức nấu ăn, viết thơ, lập trình...): Hãy khéo léo từ chối và nhắc nhở sếp rằng nhiệm vụ của bạn là làm trợ lý Co-pilot hỗ trợ quản trị và thống kê kinh doanh cho cửa hàng Merch4u.
7. Chỉ trả lời dựa trên dữ liệu hệ thống cung cấp ở trên, không tự bịa ra thông số giả.
8. **BẮT BUỘC - XỬ LÝ LIÊN KẾT SẢN PHẨM**: Khi dẫn link đến sản phẩm, luôn dùng dạng '[Tên sản phẩm](/product/ID)'. Hãy đổi tất cả dấu ngoặc vuông '[' và ']' trong tên sản phẩm thành dấu ngoặc đơn '(' và ')'. Ngoài ra, số thứ tự danh sách (ví dụ: 1., 2.) **phải** nằm **ngoài** dấu ngoặc của link Markdown (Ví dụ: '1. [Tên sản phẩm](/product/ID)').
`;


        const contents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...recentMessages.map((item) => ({
                role: item.role === "ai" ? "model" : "user",
                parts: [{ text: item.text || "" }],
            })),
            { role: "user", parts: [{ text: message }] },
        ];

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let result = null;
        let activeModel = "";
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Admin AI Chat] Attempting generateContentStream with model: ${modelName}`);
                result = await genAI.models.generateContentStream({
                    model: modelName,
                    contents,
                    config: {
                        temperature: 0.6,
                        maxOutputTokens: 2048,
                    },
                });
                activeModel = modelName;
                break;
            } catch (err) {
                console.warn(`[Admin AI Chat] Model ${modelName} failed:`, err?.message || err);
                lastError = err;
            }
        }

        if (!result) {
            throw lastError || new Error("Không thể kết nối với dịch vụ AI lúc này. Vui lòng thử lại sau.");
        }

        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");

        response.write(`data: ${JSON.stringify({ sessionId: session._id.toString() })}\n\n`);

        let aiText = "";

        for await (const chunk of result) {
            const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (chunkText) {
                aiText += chunkText;
                response.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        session.messages.push({ role: "user", text: message });
        session.messages.push({ role: "ai", text: aiText });
        if (session.messages.length > 30) {
            session.messages = session.messages.slice(-30);
        }

        if (session.messages.length <= 3 && (!session.title || session.title === 'New Chat')) {
            session.title = String(message).slice(0, 30) + (message.length > 30 ? '...' : '');
        }

        await session.save();

        response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        response.end();
    } catch (error) {
        console.error("[Admin AI Chat Error]", error?.message || error);

        if (!response.headersSent) {
            return response.status(500).json({
                error: true,
                message: `Lỗi AI: ${error?.message || "Lỗi không xác định"}`,
            });
        }

        response.write(`data: ${JSON.stringify({ error: error?.message || "AI đang bận, vui lòng thử lại sau!" })}\n\n`);
        response.end();
    }
}
