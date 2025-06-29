import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { userAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    const result = await authService.register(userData);
    if (result.success) {
      setUser({ ...result.user, token: result.token });
      setIsAuthenticated(true);
    }
    setLoading(false);
    return result;
  };

  const login = async (credentials) => {
    setLoading(true);
    const result = await authService.login(credentials);
    if (result.success) {
      setUser({ ...result.user, token: result.token });
      setIsAuthenticated(true);
    }
    setLoading(false);
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Add this function to refresh user data
  const refreshUserData = async () => {
    if (user && user.id) {
      try {
        const response = await userAPI.getProfile();
        if (response.data) {
          setUser(prev => ({ 
            ...prev, 
            ...response.data,
            token: prev.token
          }));
        }
      } catch {
        // Ignore errors
      }
    }
  };

  // Add updateUser function for profile updates
  const updateUser = (updatedUser) => {
    setUser(prev => ({
      ...prev,
      ...updatedUser,
      token: prev?.token // preserve token
    }));
    // Also update localStorage
    localStorage.setItem('user', JSON.stringify({
      ...user,
      ...updatedUser,
      token: user?.token
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshUserData();
    }
  }, [isAuthenticated]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser // <-- expose updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;