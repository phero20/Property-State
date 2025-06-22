// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://property-state.onrender.com/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://property-state-socket.onrender.com';

// Log the URLs being used (helpful for debugging)
console.log('🌐 Using API URL:', API_URL);
console.log('🔌 Using Socket URL:', SOCKET_URL);

// Post Types
export const POST_TYPES = {
  BUY: 'buy',
  RENT: 'rent'
};

// Property Types  
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  CONDO: 'condo',
  LAND: 'land'
};

// Default values
export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face';
export const DEFAULT_PROPERTY_IMAGE = 'https://via.placeholder.com/400x250/e5e7eb/6b7280?text=No+Image';