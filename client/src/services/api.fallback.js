import axios from 'axios';

const API_URL = 'http://property-state.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Basic exports with no-op implementations
export const userAPI = {
  getProfile: async () => ({ data: {} }),
  updateProfile: async () => ({ data: {} }),
  getNotifications: async () => ({ data: 0 }),
  getUserStats: async () => ({ data: {} }),
  getProfilePosts: async () => ({ data: [] }),
  getSavedPosts: async () => ({ data: [] }),
};

export const postAPI = {
  getAllPosts: async () => ({ data: [] }),
  getPostById: async () => ({ data: {} }),
  createPost: async () => ({ data: {} }),
  updatePost: async () => ({ data: {} }),
  deletePost: async () => ({ data: {} }),
};

export const authAPI = {
  login: async () => ({ data: {} }),
  register: async () => ({ data: {} }),
  logout: async () => ({ data: {} }),
};

export const chatAPI = {
  getUserChats: async () => ({ data: [] }),
  getChatMessages: async () => ({ data: [] }),
  sendMessage: async () => ({ data: {} }),
  createChat: async () => ({ data: {} }),
};

export default api;