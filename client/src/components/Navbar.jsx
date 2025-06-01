import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await userAPI.getNotifications();
      setNotifications(response.data || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(0); // Fallback to 0 notifications
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false); // Close mobile menu
    navigate('/');
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600" onClick={closeMenu}>
            Property State
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/posts" className="text-gray-700 hover:text-blue-600 transition-colors">
              Properties
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/add-post"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Property
                </Link>
                <Link to="/chat" className="text-gray-700 hover:text-blue-600 transition-colors relative">
                  Messages
                  {notifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Profile
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username || 'User'} 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      (user?.username || user?.fullName || 'U')?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-gray-700">
                    Hi, {user?.fullName || user?.username || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t bg-white">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/posts" 
                className="text-gray-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                onClick={closeMenu}
              >
                Properties
              </Link>
              
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-2 px-2 bg-blue-50 rounded mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.username || 'User'} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        (user?.username || user?.fullName || 'U')?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.fullName || user?.username || 'User'}
                      </p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/add-post" 
                    className="text-gray-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    Add Property
                  </Link>
                  <Link 
                    to="/chat" 
                    className="text-gray-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-gray-50 transition-colors flex items-center justify-between"
                    onClick={closeMenu}
                  >
                    <span>Messages</span>
                    {notifications > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-gray-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600 py-2 px-2 rounded hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-800 py-2 px-2 rounded hover:bg-blue-50 font-medium transition-colors"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;