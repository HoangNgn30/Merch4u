import express from "express";
import {
    chatWithAI,
    getAIRecommendations,
    getAISuggestions,
    getBoughtTogether,
    getSimilarProducts,
    semanticSearchController,
    getChatSessions,
    getChatSessionById,
    deleteChatSession
} from "../controllers/ai.controller.js";
import optionalAuth from "../middlewares/optionalAuth.js";

const aiRouter = express.Router();

aiRouter.post("/chat", optionalAuth, chatWithAI);
aiRouter.get("/search", optionalAuth, semanticSearchController);
aiRouter.get("/similar/:productId", optionalAuth, getSimilarProducts);
aiRouter.get("/bought-together/:productId", optionalAuth, getBoughtTogether);
aiRouter.get("/suggestions", optionalAuth, getAISuggestions);
aiRouter.get("/recommendations", optionalAuth, getAIRecommendations);

// Chat History Routes
aiRouter.get("/chat-sessions", optionalAuth, getChatSessions);
aiRouter.get("/chat-sessions/:id", optionalAuth, getChatSessionById);
aiRouter.delete("/chat-sessions/:id", optionalAuth, deleteChatSession);

export default aiRouter;
