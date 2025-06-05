const prisma = require('../prisma'); // Adjust path if needed

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
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
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
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar,
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

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { userId: otherUserId, propertyId } = req.body;
    const currentUserId = req.user.id;
    
    // Don't allow creating a conversation with yourself
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }
    
    console.log('🔄 Creating conversation between', currentUserId, 'and', otherUserId);
    
    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUserId,
            user2Id: otherUserId
          },
          {
            user1Id: otherUserId,
            user2Id: currentUserId
          }
        ]
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });
    
    if (existingConversation) {
      console.log('✅ Found existing conversation:', existingConversation.id);
      
      // Format response
      const otherUser = existingConversation.user1Id === currentUserId 
        ? existingConversation.user2 
        : existingConversation.user1;
      
      return res.status(200).json({
        id: existingConversation.id,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          fullName: otherUser.fullName || otherUser.username
        }
      });
    }
    
    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        user1Id: currentUserId,
        user2Id: otherUserId,
        propertyId: propertyId || null,
        user1Unread: 0,
        user2Unread: 0
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });
    
    console.log('✅ Created new conversation:', newConversation.id);
    
    // Format response
    const otherUser = newConversation.user1Id === currentUserId 
      ? newConversation.user2 
      : newConversation.user1;
    
    res.status(201).json({
      id: newConversation.id,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        avatar: otherUser.avatar,
        fullName: otherUser.fullName || otherUser.username
      }
    });
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
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
      }
    });
    
    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      chatId: message.conversationId,
      content: message.content,
      senderId: message.senderId,
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
exports.sendMessage = async (req, res) => {
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
      }
    });
    
    // Update conversation
    await prisma.conversation.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        // Increment unread count for the recipient
        user1Unread: conversation.user1Id === recipientId ? { increment: 1 } : undefined,
        user2Unread: conversation.user2Id === recipientId ? { increment: 1 } : undefined
      }
    });
    
    res.status(201).json({
      id: message.id,
      chatId,
      content,
      senderId,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
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