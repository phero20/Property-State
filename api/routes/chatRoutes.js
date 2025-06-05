const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Get all conversations for the user
router.get('/conversations', authMiddleware, chatController.getConversations);

// Create a new conversation
router.post('/', authMiddleware, chatController.createConversation);

// Get messages for a conversation
router.get('/:chatId/messages', authMiddleware, chatController.getMessages);

// Send a message in a conversation
router.post('/:chatId/messages', authMiddleware, chatController.sendMessage);

// Mark conversation as read
router.put('/:chatId/read', authMiddleware, chatController.markAsRead);

module.exports = router;