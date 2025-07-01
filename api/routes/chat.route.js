import express from "express";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log(`💬 Chat route accessed: ${req.method} ${req.path}`);
  next();
});

// All chat routes require authentication
router.use(verifyToken);

// Get all conversations for the current user
router.get("/conversations", getConversations);

// Create a new conversation
router.post("/",verifyToken, createConversation);

// Get messages for a conversation
router.get("/:chatId/messages", getMessages);

// Send a message in a conversation
router.post("/:chatId/messages", sendMessage);

// Mark a conversation as read
router.put("/:chatId/read", markAsRead);

// Delete a conversation
router.delete("/:chatId", deleteConversation);

export default router;
