import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api'
  : 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Add authentication headers
        if (user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
          console.log('🔐 Added Bearer token');
        } else {
          // Fallback authentication headers
          config.headers['x-user-id'] = user.id;
          config.headers['x-user-email'] = user.email;
          config.headers['x-user-username'] = user.username;
          config.headers['Authorization'] = `Bearer ${user.id}`;
          console.log('🔐 Added fallback auth headers');
        }
        
        console.log('🔐 Auth headers added:', { 
          userId: user.id, 
          email: user.email, 
          username: user.username,
          hasToken: !!user.token
        });
      } catch (error) {
        console.error('❌ Error parsing user data for auth:', error);
      }
    } else {
      console.warn('⚠️ No token provided - user not authenticated');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.message);
    
    // Handle different error types
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized - API requires authentication');
    } else if (error.response?.status === 413) {
      console.error('📦 Payload too large');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// User API
export const userAPI = {
  getProfile: async () => {
    try {
      return await api.get('/user/profile');
    } catch (error) {
      console.log('🔄 API unavailable, returning local user data...');
      const userData = localStorage.getItem('user');
      if (userData) {
        return { data: JSON.parse(userData) };
      }
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      return await api.put('/user/profile', profileData);
    } catch (error) {
      console.log('🔄 API unavailable, updating local user data...');
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { data: updatedUser };
      }
      throw error;
    }
  },
  
  getNotifications: async () => {
    try {
      return await api.get('/user/notifications');
    } catch (error) {
      console.log('🔄 API unavailable, returning mock notifications...');
      // Return mock notifications count for development
      return { data: Math.floor(Math.random() * 5) }; // Random 0-4 notifications
    }
  },
  
  markNotificationAsRead: async (notificationId) => {
    try {
      return await api.put(`/user/notifications/${notificationId}/read`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating notification mark as read...');
      return { data: { success: true } };
    }
  },
  
  getUserStats: async () => {
    try {
      return await api.get('/user/stats');
    } catch (error) {
      console.log('🔄 API unavailable, returning mock stats...');
      const userData = localStorage.getItem('user');
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      
      if (userData) {
        const user = JSON.parse(userData);
        const userPosts = allPosts.filter(post => post.userId === user.id);
        
        return {
          data: {
            totalPosts: userPosts.length,
            totalViews: userPosts.reduce((sum, post) => sum + (post.views || 0), 0),
            savedPosts: 0, // TODO: Implement saved posts
            totalMessages: 0, // TODO: Implement messages
          }
        };
      }
      
      return { data: { totalPosts: 0, totalViews: 0, savedPosts: 0, totalMessages: 0 } };
    }
  },

  // Add missing profile posts function
  getProfilePosts: async (userId = null) => {
    try {
      console.log('📥 Getting profile posts for user:', userId);
      
      // If no userId provided, get current user's posts
      if (!userId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id;
        } else {
          throw new Error('No user ID provided and no current user found');
        }
      }

      // Try to get from API first
      const response = await api.get(`/user/${userId}/posts`);
      console.log('✅ Profile posts loaded from API:', response.data?.length || 0);
      return response;
      
    } catch (error) {
      console.log('🔄 API unavailable, loading profile posts from localStorage...');
      
      // Fallback to localStorage
      const userData = localStorage.getItem('user');
      const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
      
      if (userData) {
        const user = JSON.parse(userData);
        const targetUserId = userId || user.id;
        
        // Filter posts by user ID
        const userPosts = allPosts.filter(post => 
          post.userId === targetUserId || 
          post.ownerInfo?.id === targetUserId
        );
        
        console.log('✅ Profile posts loaded from localStorage:', userPosts.length);
        return { data: userPosts };
      }
      
      return { data: [] };
    }
  },

  // Add function to get user's saved posts
  getSavedPosts: async () => {
    try {
      return await api.get('/user/saved-posts');
    } catch (error) {
      console.log('🔄 API unavailable, returning empty saved posts...');
      // TODO: Implement localStorage saved posts
      return { data: [] };
    }
  },

  // Add function to save/unsave posts
  savePost: async (postId) => {
    try {
      return await api.post(`/user/save-post/${postId}`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating save post...');
      return { data: { success: true, saved: true } };
    }
  },

  unsavePost: async (postId) => {
    try {
      return await api.delete(`/user/save-post/${postId}`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating unsave post...');
      return { data: { success: true, saved: false } };
    }
  },

  // Add function to get user activity
  getUserActivity: async () => {
    try {
      return await api.get('/user/activity');
    } catch (error) {
      console.log('🔄 API unavailable, returning mock activity...');
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          data: {
            lastLogin: user.lastLogin || new Date().toISOString(),
            postsCreated: 0, // Will be calculated from posts
            messagesCount: 0,
            profileViews: Math.floor(Math.random() * 50),
          }
        };
      }
      return { data: {} };
    }
  },
};

// Posts API - Remove localStorage fallbacks, trust the backend
export const postAPI = {
  getAllPosts: async () => {
    return await api.get('/posts');
  },
  
  getPost: (id) => api.get(`/posts/${id}`),
  
  createPost: async (postData) => {
    console.log('📝 Creating post via API:', postData.title);
    
    // Send the complete post data to backend
    const response = await api.post('/posts', postData);
    console.log('✅ Post created via API');
    return response;
  },
  
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`),
  savePost: (id) => api.post(`/posts/${id}/save`),
  unsavePost: (id) => api.delete(`/posts/${id}/save`),
};

// Chat/Messages API
export const chatAPI = {
  getConversations: async () => {
    try {
      return await api.get('/chat/conversations');
    } catch (error) {
      console.log('🔄 API unavailable, returning mock conversations...');
      
      // Return mock conversations with proper data structure
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user) {
        return { data: [] };
      }

      const mockConversations = [
        {
          id: `chat_${Date.now()}_1`,
          participants: [user.id, 'user_demo_1'],
          participantInfo: {
            id: 'user_demo_1',
            username: 'john_doe',
            fullName: 'John Doe',
            avatar: null,
            email: 'john@example.com'
          },
          lastMessage: {
            id: `msg_${Date.now()}_1`,
            content: 'Hello! I\'m interested in your property listing. Is it still available?',
            senderId: 'user_demo_1',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          unreadCount: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: `chat_${Date.now()}_2`,
          participants: [user.id, 'user_demo_2'],
          participantInfo: {
            id: 'user_demo_2',
            username: 'jane_smith',
            fullName: 'Jane Smith',
            avatar: null,
            email: 'jane@example.com'
          },
          lastMessage: {
            id: `msg_${Date.now()}_2`,
            content: 'Thank you for the quick response! When can we schedule a viewing?',
            senderId: 'user_demo_2',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          },
          unreadCount: 0,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: `chat_${Date.now()}_3`,
          participants: [user.id, 'user_demo_3'],
          participantInfo: {
            id: 'user_demo_3',
            username: 'mike_wilson',
            fullName: 'Mike Wilson',
            avatar: null,
            email: 'mike@example.com'
          },
          lastMessage: {
            id: `msg_${Date.now()}_3`,
            content: 'Great property! What are the monthly utility costs?',
            senderId: user.id,
            createdAt: new Date(Date.now() - 10800000).toISOString()
          },
          unreadCount: 1,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 10800000).toISOString()
        }
      ];

      console.log('✅ Returning mock conversations:', mockConversations.length);
      return { data: mockConversations };
    }
  },

  // Add the missing getChats function (alias for getConversations)
  getChats: async () => {
    try {
      console.log('💬 Fetching chats from API...');
      return await chatAPI.getConversations();
    } catch (error) {
      console.error('❌ Error fetching chats:', error);
      
      // This fallback should not be reached since getConversations handles fallback
      return { data: [] };
    }
  },
  
  getMessages: async (conversationId) => {
    try {
      return await api.get(`/chat/conversations/${conversationId}/messages`);
    } catch (error) {
      console.log('🔄 API unavailable, returning mock messages for conversation:', conversationId);
      
      // Return mock messages for development
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      const mockMessages = [
        {
          id: `msg_${Date.now()}_1`,
          conversationId,
          senderId: 'user_demo_1',
          content: 'Hello! I saw your property listing and I\'m very interested.',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          senderInfo: {
            username: 'john_doe',
            fullName: 'John Doe',
            avatar: null
          }
        },
        {
          id: `msg_${Date.now()}_2`,
          conversationId,
          senderId: user?.id || 'current_user',
          content: 'Hi John! Thank you for your interest. The property is still available. Would you like to schedule a viewing?',
          createdAt: new Date(Date.now() - 5400000).toISOString(),
          senderInfo: {
            username: user?.username || 'you',
            fullName: user?.fullName || user?.username || 'You',
            avatar: user?.avatar || null
          }
        },
        {
          id: `msg_${Date.now()}_3`,
          conversationId,
          senderId: 'user_demo_1',
          content: 'That would be great! I\'m available this weekend. What times work best for you?',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          senderInfo: {
            username: 'john_doe',
            fullName: 'John Doe',
            avatar: null
          }
        },
        {
          id: `msg_${Date.now()}_4`,
          conversationId,
          senderId: user?.id || 'current_user',
          content: 'Perfect! How about Saturday at 2 PM? I can meet you at the property.',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          senderInfo: {
            username: user?.username || 'you',
            fullName: user?.fullName || user?.username || 'You',
            avatar: user?.avatar || null
          }
        },
        {
          id: `msg_${Date.now()}_5`,
          conversationId,
          senderId: 'user_demo_1',
          content: 'Saturday at 2 PM works perfectly! Should I bring any documents with me?',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          senderInfo: {
            username: 'john_doe',
            fullName: 'John Doe',
            avatar: null
          }
        }
      ];
      
      console.log('✅ Returning mock messages:', mockMessages.length);
      return { data: mockMessages };
    }
  },
  
  sendMessage: async (conversationId, message) => {
    try {
      return await api.post(`/chat/conversations/${conversationId}/messages`, message);
    } catch (error) {
      console.log('🔄 API unavailable, simulating message send...');
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: user?.id || 'current_user',
        content: message.content,
        createdAt: new Date().toISOString(),
        senderInfo: {
          username: user?.username || 'you',
          fullName: user?.fullName || user?.username || 'You',
          avatar: user?.avatar || null
        }
      };
      
      console.log('✅ Simulated message sent:', newMessage);
      return { data: newMessage };
    }
  },
  
  createConversation: async (participantId, postId = null) => {
    try {
      return await api.post('/chat/conversations', { participantId, postId });
    } catch (error) {
      console.log('🔄 API unavailable, simulating conversation creation...');
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      
      const conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants: [user?.id, participantId],
        participantInfo: {
          id: participantId,
          username: 'new_contact',
          fullName: 'New Contact',
          avatar: null,
          email: 'contact@example.com'
        },
        postId,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Simulated conversation created:', conversation);
      return { data: conversation };
    }
  },

  // Add the missing createChat function (alias for createConversation)
  createChat: async (ownerId, postId = null) => {
    try {
      console.log('💬 Creating chat with owner:', ownerId, 'for post:', postId);
      return await chatAPI.createConversation(ownerId, postId);
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      throw error;
    }
  },

  // Additional chat methods
  getChatById: async (chatId) => {
    try {
      return await api.get(`/chat/conversations/${chatId}`);
    } catch (error) {
      console.log('🔄 API unavailable, returning mock chat...');
      return { 
        data: { 
          id: chatId, 
          messages: [],
          participants: [],
          participantInfo: {
            username: 'unknown_user',
            fullName: 'Unknown User'
          }
        } 
      };
    }
  },

  markChatAsRead: async (chatId) => {
    try {
      return await api.put(`/chat/conversations/${chatId}/read`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating mark as read...');
      return { data: { success: true } };
    }
  },

  // Add function to get chat messages
  getChatMessages: async (chatId) => {
    try {
      console.log('📨 Getting messages for chat:', chatId);
      return await chatAPI.getMessages(chatId);
    } catch (error) {
      console.error('❌ Error getting chat messages:', error);
      return { data: [] };
    }
  },

  // Add function to send chat message
  sendChatMessage: async (chatId, messageContent) => {
    try {
      console.log('📤 Sending message to chat:', chatId);
      return await chatAPI.sendMessage(chatId, { content: messageContent });
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      throw error;
    }
  }
};

// Message API (alias for chatAPI for backwards compatibility)
export const messageAPI = {
  getConversations: chatAPI.getConversations,
  getMessages: chatAPI.getMessages,
  sendMessage: chatAPI.sendMessage,
  createConversation: chatAPI.createConversation,
  
  // Additional message-specific methods
  markAsRead: async (messageId) => {
    try {
      return await api.put(`/messages/${messageId}/read`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating mark as read...');
      return { data: { success: true } };
    }
  },
  
  deleteMessage: async (messageId) => {
    try {
      return await api.delete(`/messages/${messageId}`);
    } catch (error) {
      console.log('🔄 API unavailable, simulating message deletion...');
      return { data: { success: true } };
    }
  },
  
  searchMessages: async (query) => {
    try {
      return await api.get(`/messages/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.log('🔄 API unavailable, returning empty search results...');
      return { data: [] };
    }
  },
};

// Debug API - Database statistics and health check
export const debugAPI = {
  getDBStats: async () => {
    try {
      return await api.get('/db-stats');
    } catch (error) {
      console.error('❌ Error fetching DB stats:', error);
      return { data: null, error: error.message };
    }
  },
};

export default api;