export const loadApiService = async () => {
  try {
    return await import('../services/api.js');
  } catch (error) {
    console.error('Failed to load API service:', error);
    // Try to load the fallback
    try {
      console.warn('Attempting to load fallback API service...');
      return await import('../services/api.fallback.js');
    } catch (fallbackError) {
      console.error('Failed to load fallback API service:', fallbackError);
      // Return a minimal API implementation
      return {
        default: {},
        userAPI: { getNotifications: async () => ({ data: 0 }) },
        postAPI: { getAllPosts: async () => ({ data: [] }) },
        authAPI: {},
        chatAPI: {}
      };
    }
  }
};