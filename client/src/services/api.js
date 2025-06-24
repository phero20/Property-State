import axios from 'axios';
import { API_URL } from '../utils/constants';
import { mockPosts } from './mockData';

console.log('🌐 Using API URL:', API_URL);

// Create axios instance with increased timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // Increase to 60 seconds
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // Add authentication headers
        if (user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add retry logic to response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Only retry GET requests that time out
    if (error.config && 
        !error.config.__isRetryRequest && 
        error.code === 'ECONNABORTED' && 
        error.message.includes('timeout')) {
      
      console.log('🔄 Request timed out, retrying once...');
      
      // Set retry flag
      error.config.__isRetryRequest = true;
      error.config.timeout = 90000; // Longer timeout for retry
      
      // Return new promise with the retry
      return api(error.config);
    }
    
    // For timeout errors, return mock data
    if (error.code === 'ECONNABORTED') {
      const url = error.config?.url || '';
      
      if (url.includes('/posts') && !url.includes('/posts/')) {
        console.log('🔄 Posts fetch timed out - returning mock data');
        return Promise.resolve({ 
          data: mockPosts,
          isMock: true
        });
      }
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
      console.log('🔄 Fetching all posts...');
      const response = await api.get('/posts', { params });
      return response;
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
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
      
      // Make sure we have a proper user connection
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!postData.user || !postData.user.connect || !postData.user.connect.id) {
        if (currentUser && currentUser.id) {
          postData = {
            ...postData,
            user: {
              connect: { id: currentUser.id }
            }
          };
          console.log('👤 Added user connection from localStorage:', currentUser.id);
        } else {
          console.error('❌ No user ID available for post creation');
          throw new Error('User authentication required');
        }
      }
      
      console.log('📤 Sending post data with user connection:', 
        postData.user?.connect?.id || 'No user connection!');
      
      // Check for required fields for debugging
      if (!postData.title) console.warn('⚠️ Missing title in post data');
      if (!postData.price) console.warn('⚠️ Missing price in post data');
      if (!postData.city) console.warn('⚠️ Missing city in post data');
      if (!postData.user?.connect?.id) console.warn('⚠️ Missing user connection in post data');
      
      // Make the API call with the properly formatted data
      const response = await api.post('/posts', postData);
      
      console.log('✅ Post created successfully via API');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
      }
      
      throw error;
    }
  },
  
  updatePost: (id, postData) => api.put(`/posts/${id}`, postData),
  deletePost: (id) => api.delete(`/posts/${id}`),
  savePost: (id) => api.post(`/posts/${id}/save`),
  unsavePost: (id) => api.delete(`/posts/${id}/save`),
};

// Import the mock chat API for development use
// Update your chatAPI object to use the correct endpoint
export const chatAPI = {
  // Get all conversations for current user
  getChats: async () => {
    console.log('🔄 API Request: GET /chat/conversations');
    
    try {
      // Try real API first
      try {
        const response = await api.get(`/chat/conversations`); // Remove userId parameter
        console.log('✅ API Success: Fetched chats');
        return response;
      } catch (error) {
        console.log('❌ API Error:', error.message);
        console.log('🔄 Falling back to mock chat API');
        return await mockChatAPI.getChats();
      }
    } catch (error) {
      console.log('❌ Error in chatAPI.getChats:', error.message);
      return { data: [] };
    }
  },
  
  // Get messages for a specific chat
  getMessages: async (chatId) => {
    console.log(`🔄 API Request: GET /chat/${chatId}/messages`);
    
    try {
      // Try real API first
      try {
        const response = await api.get(`/chat/${chatId}/messages`);
        console.log('✅ API Success: Fetched messages');
        return response;
      } catch (error) {
        console.log('❌ API Error:', error.message);
        console.log('🔄 Falling back to mock chat API');
        return await mockChatAPI.getMessages(chatId);
      }
    } catch (error) {
      console.log('❌ Error in chatAPI.getMessages:', error.message);
      return { data: [] };
    }
  },
  
  // Create a new chat with another user
  createChat: async (userId, propertyId = null) => {
    console.log(`🔄 Creating chat with user: ${userId}${propertyId ? ` for property: ${propertyId}` : ''}`);
    
    try {
      // Prepare request payload
      const payload = { userId };
      if (propertyId && propertyId !== 'undefined' && propertyId !== 'null') {
        payload.propertyId = propertyId;
      }
      
      console.log('📤 Request payload:', payload);
      
      const response = await api.post(`/chat`, payload);
      console.log('✅ Chat created/retrieved:', response.data);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.error || 'No details available';
      
      console.error('❌ Error creating chat:', errorMessage);
      console.error('❌ Error details:', errorDetails);
      
      // Log the request details for debugging
      console.error('❌ Failed request details:', {
        url: '/chat',
        method: 'POST',
        payload: { userId, propertyId },
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      throw error;
    }
  },
  
  // Send a message in a chat - FIXED URL
  sendMessage: async (chatId, content) => {
    console.log(`🔄 Sending message to chat ${chatId}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`);
    
    try {
      // Remove the duplicate /api/ prefix
      const response = await api.post(`/chat/${chatId}/messages`, { content });
      console.log('✅ Message sent:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error sending message:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Fix the other methods too
  markChatAsRead: async (chatId) => {
    try {
      // Remove the duplicate /api/ prefix
      const response = await api.put(`/chat/${chatId}/read`);
      return response;
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
      return { data: { success: false } };
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

export { mockPosts };
export default api;
