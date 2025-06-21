import React, { createContext, useContext, useState, useEffect } from 'react';

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
        console.log('🔍 Restored user from localStorage:', userData);
        
        // Ensure user has a valid token
        if (!userData.token) {
          userData.token = `user_${userData.id}`;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Registration attempt...');
      
      // Try API registration first
      const response = await fetch('http://property-state.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Registration successful:', result);
        
        const completeUserData = {
          ...result.user,
          token: result.token || `user_${result.user.id}`,
          fullName: userData.fullName || userData.username,
          phone: userData.phone || '',
          city: userData.city || '',
          state: userData.state || '',
          location: userData.city && userData.state ? `${userData.city}, ${userData.state}` : '',
          showContactInfo: userData.showContactInfo ?? true,
          lastLogin: new Date().toISOString(),
        };

        setUser(completeUserData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(completeUserData));
        
        return { success: true, user: completeUserData };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed, using fallback:', error);
      
      // Fallback for development
      const fallbackUserData = {
        id: `user_${Date.now()}`,
        username: userData.username,
        email: userData.email,
        token: `user_${Date.now()}`, // Generate a development token
        avatar: null,
        createdAt: new Date().toISOString(),
        fullName: userData.fullName || userData.username,
        phone: userData.phone || '',
        city: userData.city || '',
        state: userData.state || '',
        location: userData.city && userData.state ? `${userData.city}, ${userData.state}` : '',
        showContactInfo: userData.showContactInfo ?? true,
        verified: false,
        lastLogin: new Date().toISOString(),
      };

      console.log('✅ Fallback user created:', fallbackUserData);
      
      setUser(fallbackUserData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(fallbackUserData));
      
      return { success: true, user: fallbackUserData };
    }
  };

  const login = async (credentials) => {
    try {
      console.log('🔐 Login attempt...');
      
      // Determine which field to use (email or username)
      const isEmailLogin = !!credentials.email;
      const loginField = isEmailLogin ? 'email' : 'username';
      const loginValue = credentials[loginField];
      
      console.log(`🔑 Attempting login with ${loginField}: ${loginValue}`);
      
      const response = await fetch('http://property-state.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [loginField]: loginValue,
          password: credentials.password
        }),
        credentials: 'include' // Important for cookies
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Login successful:', result);

        const userData = {
          ...result,
          token: result.token || `user_${result.id}`,
          lastLogin: new Date().toISOString()
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // For development - try fallback
      if (process.env.NODE_ENV === 'development') {
        try {
          const devCredentials = credentials.email || credentials.username;
          // Create a mock user for development
          const mockUser = {
            id: `dev_${Date.now()}`,
            username: devCredentials.split('@')[0] || 'devuser',
            email: credentials.email || `${credentials.username}@example.com`,
            token: `dev_token_${Date.now()}`,
            lastLogin: new Date().toISOString()
          };
          
          console.log('🔧 Development mode: Creating mock user session:', mockUser.username);
          
          setUser(mockUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(mockUser));
          
          return { success: true, user: mockUser };
        } catch (e) {
          console.error('Failed to create development user');
        }
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      console.log('👋 User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Add this function to refresh user data
  const refreshUserData = async () => {
    try {
      if (user && user.id) {
        const response = await userAPI.getUserProfile(user.id);
        if (response.data) {
          // Update only user data, not token
          setUser(prev => ({ 
            ...prev, 
            ...response.data,
            token: prev.token // Keep existing token
          }));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Call this when needed
  useEffect(() => {
    if (isAuthenticated) {
      refreshUserData();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.token) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  const validateToken = (token) => {
    if (!token) return false;
    
    try {
      // For JWT tokens
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now(); // Check if token is expired
    } catch (e) {
      console.error('Error validating token:', e);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;