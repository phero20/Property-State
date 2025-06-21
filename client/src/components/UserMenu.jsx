import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <Link 
        to="/login" 
        className="text-gray-700 hover:text-blue-600 font-medium"
      >
        Login / Sign Up
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center text-gray-700 hover:text-blue-600 font-medium"
      >
        <span className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mr-2">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <span>{user?.username || 'User'}</span>
        <svg
          className={`ml-1 h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <Link
            to="/profile"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
            onClick={() => setIsOpen(false)}
          >
            My Profile
          </Link>
          <Link
            to="/my-posts"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
            onClick={() => setIsOpen(false)}
          >
            My Properties
          </Link>
          <Link
            to="/saved"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
            onClick={() => setIsOpen(false)}
          >
            Saved Properties
          </Link>
          <Link
            to="/messages"
            className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
            onClick={() => setIsOpen(false)}
          >
            Messages
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;