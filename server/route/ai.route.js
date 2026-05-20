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
    deleteChatSession,
    adminChatWithAI,
    getAdminChatSessions,
    getAdminChatSessionById,
    deleteAdminChatSession
} from "../controllers/ai.controller.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import auth, { authRole } from "../middlewares/auth.js";

const aiRouter = express.Router();

aiRouter.post("/chat", optionalAuth, chatWithAI);
aiRouter.post("/admin-chat", auth, authRole("ADMIN"), adminChatWithAI);
aiRouter.get("/search", optionalAuth, semanticSearchController);
aiRouter.get("/similar/:productId", optionalAuth, getSimilarProducts);
aiRouter.get("/bought-together/:productId", optionalAuth, getBoughtTogether);
aiRouter.get("/suggestions", optionalAuth, getAISuggestions);
aiRouter.get("/recommendations", optionalAuth, getAIRecommendations);

// Chat History Routes
aiRouter.get("/chat-sessions", optionalAuth, getChatSessions);
aiRouter.get("/chat-sessions/:id", optionalAuth, getChatSessionById);
aiRouter.delete("/chat-sessions/:id", optionalAuth, deleteChatSession);

// Admin Chat History Routes
aiRouter.get("/admin-chat-sessions", auth, authRole("ADMIN"), getAdminChatSessions);
aiRouter.get("/admin-chat-sessions/:id", auth, authRole("ADMIN"), getAdminChatSessionById);
aiRouter.delete("/admin-chat-sessions/:id", auth, authRole("ADMIN"), deleteAdminChatSession);

export default aiRouter;
