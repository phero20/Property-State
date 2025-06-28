import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// This would use the same chats array from chat.controller.js
// In production, you'd import from a shared data service or database

// Import the chats array (in production, this would be a database query)
let chats = [];

export const addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    // Find the chat in the database
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    // Check if user is participant
    if (!chat.participants.map(id => id.toString()).includes(userId)) {
      return res.status(403).json({ message: "Not authorized to send message to this chat" });
    }
    // Create new message
    const newMessage = await Message.create({
      chat: chatId,
      sender: userId,
      content: text,
    });
    // Add message to chat
    chat.messages.push(newMessage._id);
    chat.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error adding message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};
