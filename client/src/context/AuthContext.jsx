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
      const response = await fetch('http://localhost:4000/api/auth/register', {
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
      
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Login successful:', result);

        const userData = {
          ...result.user,
          token: result.token || `user_${result.user.id}`,
          lastLogin: new Date().toISOString()
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed, checking localStorage:', error);
      
      // Fallback - check localStorage for existing user
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Ensure token exists
        if (!userData.token) {
          userData.token = `user_${userData.id}`;
        }
        
        userData.lastLogin = new Date().toISOString();
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
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