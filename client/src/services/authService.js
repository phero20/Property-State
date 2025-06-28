import axios from 'axios';

// Use the VITE_API_URL environment variable
const API_URL = 'http://localhost:4000/api';

export const login = async (credentials) => {
  console.log('🔐 Login attempt...');
  
  // Determine which field to use (email or username)
  const isEmail = !!credentials.email || (credentials.inputType === 'email');
  const loginField = isEmail ? 'email' : 'username';
  const loginValue = credentials[loginField] || credentials.input;
  
  console.log(`🔑 Attempting login with ${loginField}: ${loginValue}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { userData: credentials }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const result = response.data;
    if (result.success) {
      const completeUserData = {
        ...result.user,
        token: result.token,
        lastLogin: new Date().toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(completeUserData));
    }
    return result;
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    return { success: false, message };
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, { userData }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const result = response.data;
    if (result.success) {
      const completeUserData = {
        ...result.user,
        token: result.token,
        lastLogin: new Date().toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(completeUserData));
    }
    return result;
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    return { success: false, message };
  }
};

export const logout = async () => {
  try {
    localStorage.removeItem('user');
    return { success: true };
  } catch {
    return { success: false, message: 'Logout error' };
  }
};

// Export default as an object with the same functions
export default {
  login,
  register,
  logout
};