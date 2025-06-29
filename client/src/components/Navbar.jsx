import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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

  const handleAddProperty = (e) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login', { 
        state: { from: '/add-post', message: 'Please login to add a property' } 
      });
    } 
    // Otherwise do nothing - the Link will navigate normally
  };

  return (
    <nav className="border-b fixed z-50 w-full border-slate-200 dark:border-slate-950 backdrop-blur-md transition-colors duration-300" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white tracking-tight hover:text-[var(--theme-accent)] dark:hover:text-[var(--theme-accent)] transition-colors focus:outline-none"
            onClick={closeMenu}
            style={{ letterSpacing: '0.01em' }}
          >
            <span className="text-2xl mr-1">🏠</span>
            <span>Property State</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center lg:space-x-6 xl:space-x-8">
            <NavLink
              to="/posts"
              className={({ isActive }) =>
                `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors 
                ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} 
                after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 
                ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}`.replace(/\n/g, ' ')
              }
              end
            >
              Properties
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/add-post"
                  className={({ isActive }) =>
                    `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-all duration-500 text-slate-700 dark:text-slate-100
                    after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5
                    ${isActive ? 'bg-transparent after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] text-white after:transition-transform after:origin-left hover:after:scale-x-100'}
                    min-w-[130px] text-center bg-[var(--theme-accent)]  text-slate-700 dark:text-white rounded-md hover:scale-105 hover:bg-[var(--hover-theme-accent)] transition-all duration-500`
                  }
                  onClick={handleAddProperty}
                  style={{ minWidth: '130px', textAlign: 'center' }}
                >
                  + Add Property
                </NavLink>
                <NavLink
                  to="/chat"
                  className={({ isActive }) =>
                    `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                    ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                    after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                    ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}`
                  }
                >
                  Messages
                  {notifications > 0 && (
                    <span className="absolute top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-white dark:border-slate-900 shadow-sm">
                      {notifications}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                    ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                    after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                    ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                    `
                  }
                >
                  Profile
                </NavLink>
                <div className="flex items-center space-x-2 ml-2">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-base font-semibold border border-slate-300 dark:border-slate-600 shadow-sm overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username || 'User'}
                        className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                      />
                    ) : (
                      (user?.username || user?.fullName || 'U')?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-slate-900 dark:text-white font-medium text-base">
                    {user?.fullName || user?.username || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 min-w-[90px] text-center px-4 py-1.5 bg-red-600 dark:bg-red-700 hover:scale-105 text-white rounded-md font-semibold border border-red-700 hover:bg-red-700 dark:hover:bg-red-800 transition-all duration-500 focus:outline-none cursor-pointer"
                  type="button"
                  style={{ minWidth: '90px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                    ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                    after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                    ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                    `
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="min-w-[110px] text-center px-4 py-2 bg-[var(--theme-accent)] text-white rounded-md font-semibold shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-colors cursor-pointer"
                  style={{ minWidth: '110px' }}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-900 dark:text-white hover:text-[var(--theme-accent)] dark:hover:text-[var(--theme-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] rounded p-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
            type="button"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden py-4 mb-4 mt-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur rounded-xl shadow animate-fade-in transition-colors duration-300">
            <div className="flex flex-col space-y-3 px-2">
              <NavLink
                to="/posts"
                className={({ isActive }) =>
                  `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                  ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                  after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                  ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                  `
                }
                onClick={closeMenu}
              >
                Properties
              </NavLink>
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 py-2 px-2 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2 border border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold border border-slate-300 dark:border-slate-600 overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-600"
                        />
                      ) : (
                        (user?.username || user?.fullName || 'U')?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-base">
                        {user?.fullName || user?.username || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <NavLink
                    to="/add-post"
                    className={({ isActive }) =>
                      `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                      ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                      after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                      ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                      `
                    }
                    onClick={handleAddProperty}
                  >
                    + Add Property
                  </NavLink>
                  <NavLink
                    to="/chat"
                    className={({ isActive }) =>
                      `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                      ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                      after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                      ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'} flex items-center justify-between`
                    }
                    onClick={closeMenu}
                  >
                    <span>Messages</span>
                    {notifications > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-white dark:border-slate-900">
                        {notifications}
                      </span>
                    )}
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                      ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                      after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                      ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                      `
                    }
                    onClick={closeMenu}
                  >
                    Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="text-left w-full py-2 px-3 bg-red-600 dark:bg-red-700 text-white rounded-md font-semibold border border-red-700 hover:bg-red-700 dark:hover:bg-red-800 transition mt-2 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-700 cursor-pointer"
                    type="button"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `relative font-medium px-3 py-2 focus:outline-none cursor-pointer transition-colors \
                      ${isActive ? 'text-[var(--theme-accent)]' : 'text-slate-700 dark:text-slate-100'} \
                      after:content-[''] after:block after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 \
                      ${isActive ? 'after:scale-x-100 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left after:opacity-100' : 'after:scale-x-0 after:bg-[var(--theme-accent)] after:transition-transform after:origin-left hover:after:scale-x-100'}
                      `
                    }
                    onClick={closeMenu}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="py-2 px-3 bg-[var(--theme-accent)] text-white rounded-md font-semibold shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] transition-colors cursor-pointer"
                    onClick={closeMenu}
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Add the CSS variable to index.css:
// :root {
//   --theme-accent: rgb(16 185 129); /* Tailwind emerald-500 */
// }

export default Navbar;