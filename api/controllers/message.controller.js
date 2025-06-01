import prisma from "../lib/prisma.js";

// This would use the same chats array from chat.controller.js
// In production, you'd import from a shared data service or database

// Import the chats array (in production, this would be a database query)
let chats = [];

export const addMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log("💬 Adding message to chat:", chatId, "from user:", userId);

    // Find the chat (in production, this would be a database query)
    const chatIndex = chats.findIndex((c) => c.id === chatId);

    if (chatIndex === -1) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const chat = chats[chatIndex];

    // Check if user is participant
    if (!chat.userIDs.includes(userId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to send message to this chat" });
    }

    // Create new message
    const newMessage = {
      id: `msg_${Date.now()}`,
      text: text,
      userId: userId,
      createdAt: new Date(),
    };

    // Add message to chat
    chat.messages.push(newMessage);
    chat.lastMessage = text;
    chat.seenBy = [userId]; // Reset seenBy to only include sender

    console.log("✅ Message added successfully");
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error adding message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};
