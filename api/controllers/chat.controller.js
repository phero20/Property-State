import { PrismaClient } from '@prisma/client';
import { ObjectId } from 'mongodb';

const prisma = new PrismaClient();

// Helper function to safely check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('👤 Fetching conversations for user:', userId);
    
    // Get all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            type: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Format conversations to include the other user
    const formattedConversations = conversations.map(conversation => {
      // Determine which user is the "other" user
      const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
      
      return {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessage: conversation.messages[0]?.content || '',
        unreadCount: conversation.user1Id === userId 
          ? conversation.user1Unread 
          : conversation.user2Unread,
        propertyId: conversation.propertyId,
        property: conversation.property,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          email: otherUser.email,
          fullName: otherUser.fullName || otherUser.username
        }
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
    console.log('📤 Request body:', req.body);
    console.log('🔑 Auth user:', req.user);
    
    const { userId: otherUserId, propertyId } = req.body;
    const currentUserId = req.user.id;
    
    console.log(`🔄 Creating conversation between ${currentUserId} and ${otherUserId}`);
    
    // Don't allow creating a conversation with yourself
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }
    
    // Check if users exist
    const currentUser = await prisma.user.findUnique({ 
      where: { id: currentUserId } 
    });
    
    if (!currentUser) {
      console.error(`❌ Current user not found: ${currentUserId}`);
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    const otherUser = await prisma.user.findUnique({ 
      where: { id: otherUserId } 
    });
    
    if (!otherUser) {
      console.error(`❌ Other user not found: ${otherUserId}`);
      return res.status(404).json({ message: 'Other user not found' });
    }
    
    console.log('✅ Both users verified in database');
    
    // Get only the fields that definitely exist in the User model
    const userSelect = {
      id: true,
      username: true,
      email: true,
      avatar: true
      // fullName is removed
    };
    
    // Check if conversation already exists
    const propertyFilter = propertyId ? { propertyId } : {};
    
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUserId,
            user2Id: otherUserId,
            ...propertyFilter
          },
          {
            user1Id: otherUserId,
            user2Id: currentUserId,
            ...propertyFilter
          }
        ]
      },
      include: {
        user1: {
          select: userSelect
        },
        user2: {
          select: userSelect
        },
        property: propertyId ? {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            type: true
          }
        } : false
      }
    });
    
    if (existingConversation) {
      console.log('✅ Found existing conversation:', existingConversation.id);
      
      // Format response
      const otherUserData = existingConversation.user1Id === currentUserId 
        ? existingConversation.user2 
        : existingConversation.user1;
      
      return res.status(200).json({
        id: existingConversation.id,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
        propertyId: existingConversation.propertyId,
        property: existingConversation.property,
        otherUser: {
          id: otherUserData.id,
          username: otherUserData.username,
          avatar: otherUserData.avatar,
          email: otherUserData.email,
          fullName: otherUserData.username // Use username as fullName
        }
      });
    }
    
    // Create new conversation
    console.log('🔄 Creating new conversation with data:', {
      user1Id: currentUserId,
      user2Id: otherUserId,
      propertyId: propertyId || undefined
    });
    
    // Create new conversation with connect syntax
    const newConversation = await prisma.conversation.create({
      data: {
        user1: { connect: { id: currentUserId } },
        user2: { connect: { id: otherUserId } },
        ...(propertyId ? { property: { connect: { id: propertyId } } } : {}),
        user1Unread: 0,
        user2Unread: 0,
        lastMessage: null
      },
      include: {
        user1: {
          select: userSelect
        },
        user2: {
          select: userSelect
        },
        property: propertyId ? {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            type: true
          }
        } : false
      }
    });
    
    console.log('✅ Created new conversation:', newConversation.id);
    
    // Format response
    const otherUserData = newConversation.user1Id === currentUserId 
      ? newConversation.user2 
      : newConversation.user1;
    
    res.status(201).json({
      id: newConversation.id,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
      propertyId: newConversation.propertyId,
      property: newConversation.property,
      otherUser: {
        id: otherUserData.id,
        username: otherUserData.username,
        avatar: otherUserData.avatar,
        email: otherUserData.email,
        fullName: otherUserData.username // Use username as fullName
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
    
    console.log('🔄 Fetching messages for conversation:', chatId);
    
    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: chatId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    
    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      chatId: message.conversationId,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      createdAt: message.createdAt
    }));
    
    // Mark messages as read
    if (conversation.user1Id === userId && conversation.user1Unread > 0) {
      await prisma.conversation.update({
        where: { id: chatId },
        data: { user1Unread: 0 }
      });
    } else if (conversation.user2Id === userId && conversation.user2Unread > 0) {
      await prisma.conversation.update({
        where: { id: chatId },
        data: { user2Unread: 0 }
      });
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
    
    console.log('🔄 Sending message in conversation:', chatId);
    
    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: senderId },
          { user2Id: senderId }
        ]
      }
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Determine recipient ID
    const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
    
    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId: chatId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });
    
    // Update conversation
    await prisma.conversation.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        // Increment unread count for the recipient
        user1Unread: conversation.user1Id === recipientId ? { increment: 1 } : undefined,
        user2Unread: conversation.user2Id === recipientId ? { increment: 1 } : undefined,
        lastMessage: content
      }
    });
    
    res.status(201).json({
      id: message.id,
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
    
    console.log('🔄 Marking conversation as read:', chatId);
    
    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Update unread count
    if (conversation.user1Id === userId) {
      await prisma.conversation.update({
        where: { id: chatId },
        data: { user1Unread: 0 }
      });
    } else {
      await prisma.conversation.update({
        where: { id: chatId },
        data: { user2Unread: 0 }
      });
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
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: chatId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Delete the conversation and its messages (cascade delete should handle messages)
    await prisma.conversation.delete({
      where: { id: chatId }
    });
    
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};
