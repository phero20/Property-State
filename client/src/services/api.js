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
          // Ensure token is actually a JWT (should start with eyJ)
          if (typeof user.token === 'string' && user.token.startsWith('eyJ')) {
            config.headers['Authorization'] = `Bearer ${user.token}`;
            console.log('🔐 Added valid JWT Bearer token');
          } else {
            // Use user ID as a fallback
            config.headers['Authorization'] = `${user.id}`;
            // Add additional headers for identification
            config.headers['x-user-id'] = user.id;
            config.headers['x-user-email'] = user.email;
            config.headers['x-user-username'] = user.username;
            console.log('🔐 Added user ID as auth token fallback');
          }
        } else {
          // No token, use user ID as fallback authentication
          config.headers['Authorization'] = `${user.id}`;
          config.headers['x-user-id'] = user.id;
          config.headers['x-user-email'] = user.email;
          config.headers['x-user-username'] = user.username;
          console.log('🔐 Added user ID as fallback authentication');
        }
        
        console.log('🔐 Auth headers added:', { 
          userId: user.id, 
          email: user.email, 
          username: user.username,
          hasToken: !!user.token,
          tokenType: user.token ? (user.token.startsWith('eyJ') ? 'JWT' : 'other') : 'none'
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
      const response = await api.get('/users/notifications'); // Notice 'users' plural
      return response;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      if (process.env.NODE_ENV !== 'production' && 
         (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        console.log('🔄 Using mock notifications data');
        return { data: 3 }; // Return mock notification count
      }
      throw error;
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
  getAllPosts: async (params = {}) => {
    try {
      console.log('📋 Fetching all posts...');
      const response = await api.get('/posts', { params });
      return response;
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      if (process.env.NODE_ENV !== 'production' && 
         (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        console.log('🔄 Using mock posts data');
        return { data: mockPosts };
      }
      throw error;
    }
  },

  getPost: async (id) => {
    try {
      console.log(`🔍 Fetching post by ID: ${id}...`);
      return await api.get(`/posts/${id}`);
    } catch (error) {
      console.error(`❌ Error fetching post with ID ${id}:`, error);
      if (process.env.NODE_ENV !== 'production' && 
         (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        console.log('🔄 Using mock post data');
        const mockPost = mockPosts.find(post => post.id === id) || mockPosts[0];
        return { data: mockPost };
      }
      throw error;
    }
  },

  // Update the createPost method to properly format data before sending
  createPost: async (postData) => {
    try {
      console.log('📝 Creating new post via API:', postData.title);
      
      // Format the data to ensure types are correct
      const formattedPostData = {
        ...postData,
        // Convert numeric fields to proper types
        price: parseFloat(postData.price),
        bedroom: parseInt(postData.bedroom || 0),
        bathroom: parseFloat(postData.bathroom || 0),
        
        // Ensure coordinates are numbers, not strings
        latitude: postData.latitude ? parseFloat(postData.latitude) : null,
        longitude: postData.longitude ? parseFloat(postData.longitude) : null,
        
        // Format post details
        postDetail: postData.postDetail ? {
          desc: postData.postDetail.desc || '',
          utilities: postData.postDetail.utilities || '',
          pet: postData.postDetail.pet || '',
          income: postData.postDetail.income || '',
          size: postData.postDetail.size ? parseInt(postData.postDetail.size) : null,
          school: postData.postDetail.school ? parseInt(postData.postDetail.school) : null,
          bus: postData.postDetail.bus ? parseInt(postData.postDetail.bus) : null,
          restaurant: postData.postDetail.restaurant ? parseInt(postData.postDetail.restaurant) : null
        } : {}
      };
      
      console.log('📤 Sending formatted post data:', formattedPostData);
      const response = await api.post('/posts', formattedPostData);
      console.log('✅ Post created via API');
      return response;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  },
  
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`),
  savePost: (id) => api.post(`/posts/${id}/save`),
  unsavePost: (id) => api.delete(`/posts/${id}/save`),
};

// Chat/Messages API
export const chatAPI = {
  // Get all conversations for current user
  getChats: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response;
    } catch (error) {
      console.log('❌ Failed to fetch chats:', error.message);
      // Use fallback data from localStorage for development
      const mockChats = JSON.parse(localStorage.getItem('userChats') || '[]');
      return { data: mockChats };
    }
  },
  
  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      return response;
    } catch (error) {
      console.log('❌ Failed to fetch messages:', error.message);
      // Use fallback data from localStorage for development
      const chatMessages = JSON.parse(localStorage.getItem(`chat_${chatId}_messages`) || '[]');
      return { data: chatMessages };
    }
  },
  
  // Create a new chat with another user
  createChat: async (userId, propertyId) => {
    try {
      const response = await api.post('/chat', { userId, propertyId });
      return response;
    } catch (error) {
      console.log('❌ Failed to create chat:', error.message);
      // Create a mock chat for development
      const mockChat = {
        id: `chat_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: '',
        participantInfo: {
          id: userId,
          username: `user_${userId.substring(0, 5)}`,
          avatar: null
        }
      };
      
      // Store in localStorage for persistence during development
      const existingChats = JSON.parse(localStorage.getItem('userChats') || '[]');
      existingChats.push(mockChat);
      localStorage.setItem('userChats', JSON.stringify(existingChats));
      
      return { data: mockChat };
    }
  },
  
  // Send a message in a chat
  sendMessage: async (chatId, messageContent) => {
    try {
      const response = await api.post(`/chat/${chatId}/messages`, { content: messageContent });
      return response;
    } catch (error) {
      console.log('❌ Failed to send message:', error.message);
      // Create a mock message for development
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : { id: 'current_user' };
      
      const newMessage = {
        id: `msg_${Date.now()}`,
        chatId: chatId,
        content: messageContent,
        senderId: user.id,
        createdAt: new Date().toISOString()
      };
      
      // Update localStorage
      const chatMessages = JSON.parse(localStorage.getItem(`chat_${chatId}_messages`) || '[]');
      chatMessages.push(newMessage);
      localStorage.setItem(`chat_${chatId}_messages`, JSON.stringify(chatMessages));
      
      // Update last message in chat list
      const existingChats = JSON.parse(localStorage.getItem('userChats') || '[]');
      const chatIndex = existingChats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        existingChats[chatIndex].lastMessage = {
          content: messageContent,
          createdAt: new Date().toISOString()
        };
        existingChats[chatIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('userChats', JSON.stringify(existingChats));
      }
      
      return { data: newMessage };
    }
  },
  
  // Mark a chat as read
  markChatAsRead: async (chatId) => {
    try {
      const response = await api.put(`/chat/${chatId}/read`);
      return response;
    } catch (error) {
      console.log('❌ Failed to mark chat as read:', error.message);
      // Update localStorage for development
      const existingChats = JSON.parse(localStorage.getItem('userChats') || '[]');
      const chatIndex = existingChats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1 && existingChats[chatIndex].unreadCount) {
        existingChats[chatIndex].unreadCount = 0;
        localStorage.setItem('userChats', JSON.stringify(existingChats));
      }
      return { data: { success: true } };
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