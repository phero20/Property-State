import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Helper function to safely check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return /^[0-9a-fA-F]{24}$/.test(id);
  } catch (error) {
    return false;
  }
};

// Get all conversations for the current user
import mongoose from 'mongoose';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Find all chats where the user is either user1 or user2
    const conversations = await Chat.find({
      $or: [
        { user1Id: userObjectId },
        { user2Id: userObjectId }
      ]
    })
      .populate('user1Id', 'username avatar email')
      .populate('user2Id', 'username avatar email')
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map(conversation => {
      // Find the other user
      const otherUser = conversation.user1Id._id.toString() === userId
        ? conversation.user2Id
        : conversation.user1Id;

      return {
        id: conversation._id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.lastMessage || '',
        propertyId: conversation.propertyId,
        user: otherUser
          ? {
              id: otherUser._id,
              username: otherUser.username,
              avatar: otherUser.avatar,
              email: otherUser.email,
            }
          : null,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('❌ Error retrieving conversations:', error);
    res.status(500).json({ message: 'Failed to retrieve conversations' });
  }
};

// Create a new conversation with better error handling
export const createConversation = async (req, res) => {
  try {
    console.log('hit create chat',req.body)
    const {userId, propertyId} = req.body;
    const currentUserId = req.user.id;
    // Don't allow creating a conversation with yourself
    if (currentUserId === userId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }

    // Check if users exist
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      console.error(`❌ Current user not found: ${currentUserId}`);
      return res.status(404).json({ message: 'Current user not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ Other user not found: ${userId}`);
      return res.status(404).json({ message: 'Other user not found' });
    }

    // Check if conversation already exists (regardless of order)
    const propertyFilter = propertyId ? { propertyId } : {};
    const existingConversation = await Chat.findOne({
      $or: [
        { user1Id: currentUserId, user2Id: userId },
        { user1Id: userId, user2Id: currentUserId }
      ],
      ...propertyFilter
    });

    if (existingConversation) {
      // Determine the other participant's ID
      const otherUserId =
        existingConversation.user1Id.toString() === currentUserId
          ? existingConversation.user2Id
          : existingConversation.user1Id;

      // Fetch the other user's info
      const otherUser = await User.findById(otherUserId);

      return res.status(200).json({
        _id: existingConversation._id,
        id: existingConversation._id,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
        propertyId: existingConversation.propertyId,
        user: otherUser
          ? {
              id: otherUser._id,
              username: otherUser.username,
              avatar: otherUser.avatar,
              email: otherUser.email,
            }
          : null,
      });
    }

    // Create new conversation
    const newConversation = await Chat.create({
      user1Id: currentUserId,
      user2Id: userId,
      participants: [currentUserId, userId],
      ...(propertyId ? { propertyId } : {}),
      user1Unread: 0,
      user2Unread: 0,
      lastMessage: null
    });

    console.log('newConversation sending data response', newConversation._id,
    newConversation._id,
   newConversation.createdAt,
    newConversation.updatedAt,
 newConversation.propertyId,
      user._id,
      user.username,
        user.avatar,
        user.email)

    res.status(201).json({
      _id: newConversation._id,
      id: newConversation._id,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
      propertyId: newConversation.propertyId,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({ 
      message: 'Failed to create conversation',
      error: error.message
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Chat.findById(chatId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (
      conversation.user1Id.toString() !== userId &&
      conversation.user2Id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    // Get messages
    const messages = await Message.find({ conversationId: chatId })
      .populate('senderId', 'id username avatar')
      .sort({ createdAt: 'asc' });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message._id,
      chatId: message.conversationId,
      content: message.content,
      senderId: message.senderId.id,
      sender: message.senderId,
      createdAt: message.createdAt
    }));

    // Mark messages as read for the correct user
    if (conversation.user1Id.toString() === userId && conversation.user1Unread > 0) {
      await Chat.findByIdAndUpdate(chatId, { user1Unread: 0 });
    } else if (conversation.user2Id.toString() === userId && conversation.user2Unread > 0) {
      await Chat.findByIdAndUpdate(chatId, { user2Unread: 0 });
    }

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('❌ Error retrieving messages:', error);
    res.status(500).json({ message: 'Failed to retrieve messages' });
  }
};

// Send a message in a conversation
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    // Find the chat and verify the user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (
      chat.user1Id.toString() !== senderId &&
      chat.user2Id.toString() !== senderId
    ) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }
    // Create the message
    const message = await Message.create({
      content,
      senderId, // <-- use senderId, not sender
      conversationId: chatId
    });
    // Update chat: set lastMessage, increment unread for recipient
    let update = { lastMessage: content, updatedAt: new Date() };
    if (chat.user1Id.toString() === senderId) {
      update.user2Unread = (chat.user2Unread || 0) + 1;
    } else {
      update.user1Unread = (chat.user1Unread || 0) + 1;
    }
    await Chat.findByIdAndUpdate(chatId, update);
    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'id username avatar');
    res.status(201).json({
      id: populatedMessage._id,
      chatId: populatedMessage.conversationId,
      content: populatedMessage.content,
      senderId: populatedMessage.senderId.id,
      sender: populatedMessage.senderId,
      createdAt: populatedMessage.createdAt
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark conversation as read
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of the conversation
    const conversation = await Chat.findById(chatId).populate('participants');
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Update unread count
    if (conversation.participants.find(u => u.id.toString() === userId)) {
      await Chat.findByIdAndUpdate(chatId, { user1Unread: 0 });
    } else {
      await Chat.findByIdAndUpdate(chatId, { user2Unread: 0 });
    }
    
    res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    // Verify user is part of the conversation
    const conversation = await Chat.findById(chatId).populate('participants');
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Delete the conversation and its messages (cascade delete should handle messages)
    await Chat.findByIdAndDelete(chatId);
    
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};
