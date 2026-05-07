import express from 'express';
import { chatWithAI, getAIRecommendations } from '../controllers/ai.controller.js';
import auth from '../middlewares/auth.js';

const aiRouter = express.Router();

/**
 * POST /api/ai/chat
 * Chat AI cá nhân hóa với Streaming SSE
 * Yêu cầu: Bearer token (auth middleware)
 * Body: { message: string }
 */
aiRouter.post('/chat', auth, chatWithAI);

/**
 * GET /api/ai/recommendations
 * Gợi ý sản phẩm cá nhân hóa theo lịch sử mua hàng
 * Yêu cầu: Bearer token (auth middleware)
 */
aiRouter.get('/recommendations', auth, getAIRecommendations);

export default aiRouter;
