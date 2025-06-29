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
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    // Get all chats where the user is a participant
    const conversations = await Chat.find({ participants: userId })
      .populate('participants', 'id username avatar email')
      .populate({ path: 'messages', options: { sort: { createdAt: -1 }, limit: 1 } });
    const formattedConversations = conversations.map(conversation => {
      const otherUser = conversation.participants.find(u => u.id !== userId);
      return {
        id: conversation._id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.messages[0]?.content || '',
        propertyId: conversation.propertyId,
        otherUser: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          email: otherUser.email,
        } : null,
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
    const { userId: otherUserId, propertyId } = req.body;
    const currentUserId = req.user.id;

    // Don't allow creating a conversation with yourself
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }

    // Check if users exist
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      console.error(`❌ Current user not found: ${currentUserId}`);
      return res.status(404).json({ message: 'Current user not found' });
    }
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      console.error(`❌ Other user not found: ${otherUserId}`);
      return res.status(404).json({ message: 'Other user not found' });
    }

    // Check if conversation already exists (regardless of order)
    const propertyFilter = propertyId ? { propertyId } : {};
    const existingConversation = await Chat.findOne({
      $or: [
        { user1Id: currentUserId, user2Id: otherUserId },
        { user1Id: otherUserId, user2Id: currentUserId }
      ],
      ...propertyFilter
    });

    if (existingConversation) {
      // Format response
      const otherUserData = existingConversation.user1Id.toString() === currentUserId
        ? existingConversation.user2Id
        : existingConversation.user1Id;
      return res.status(200).json({
        id: existingConversation._id,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
        propertyId: existingConversation.propertyId,
        otherUser: {
          id: otherUserData._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          email: otherUser.email,
        }
      });
    }

    // Create new conversation
    const newConversation = await Chat.create({
      user1Id: currentUserId,
      user2Id: otherUserId,
      ...(propertyId ? { propertyId } : {}),
      user1Unread: 0,
      user2Unread: 0,
      lastMessage: null
    });

    res.status(201).json({
      id: newConversation._id,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
      propertyId: newConversation.propertyId,
      otherUser: {
        id: otherUser._id,
        username: otherUser.username,
        avatar: otherUser.avatar,
        email: otherUser.email,
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
    const conversation = await Chat.findById(chatId).populate('participants');
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Get messages
    const messages = await Message.find({ conversationId: chatId })
      .populate('sender', 'id username avatar')
      .sort({ createdAt: 'asc' });
    
    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message._id,
      chatId: message.conversationId,
      content: message.content,
      senderId: message.sender.id,
      sender: message.sender,
      createdAt: message.createdAt
    }));
    
    // Mark messages as read
    if (conversation.participants.find(u => u.id.toString() === userId) && conversation.user1Unread > 0) {
      await Chat.findByIdAndUpdate(chatId, { user1Unread: 0 });
    } else if (conversation.participants.find(u => u.id.toString() === userId) && conversation.user2Unread > 0) {
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
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Verify user is part of the conversation
    const conversation = await Chat.findById(chatId).populate('participants');
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Determine recipient ID
    const recipientId = conversation.participants.find(u => u.id.toString() !== senderId).id;
    
    // Create message
    const message = await Message.create({
      content,
      senderId,
      conversationId: chatId
    });
    
    // Update conversation
    await Chat.findByIdAndUpdate(chatId, {
      updatedAt: new Date(),
      // Increment unread count for the recipient
      user1Unread: senderId === conversation.participants[0].id ? { increment: 1 } : undefined,
      user2Unread: senderId === conversation.participants[1].id ? { increment: 1 } : undefined,
      lastMessage: content
    });
    
    res.status(201).json({
      id: message._id,
      chatId,
      content,
      senderId,
      sender: message.sender,
      createdAt: message.createdAt
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
