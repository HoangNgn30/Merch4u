/**
 * seedEmbeddings.js
 * Chạy 1 lần duy nhất để tạo vector embeddings cho toàn bộ sản phẩm
 * hiện có trong MongoDB.
 *
 * Lệnh chạy từ thư mục server/:
 *   node scripts/seedEmbeddings.js
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import ProductModel from '../models/product.modal.js';
import connectDB from '../config/connectDb.js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Lấy vector embedding từ Gemini gemini-embedding-001
 * Output: 3072 chiều
 */
async function getEmbedding(text) {
    const result = await genAI.models.embedContent({
        model: 'gemini-embedding-001',
        contents: text,
    });
    return result.embeddings[0].values;
}

/**
 * Ngủ để tránh rate limit (60 req/min free tier)
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    await connectDB();
    console.log('✅ Kết nối MongoDB thành công');

    // Lấy toàn bộ sản phẩm chưa có embedding
    const products = await ProductModel.find({
        $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
    }).select('+embedding name description catName brand');

    console.log(`📦 Tổng sản phẩm cần tạo embedding: ${products.length}`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const text = `${p.name}. ${p.description}. Danh mục: ${p.catName || ''}. Brand: ${p.brand || ''}`;

        try {
            const embedding = await getEmbedding(text);
            await ProductModel.findByIdAndUpdate(p._id, { embedding });
            successCount++;
            console.log(`  [${i + 1}/${products.length}] ✅ ${p.name}`);
        } catch (err) {
            failCount++;
            console.error(`  [${i + 1}/${products.length}] ❌ ${p.name}: ${err.message}`);
        }

        // Rate limit: chờ 1s sau mỗi request (free tier: ~60/min)
        await sleep(1100);
    }

    console.log(`\n🏁 Hoàn thành! Thành công: ${successCount} | Thất bại: ${failCount}`);
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
});
