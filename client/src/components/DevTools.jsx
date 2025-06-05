import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const quickLogin = async (username, password) => {
    try {
      await login({
        input: username,
        password,
        inputType: 'username'
      });
      navigate('/');
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        title="Developer Tools"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl p-4 mb-2 w-64">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm">Dev Tools</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="pb-2 border-b">
              <p className="text-xs text-gray-500">Quick Login</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => quickLogin('testuser', 'password')}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  testuser
                </button>
                <button
                  onClick={() => quickLogin('admin', 'admin123')}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  admin
                </button>
                <button
                  onClick={() => quickLogin('demo', 'demo')}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  demo
                </button>
              </div>
            </div>
            
            <div className="pb-2 border-b">
              <p className="text-xs text-gray-500">Current User</p>
              {user ? (
                <div className="mt-1 text-xs">
                  <p><span className="font-medium">Username:</span> {user.username}</p>
                  <p><span className="font-medium">Role:</span> {user.role || 'user'}</p>
                  <button
                    onClick={() => logout()}
                    className="mt-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-xs italic">Not logged in</p>
              )}
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Navigation</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/')}
                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/posts')}
                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
                >
                  Posts
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-2 border-t text-center">
            <p className="text-xs text-gray-400">Development Tools</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;