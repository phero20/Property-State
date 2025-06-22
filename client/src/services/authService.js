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
    // Use axios for better error handling
    const response = await axios.post(`${API_URL}/auth/login`, {
      [loginField]: loginValue,
      password: credentials.password
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
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