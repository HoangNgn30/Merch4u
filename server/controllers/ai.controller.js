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

const apiKey = process.env.GEMINI_API_KEY;
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

// ──── Extract product IDs mentioned in AI response ───────────────────────────
function extractMentionedProductIds(aiText, availableProducts) {
    const mentioned = new Set();
    for (const product of availableProducts) {
        const id = product._id?.toString?.() || String(product._id);
        // Check if the product ID appears in the AI text (as a link)
        if (aiText.includes(id)) {
            mentioned.add(id);
        }
    }
    return mentioned;
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

        // Parallel fetch: orders, products, catalog
        const [orderContext, relevantProducts, catalog] = await Promise.all([
            getRecentOrderContext(userId, orderIntent),
            chatSearchProducts(message, 10),
            getStoreCatalogContext(),
        ]);

        const { orderSummary, latestOrderStatus } = orderContext;

        // Build a strict product reference table for the AI
        const productContext = relevantProducts.length > 0
            ? relevantProducts.map((product, index) => {
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
        const idTable = relevantProducts.map((p, i) => `SP${i + 1} = ${p.name} → ID: ${p._id}`).join("\n");

        const systemPrompt = `
Bạn là trợ lý ảo thông minh, thân thiện của cửa hàng **Merch4u** — chuyên bán merchandise K-pop, anime, game.

THÔNG TIN CỬA HÀNG:
- Tổng sản phẩm: ${catalog.totalProducts}
- Danh mục chính: ${catalog.categories.join(", ")}
- Thương hiệu nổi bật: ${catalog.brands.slice(0, 15).join(", ")}
- Sản phẩm đang giảm giá: ${catalog.saleCount} sản phẩm

THÔNG TIN KHÁCH HÀNG:
- Tên: ${userName}
- Lịch sử mua hàng gần đây:
${orderSummary}

${latestOrderStatus ? `TRẠNG THÁI ĐƠN HÀNG GẦN NHẤT:\n${latestOrderStatus}` : ""}

BẢNG TRA CỨU SẢN PHẨM (sử dụng ĐÚNG ID bên dưới):
${idTable}

CHI TIẾT SẢN PHẨM:
${productContext}

QUY TẮC BẮT BUỘC:
1. Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dễ hiểu.
2. **QUAN TRỌNG NHẤT**: Khi giới thiệu sản phẩm, BẮT BUỘC dùng link Markdown dạng [Tên sản phẩm](/product/ID).
   - Tên sản phẩm trong link PHẢI ĐÚNG với tên trong BẢNG TRA CỨU.
   - ID trong link PHẢI ĐÚNG với ID trong BẢNG TRA CỨU.
   - VÍ DỤ ĐÚNG: nếu SP1 = "Áo BTS Map" với ID 6789abc → viết [Áo BTS Map](/product/6789abc)
   - TUYỆT ĐỐI KHÔNG được trộn tên sản phẩm này với ID sản phẩm khác.
3. CHỈ giới thiệu sản phẩm có trong BẢNG TRA CỨU phía trên. Không bịa sản phẩm, giá cả, tồn kho.
4. Nếu không tìm thấy sản phẩm phù hợp, hãy nói thật và gợi ý khách tìm kiếm với từ khóa khác hoặc duyệt danh mục.
5. Nếu hỏi về đơn hàng mà khách chưa đăng nhập hoặc không có dữ liệu, hãy nói rõ cần đăng nhập.
6. Trả lời tối đa 3-5 sản phẩm phù hợp nhất, không liệt kê tràn lan.
7. Khi khách hỏi chung chung (ví dụ "có gì mới không?", "sale gì?"), hãy giới thiệu sản phẩm từ context có discount > 0 hoặc isNew = true.
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

        // Only send product cards for products the AI actually mentioned (by ID)
        const mentionedIds = extractMentionedProductIds(aiText, relevantProducts);
        let cards;
        if (mentionedIds.size > 0) {
            cards = relevantProducts
                .filter(p => mentionedIds.has(p._id?.toString?.() || String(p._id)))
                .slice(0, 4)
                .map(chatProductCard);
        } else {
            // Fallback: send top 3 if AI didn't link any
            cards = relevantProducts.slice(0, 3).map(chatProductCard);
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
        
        // Parallel queries to construct the administrative snapshot
        const [
            totalOrders,
            ordersList,
            recentOrders,
            totalProducts,
            lowStockProducts,
            totalUsers,
            recentUsers,
            couponsList,
            slidersList
        ] = await Promise.all([
            OrderModel.countDocuments(),
            OrderModel.find({ order_status: { $ne: "cancelled" } }).select("totalAmt").lean(),
            OrderModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("userId", "name email")
                .lean(),
            ProductModel.countDocuments(),
            ProductModel.find({ countInStock: { $lte: 5 } })
                .select("name price countInStock")
                .limit(10)
                .lean(),
            UserModel.countDocuments(),
            UserModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("name email role createdAt")
                .lean(),
            CouponModel.find().lean(),
            HomeSliderModel.find().lean()
        ]);

        // Calculate total sales
        let totalSales = 0;
        for (const order of ordersList) {
            totalSales += Number(order.totalAmt || 0);
        }

        // Summary of recent orders
        const recentOrdersSummary = recentOrders.length > 0
            ? recentOrders.map((order) => {
                const customer = order.userId?.name || order.userId?.email || "Khách lẻ/Ẩn danh";
                return `- Đơn ${order.paymentId || order._id}: Khách ${customer} - ${Number(order.totalAmt || 0).toLocaleString("vi-VN")}đ [${order.order_status}] (${new Date(order.createdAt).toLocaleDateString("vi-VN")})`;
            }).join("\n")
            : "Chưa có đơn hàng nào.";

        // Summary of low stock products
        const lowStockSummary = lowStockProducts.length > 0
            ? lowStockProducts.map((p) => `- Product ID ${p._id}: **${p.name}** còn **${p.countInStock}** sản phẩm trong kho (Giá: ${Number(p.price || 0).toLocaleString("vi-VN")}đ)`).join("\n")
            : "Không có sản phẩm nào sắp hết hàng (tất cả > 5 chiếc).";

        // Summary of recent users
        const recentUsersSummary = recentUsers.length > 0
            ? recentUsers.map((u) => `- **${u.name}** (${u.email}) - Vai trò: ${u.role || "USER"} - Đăng ký ngày: ${new Date(u.createdAt).toLocaleDateString("vi-VN")}`).join("\n")
            : "Không có người dùng mới.";

        // Summary of coupons
        const couponsSummary = couponsList.length > 0
            ? couponsList.map((c) => `- Code: **${c.code}** (${c.type === "percent" ? `${c.discount}%` : `${Number(c.discount).toLocaleString("vi-VN")}đ`}) - Tình trạng: ${c.isActive ? "Đang hoạt động" : "Tắt"} - Đã dùng: ${c.usedCount || 0} lần`).join("\n")
            : "Chưa có mã giảm giá nào được tạo.";

        // Summary of homepage sliders
        const slidersSummary = slidersList.length > 0
            ? slidersList.map((s, idx) => `- Slider #${idx + 1}: ${s.images?.length || 0} ảnh - Trạng thái: ${s.isVisible ? "Hiển thị" : "Ẩn"}`).join("\n")
            : "Chưa cấu hình slider nào trên trang chủ.";

        const systemPrompt = `
Bạn là trợ lý AI đặc quyền cao cấp (Co-pilot) dành riêng cho Quản trị viên của **Merch4u**.
Bạn có quyền truy cập toàn bộ dữ liệu thống kê, doanh thu, đơn hàng, khách hàng, sản phẩm, và thiết lập của cửa hàng.

THỐNG KÊ THỜI GIAN THỰC CỦA HỆ THỐNG:
- **Doanh thu tổng cộng** (trừ đơn hủy): **${totalSales.toLocaleString("vi-VN")}đ**
- **Tổng số đơn hàng**: **${totalOrders}**
- **Tổng số sản phẩm**: **${totalProducts}**
- **Tổng số thành viên**: **${totalUsers}**

DANH SÁCH ĐƠN HÀNG MỚI NHẤT (5 đơn gần đây):
${recentOrdersSummary}

CẢNH BÁO TỒN KHO THẤP (Sản phẩm có tồn kho <= 5 chiếc):
${lowStockSummary}

DANH SÁCH THÀNH VIÊN ĐĂNG KÝ GẦN ĐÂY (5 thành viên gần đây):
${recentUsersSummary}

DANH SÁCH MÃ GIẢM GIÁ (COUPONS):
${couponsSummary}

CẤU HÌNH BANNER/SLIDER TRANG CHỦ:
${slidersSummary}

ĐƯỜNG DẪN DI CHUYỂN NHANH (BẮT BUỘC dùng khi admin cần quản lý):
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

QUY TẮC PHẢN HỒI BẮT BUỘC:
1. **Xưng hô**: Sử dụng ngôn ngữ vô cùng lịch sự, chuyên nghiệp, xem admin như sếp ("Chào sếp", "Chào Quản trị viên", "Tôi đã thống kê...", "Hệ thống ghi nhận...", "Tôi có thể giúp gì cho sếp ạ?").
2. **Trực quan hóa**:
   - Khi hiển thị dữ liệu so sánh, danh sách đơn hàng, thống kê doanh thu, tồn kho, BẮT BUỘC sử dụng Markdown Tables (Bảng) để sếp dễ nhìn và so sánh.
   - Sử dụng emoji phù hợp để làm báo cáo sinh động (Ví dụ: 💰 doanh thu, 📦 đơn hàng, ⚠️ cảnh báo tồn kho, 🎫 mã giảm giá).
3. **Liên kết nhanh**: Khi đề cập đến việc quản lý, sửa đổi hoặc thêm mới các mảng như đơn hàng, sản phẩm, slider, danh mục, người dùng... hãy chủ động đính kèm liên kết Markdown di chuyển nhanh ở trên để sếp click là chuyển trang ngay lập tức. Ví dụ: "Sếp có thể quản lý trực tiếp tại [Quản lý Đơn hàng](/orders)".
4. **Hành động & Phân tích**: 
   - Chủ động đưa ra lời khuyên hoặc cảnh báo cho sếp (Ví dụ: Sản phẩm X sắp hết hàng, khuyên sếp nên nhập thêm; hoặc mã giảm giá Y đã hết hạn).
   - Hãy là một trợ lý thông minh hỗ trợ sếp tối đa việc ra quyết định.
5. Chỉ trả lời dựa trên dữ liệu hệ thống cung cấp ở trên, không tự bịa ra thông số giả.
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
