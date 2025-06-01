import prisma from "../lib/prisma.js";

// Test data for development - in production, this would use a database
let chats = [
  {
    id: '1',
    userIDs: ['user1', 'user2'],
    seenBy: ['user1'],
    messages: [
      {
        id: 'msg1',
        text: 'Hi, I\'m interested in your property!',
        userId: 'user1',
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 'msg2',
        text: 'Great! When would you like to schedule a viewing?',
        userId: 'user2',
        createdAt: new Date('2024-01-15T10:05:00Z')
      }
    ],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    lastMessage: 'Great! When would you like to schedule a viewing?'
  }
];

let users = [
  { id: 'user1', username: 'john_buyer', email: 'john@example.com' },
  { id: 'user2', username: 'jane_owner', email: 'jane@example.com' },
  { id: 'user3', username: 'mike_user', email: 'mike@example.com' }
];

export const getChats = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📱 Getting chats for user:', userId);
    
    // Get chats where user is a participant
    const userChats = chats.filter(chat => 
      chat.userIDs.includes(userId)
    ).map(chat => {
      // Add user details for display
      const otherUserId = chat.userIDs.find(id => id !== userId);
      const otherUser = users.find(u => u.id === otherUserId);
      
      return {
        ...chat,
        otherUser: otherUser || { id: otherUserId, username: `User${otherUserId?.slice(-4)}` }
      };
    });
    
    console.log(`✅ Found ${userChats.length} chats for user ${userId}`);
    res.json(userChats);
  } catch (error) {
    console.error('❌ Error getting chats:', error);
    res.status(500).json({ message: 'Failed to get chats' });
  }
};

export const getChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('💬 Getting chat:', id, 'for user:', userId);
    
    const chat = chats.find(c => c.id === id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    if (!chat.userIDs.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }
    
    // Add user details
    const otherUserId = chat.userIDs.find(uid => uid !== userId);
    const otherUser = users.find(u => u.id === otherUserId);
    
    const chatWithUser = {
      ...chat,
      otherUser: otherUser || { id: otherUserId, username: `User${otherUserId?.slice(-4)}` }
    };
    
    console.log('✅ Chat found with', chat.messages.length, 'messages');
    res.json(chatWithUser);
  } catch (error) {
    console.error('❌ Error getting chat:', error);
    res.status(500).json({ message: 'Failed to get chat' });
  }
};

export const addChat = async (req, res) => {
  try {
    const { receiverId, postId } = req.body;
    const userId = req.userId;
    
    console.log('➕ Creating chat between:', userId, 'and', receiverId, 'for post:', postId);
    
    // Validate that users are different
    if (userId === receiverId || String(userId) === String(receiverId)) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }
    
    // Check if chat already exists between these users
    let existingChat = chats.find(chat => 
      (chat.userIDs.includes(userId) && chat.userIDs.includes(receiverId)) ||
      (chat.userIDs.includes(receiverId) && chat.userIDs.includes(userId))
    );
    
    if (existingChat) {
      console.log('✅ Chat already exists:', existingChat.id);
      
      // Add user details
      const otherUserId = existingChat.userIDs.find(id => id !== userId);
      const otherUser = users.find(u => u.id === otherUserId) || 
                       { id: otherUserId, username: `User${otherUserId?.slice(-4)}` };
      
      const chatWithUser = {
        ...existingChat,
        otherUser: otherUser
      };
      
      return res.json(chatWithUser);
    }
    
    // Create new chat
    const newChat = {
      id: `chat_${Date.now()}`,
      userIDs: [userId, receiverId],
      seenBy: [userId],
      messages: [
        {
          id: `welcome_${Date.now()}`,
          text: `Hi! I'm interested in your property listing.`,
          userId: userId,
          createdAt: new Date(),
          isSystemMessage: false
        }
      ],
      createdAt: new Date(),
      lastMessage: `Hi! I'm interested in your property listing.`,
      postId: postId || null
    };
    
    chats.push(newChat);
    
    // Add user details
    const otherUser = users.find(u => u.id === receiverId) || 
                     { id: receiverId, username: `User${receiverId?.slice(-4)}` };
    
    const chatWithUser = {
      ...newChat,
      otherUser: otherUser
    };
    
    console.log('✅ New chat created:', newChat.id);
    res.status(201).json(chatWithUser);
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
};

export const readChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('👁️ Marking chat as read:', id, 'by user:', userId);
    
    const chatIndex = chats.findIndex(c => c.id === id);
    
    if (chatIndex === -1) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    const chat = chats[chatIndex];
    
    if (!chat.userIDs.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Add user to seenBy if not already there
    if (!chat.seenBy.includes(userId)) {
      chat.seenBy.push(userId);
    }
    
    console.log('✅ Chat marked as read');
    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error('❌ Error marking chat as read:', error);
    res.status(500).json({ message: 'Failed to mark chat as read' });
  }
};
