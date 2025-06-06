// Create this new file for mock chat functionality
const generateRandomId = () => `id_${Math.random().toString(36).substring(2, 15)}`;

// Get user from localStorage
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

// Initialize mock data if needed
const initializeMockData = () => {
  // Initialize mock chats if not exists
  if (!localStorage.getItem('mockChats')) {
    console.log('📋 Initializing mock chat data');
    
    const user = getCurrentUser();
    if (!user) return;
    
    const mockChats = [
      {
        id: 'chat_1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        lastMessage: "Let me know if you're interested in viewing the property",
        unreadCount: 2,
        user1Id: user.id,
        user2Id: 'owner_1',
        otherUser: {
          id: 'owner_1',
          username: 'propertyowner',
          fullName: 'Property Owner',
          avatar: null
        }
      },
      {
        id: 'chat_2',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        lastMessage: "The rent is $1500 per month, utilities included",
        unreadCount: 0,
        user1Id: user.id,
        user2Id: 'agent_1',
        otherUser: {
          id: 'agent_1',
          username: 'realestateagent',
          fullName: 'Real Estate Agent',
          avatar: null
        }
      }
    ];
    
    localStorage.setItem('mockChats', JSON.stringify(mockChats));
    
    // Initialize mock messages for each chat
    const mockMessages1 = [
      {
        id: 'msg_1_1',
        chatId: 'chat_1',
        content: "Hi, I'm interested in your property on Main Street",
        senderId: user.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_1_2',
        chatId: 'chat_1',
        content: "Thanks for your interest! It's a great location",
        senderId: 'owner_1',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_1_3',
        chatId: 'chat_1',
        content: "Can I schedule a viewing this weekend?",
        senderId: user.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_1_4',
        chatId: 'chat_1',
        content: "Let me know if you're interested in viewing the property",
        senderId: 'owner_1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const mockMessages2 = [
      {
        id: 'msg_2_1',
        chatId: 'chat_2',
        content: "Hello, I saw your listing for the apartment downtown",
        senderId: user.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_2_2',
        chatId: 'chat_2',
        content: "Hi there! Yes, it's still available. Would you like more information?",
        senderId: 'agent_1',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_2_3',
        chatId: 'chat_2',
        content: "What's the monthly rent and are utilities included?",
        senderId: user.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_2_4',
        chatId: 'chat_2',
        content: "The rent is $1500 per month, utilities included",
        senderId: 'agent_1',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    localStorage.setItem('mockMessages_chat_1', JSON.stringify(mockMessages1));
    localStorage.setItem('mockMessages_chat_2', JSON.stringify(mockMessages2));
  }
};

// Export the mock API
const mockChatAPI = {
  getChats: async () => {
    console.log('🔄 Mock API: Fetching chats');
    initializeMockData();
    
    const user = getCurrentUser();
    if (!user) {
      return { data: [] };
    }
    
    // Get mock chats from localStorage
    const allChats = JSON.parse(localStorage.getItem('mockChats') || '[]');
    
    // Filter chats for current user
    const userChats = allChats.filter(chat => 
      chat.user1Id === user.id || 
      chat.user2Id === user.id
    );
    
    console.log(`✅ Mock API: Returned ${userChats.length} chats`);
    return { data: userChats };
  },
  
  getMessages: async (chatId) => {
    console.log(`🔄 Mock API: Fetching messages for chat ${chatId}`);
    initializeMockData();
    
    const user = getCurrentUser();
    if (!user) {
      return { data: [] };
    }
    
    // Verify the user has access to this chat
    const allChats = JSON.parse(localStorage.getItem('mockChats') || '[]');
    const hasAccess = allChats.some(chat => 
      chat.id === chatId && (
        chat.user1Id === user.id || 
        chat.user2Id === user.id
      )
    );
    
    if (!hasAccess) {
      console.log(`❌ Mock API: User ${user.id} does not have access to chat ${chatId}`);
      return { data: [] };
    }
    
    // Get messages for the chat
    const messages = JSON.parse(localStorage.getItem(`mockMessages_${chatId}`) || '[]');
    
    // Update unread count
    const updatedChats = allChats.map(chat => {
      if (chat.id === chatId && chat.unreadCount > 0) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    });
    localStorage.setItem('mockChats', JSON.stringify(updatedChats));
    
    console.log(`✅ Mock API: Returned ${messages.length} messages for chat ${chatId}`);
    return { data: messages };
  },
  
  createChat: async (userId, propertyId) => {
    console.log(`🔄 Mock API: Creating chat with user ${userId}`);
    initializeMockData();
    
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if chat already exists
    const allChats = JSON.parse(localStorage.getItem('mockChats') || '[]');
    const existingChat = allChats.find(chat => 
      (chat.user1Id === user.id && chat.user2Id === userId) || 
      (chat.user1Id === userId && chat.user2Id === user.id)
    );
    
    if (existingChat) {
      console.log(`✅ Mock API: Chat already exists with id ${existingChat.id}`);
      return { data: existingChat };
    }
    
    // Create new chat
    const newChat = {
      id: `chat_${generateRandomId()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: '',
      unreadCount: 0,
      user1Id: user.id,
      user2Id: userId,
      propertyId: propertyId || null,
      otherUser: {
        id: userId,
        username: `user_${userId.substring(0, 5)}`,
        fullName: null,
        avatar: null
      }
    };
    
    allChats.push(newChat);
    localStorage.setItem('mockChats', JSON.stringify(allChats));
    
    // Initialize empty message array for this chat
    localStorage.setItem(`mockMessages_${newChat.id}`, JSON.stringify([]));
    
    console.log(`✅ Mock API: Created new chat with id ${newChat.id}`);
    return { data: newChat };
  },
  
  sendMessage: async (chatId, messageContent) => {
    console.log(`🔄 Mock API: Sending message to chat ${chatId}`);
    initializeMockData();
    
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Verify chat exists and user has access
    const allChats = JSON.parse(localStorage.getItem('mockChats') || '[]');
    const chat = allChats.find(c => 
      c.id === chatId && (
        c.user1Id === user.id || 
        c.user2Id === user.id
      )
    );
    
    if (!chat) {
      console.log(`❌ Mock API: Chat ${chatId} not found or access denied`);
      throw new Error('Chat not found or access denied');
    }
    
    // Create new message
    const newMessage = {
      id: `msg_${generateRandomId()}`,
      chatId: chatId,
      content: messageContent,
      senderId: user.id,
      createdAt: new Date().toISOString()
    };
    
    // Add to messages
    const messages = JSON.parse(localStorage.getItem(`mockMessages_${chatId}`) || '[]');
    messages.push(newMessage);
    localStorage.setItem(`mockMessages_${chatId}`, JSON.stringify(messages));
    
    // Update chat
    const receiverId = chat.user1Id === user.id ? chat.user2Id : chat.user1Id;
    const updatedChats = allChats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          lastMessage: messageContent,
          updatedAt: new Date().toISOString(),
          // Increment unread count for the other user
          unreadCount: c.user1Id === receiverId ? (c.unreadCount || 0) + 1 : c.unreadCount
        };
      }
      return c;
    });
    
    localStorage.setItem('mockChats', JSON.stringify(updatedChats));
    
    console.log(`✅ Mock API: Sent message to chat ${chatId}`);
    return { data: newMessage };
  },
  
  markChatAsRead: async (chatId) => {
    console.log(`🔄 Mock API: Marking chat ${chatId} as read`);
    
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const allChats = JSON.parse(localStorage.getItem('mockChats') || '[]');
    const updatedChats = allChats.map(chat => {
      if (chat.id === chatId && (chat.user1Id === user.id || chat.user2Id === user.id)) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    });
    
    localStorage.setItem('mockChats', JSON.stringify(updatedChats));
    
    console.log(`✅ Mock API: Marked chat ${chatId} as read`);
    return { data: { success: true } };
  }
};

export default mockChatAPI;