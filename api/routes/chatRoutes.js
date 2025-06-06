const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// Apply auth middleware to all chat routes
router.use(verifyToken);

// Get all conversations for the current user
router.get('/conversations', chatController.getConversations);

// Create a new conversation
router.post('/', chatController.createConversation);

// Get messages for a conversation
router.get('/:chatId/messages', chatController.getMessages);

// Send a message in a conversation
router.post('/:chatId/messages', chatController.sendMessage);

// Mark a conversation as read
router.put('/:chatId/read', chatController.markAsRead);

// Delete a conversation
router.delete('/:chatId', chatController.deleteConversation);

module.exports = router;