const { PrismaClient } = require('@prisma/client');
const { ObjectId } = require('mongodb');
const prisma = new PrismaClient();

// Helper function to safely check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  try {
    return ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
};

// Helper function to safely convert string to ObjectId
const toObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId:', id);
    return null;
  }
};

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
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

// Create a new conversation - Fixed version
exports.createConversation = async (req, res) => {
  try {
    const { userId: otherUserId, propertyId } = req.body;
    const currentUserId = req.user.id;
    
    console.log('👤 Creating conversation between', currentUserId, 'and', otherUserId);
    
    if (!isValidObjectId(currentUserId) || !isValidObjectId(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }
    
    // Don't allow creating a conversation with yourself
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }
    
    // Prepare property ID (null if not provided or invalid)
    const validPropertyId = propertyId && isValidObjectId(propertyId) ? propertyId : null;
    
    // Check if users exist
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    
    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'One or both users not found' });
    }
    
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUserId,
            user2Id: otherUserId,
            ...(validPropertyId ? { propertyId: validPropertyId } : {})
          },
          {
            user1Id: otherUserId,
            user2Id: currentUserId,
            ...(validPropertyId ? { propertyId: validPropertyId } : {})
          }
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
        property: validPropertyId ? {
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
          fullName: otherUserData.fullName || otherUserData.username
        }
      });
    }
    
    console.log('🔄 Creating new conversation in database');
    
    // Create new conversation with explicit data
    const newConversation = await prisma.conversation.create({
      data: {
        user1: { connect: { id: currentUserId } },
        user2: { connect: { id: otherUserId } },
        ...(validPropertyId ? { property: { connect: { id: validPropertyId } } } : {}),
        user1Unread: 0,
        user2Unread: 0,
        lastMessage: null
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
        property: validPropertyId ? {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            type: true
          }
        } : true
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
        fullName: otherUserData.fullName || otherUserData.username
      }
    });
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
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

// Send a message in a conversation - Fixed version
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    if (!isValidObjectId(chatId) || !isValidObjectId(senderId)) {
      return res.status(400).json({ message: 'Invalid chat ID or sender ID' });
    }
    
    console.log(`🔄 Sending message in conversation: ${chatId}`);
    console.log(`📝 Content: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`);
    console.log(`👤 Sender ID: ${senderId}`);
    
    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: chatId },
    });
    
    if (!conversation) {
      console.log(`❌ Conversation not found: ${chatId}`);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      console.log(`❌ Access denied: User ${senderId} is not part of conversation ${chatId}`);
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }
    
    // Determine recipient ID
    const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
    
    console.log(`👥 Message recipient: ${recipientId}`);
    
    // Create message with explicit relations
    const message = await prisma.message.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        conversation: { connect: { id: chatId } }
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
    
    console.log(`✅ Message saved to database with ID: ${message.id}`);
    
    // Update conversation with raw MongoDB operations for reliability
    const updateResult = await prisma.$runCommandRaw({
      update: "Conversation", // Collection name
      updates: [{
        q: { _id: { $oid: chatId } },
        u: { 
          $set: { 
            updatedAt: new Date(),
            lastMessage: content 
          },
          $inc: conversation.user1Id === recipientId 
            ? { user1Unread: 1 } 
            : { user2Unread: 1 }
        }
      }]
    });
    
    console.log(`📄 Conversation update result:`, updateResult);
    
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
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
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
exports.deleteConversation = async (req, res) => {
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
    
    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: { conversationId: chatId }
    });
    
    // Delete the conversation
    await prisma.conversation.delete({
      where: { id: chatId }
    });
    
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};