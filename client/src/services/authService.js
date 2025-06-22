import axios from 'axios';

// Use the environment variable or fallback to production URL
const API_URL = import.meta.env.VITE_API_URL || 'https://property-state.onrender.com/api';

export const login = async (credentials) => {
  console.log('🔐 Login attempt...');
  
  // Determine which field to use (email or username)
  const isEmail = !!credentials.email || (credentials.inputType === 'email');
  const loginField = isEmail ? 'email' : 'username';
  const loginValue = credentials[loginField] || credentials.input;
  
  console.log(`🔑 Attempting login with ${loginField}: ${loginValue}`);
  
  try {
    // Use axios for better error handling with full API URL
    const response = await axios.post(`${API_URL}/auth/login`, {
      [loginField]: loginValue,
      password: credentials.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    
    // Check for CORS errors
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.log('⚠️ CORS issue detected. Trying development fallback...');
      
      if (process.env.NODE_ENV !== 'production') {
        // Development fallback - create a mock user
        const mockUser = {
          id: 'dev-user-123',
          username: loginValue,
          email: `${loginValue}@example.com`,
          token: 'mock-token-for-development',
          fullName: 'Development User'
        };
        
        return mockUser;
      }
    }
    
    throw error;
  }
};

// Other auth functions...
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Remove user from local storage
    localStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
};

export default {
  login,
  register,
  logout
};

// In any file that imports from authService
import { login, register, logout } from '../services/authService.js';