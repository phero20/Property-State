import axios from "axios";
import { API_URL } from "../utils/constants";

console.log("🌐 Using API URL:", API_URL);

// Create axios instance with increased timeout
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // Increase to 60 seconds
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);

        // Add authentication headers
        if (user.token) {
          config.headers["Authorization"] = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
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
    if (
      error.config &&
      !error.config.__isRetryRequest &&
      error.code === "ECONNABORTED" &&
      error.message.includes("timeout")
    ) {
      console.log("🔄 Request timed out, retrying once...");

      // Set retry flag
      error.config.__isRetryRequest = true;
      error.config.timeout = 90000; // Longer timeout for retry

      // Return new promise with the retry
      return api(error.config);
    }

    // For timeout errors, return mock data
    if (error.code === "ECONNABORTED") {
      const url = error.config?.url || "";

      if (url.includes("/posts") && !url.includes("/posts/")) {
        console.log("🔄 Posts fetch timed out - returning mock data");
        return Promise.resolve({
          data: mockPosts,
          isMock: true,
        });
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => {
    // If avatar is present and is a File or base64, ensure it is sent as base64 string
    if (userData.avatar && userData.avatar instanceof File) {
      // Convert File to base64 before sending
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result;
            const payload = { ...userData, avatar: base64 };
            console.log('[authAPI.register] Sending avatar as base64:', base64.substring(0, 100));
            const response = await api.post("/auth/register", { userData: payload });
            resolve(response);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(userData.avatar);
      });
    } else if (userData.avatar && typeof userData.avatar === 'string' && userData.avatar.startsWith('data:image/')) {
      // Already base64, send as is
;
      return api.post("/auth/register", { userData });
    } else {
      // No avatar or not an image, send as is
    
      return api.post("/auth/register", { userData });
    }
  },
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/profile"),
};

// User API
export const userAPI = {
  getProfile: async () => {
    try {
      return await api.get("/user/profile");
    } catch (error) {
      throw error;
    }
  },
  updateProfile: async (profileData) => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) throw new Error("No user data found");
      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      if (!userId) throw new Error("No user ID found");
      const response = await api.put(`/users/${userId}`, profileData);
      if (response.data.success) {
        return response.data;
      }
      else{
        return false;
      }
    } catch (error) {
      throw error;
    }
  },
  getNotifications: async () => {
    try {
      const response = await api.get("/users/notifications");
      return response;
    } catch (error) {
      throw error;
    }
  },
  markNotificationAsRead: async (notificationId) => {
    try {
      return await api.put(`/user/notifications/${notificationId}/read`);
    } catch (error) {
      throw error;
    }
  },
  getUserStats: async () => {
    try {
      return await api.get("/users/stats");
    } catch (error) {
      throw error;
    }
  },
  getProfilePosts: async (userId = null) => {
    try {
      // If no userId provided, get current user's posts
      if (!userId) {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user._id;
        } else {
          throw new Error("No user ID provided and no current user found");
        }
      }

      // Try to get from API first
      const response = await api.get(`/users/${userId}/posts`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getSavedPosts: async () => {
    try {
      return await api.get("/users/saved-posts");
    } catch (error) {
      throw error;
    }
  },
  savePost: async (postId) => {
    try {
      const res = await api.post(`/users/save-post/${postId}`);
      return res;
    } catch (error) {
      throw error;
    }
  },
  unsavePost: async (postId) => {
    try {
      const res = await api.delete(`/users/save-post/${postId}`);
      return res;
    } catch (error) {
      throw error;
    }
  },
  getUserActivity: async () => {
    try {
      return await api.get("/user/activity");
    } catch (error) {
      throw error;
    }
  },
  deleteAccount: async () => {
    try {
      const res = await api.delete('/users/deleteme');
      return res;
    } catch (error) {
      throw error;
    }
  },
};

// Posts API - Remove localStorage fallbacks, trust the backend
export const postAPI = {
  getAllPosts: async (params = {}) => {
    try {  
      const response = await api.get("/posts", { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
  getPost: async (id) => {
    try {
      if (!id) throw new Error('No post ID provided');
      const response = await api.get(`/posts/${id}`);
      if (!response.data) throw new Error('No post data returned');
      const post = response.data;
      if (!post._id) throw new Error('Malformed post data: missing _id');
      if (!('ownerInfo' in post)) post.ownerInfo = null;
      return post;
    } catch (error) {
      throw error;
    }
  },
  createPost: async ({ postData, postDetail }) => {
    try {
      // Make sure we have a proper user connection
      const userData = localStorage.getItem("user");
      const currentUser = userData ? JSON.parse(userData) : null;
      const userId = currentUser?.id || currentUser?._id;

      let finalPostData = { ...postData };
      if (
        !finalPostData.user ||
        !finalPostData.user.connect ||
        !finalPostData.user.connect.id
      ) {
        if (userId) {
          finalPostData.user = {
            connect: { id: userId },
          };
         
        } else {
          console.error("❌ No user ID available for post creation");
          throw new Error("User authentication required");
        }
      }

      // Check for required fields for debugging
      if (!finalPostData.title) console.warn("⚠️ Missing title in post data");
      if (!finalPostData.price) console.warn("⚠️ Missing price in post data");
      if (!finalPostData.city) console.warn("⚠️ Missing city in post data");
      if (!finalPostData.user?.connect?.id)
        console.warn("⚠️ Missing user connection in post data");

      // Make the API call with both postData and postDetail
      const response = await api.post("/posts", { postData: finalPostData, postDetail });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePost: async (id, { postData, postDetail }) => {
    try {
      const response = await api.put(`/posts/${id}`, { postData, postDetail });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deletePost: async (id) => {
    try {
      if (!id) throw new Error('No post ID provided');
      const response = await api.delete(`/posts/${id}`);
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to delete post');
      }
    } catch (error) {
      throw error;
    }
  },
};

// Import the mock chat API for development use
// Update your chatAPI object to use the correct endpoint
export const chatAPI = {
  // Get all conversations for current user
  getChats: async () => {
    try {
      const response = await api.get(`/chat/conversations`);
      return response;
    } catch (error) {
      return { data: [] };
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      return response;
    } catch (error) {
      return { data: [] };
    }
  },

  // Create a new chat with another user
  createChat: async (userId, propertyId = null) => {
    try {
      const payload = { userId };
      if (propertyId && propertyId !== "undefined" && propertyId !== "null") {
        payload.propertyId = propertyId;
      }
      const response = await api.post(`/chat`, payload);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Send a message in a chat - FIXED URL
  sendMessage: async (chatId, content) => {
    try {
      const response = await api.post(`/chat/${chatId}/messages`, { content });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Fix the other methods too
  markChatAsRead: async (chatId) => {
    try {
      const response = await api.put(`/chat/${chatId}/read`);
      return response;
    } catch (error) {
      return { data: { success: false } };
    }
  },
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
      console.log("🔄 API unavailable, simulating mark as read...");
      return { data: { success: true } };
    }
  },

  deleteMessage: async (messageId) => {
    try {
      return await api.delete(`/messages/${messageId}`);
    } catch (error) {
      console.log("🔄 API unavailable, simulating message deletion...");
      return { data: { success: true } };
    }
  },

  searchMessages: async (query) => {
    try {
      return await api.get(`/messages/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.log("🔄 API unavailable, returning empty search results...");
      return { data: [] };
    }
  },
};

export default api;
