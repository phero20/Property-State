import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    savedPosts: 0,
    totalMessages: 0
  });
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    state: '',
    showContactInfo: true
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData();
      setEditForm({
        fullName: user.fullName || user.username || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        showContactInfo: user.showContactInfo ?? true
      });
    }
  }, [isAuthenticated, user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchProfilePosts(),
        fetchSavedPosts()
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log('📊 Fetching user stats...');
      const response = await userAPI.getUserStats();
      setStats(response.data || {
        totalPosts: 0,
        totalViews: 0,
        savedPosts: 0,
        totalMessages: 0
      });
      console.log('✅ User stats loaded:', response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStats({
        totalPosts: 0,
        totalViews: 0,
        savedPosts: 0,
        totalMessages: 0
      });
    }
  };

  const fetchProfilePosts = async () => {
    try {
      console.log('📥 Fetching profile posts...');
      const response = await userAPI.getProfilePosts();
      setUserPosts(response.data || []);
      console.log('✅ Profile posts loaded:', response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching profile posts:', error);
      setUserPosts([]);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      console.log('💾 Fetching saved posts...');
      const response = await userAPI.getSavedPosts();
      setSavedPosts(response.data || []);
      console.log('✅ Saved posts loaded:', response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setSavedPosts([]);
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔄 Updating profile...', editForm);
      
      const updatedData = {
        ...editForm,
        location: editForm.city && editForm.state ? `${editForm.city}, ${editForm.state}` : '',
        lastModified: new Date().toISOString()
      };

      const response = await userAPI.updateProfile(updatedData);
      
      // Update auth context
      await updateUser(updatedData);
      
      setIsEditing(false);
      console.log('✅ Profile updated successfully');
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please login to view your profile</h2>
        <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Go to Login
        </Link>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      count: null
    },
    {
      id: 'posts',
      label: 'My Properties',
      count: userPosts.length
    },
    {
      id: 'saved',
      label: 'Saved Properties',
      count: savedPosts.length
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              (user?.fullName || user?.username || 'U').charAt(0).toUpperCase()
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.fullName || user?.username || 'User'}
            </h1>
            <p className="text-gray-600">@{user?.username}</p>
            <p className="text-gray-600">{user?.email}</p>
            {user?.location && (
              <p className="text-gray-500">📍 {user.location}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleEditProfile} className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={editForm.state}
                  onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.showContactInfo}
                  onChange={(e) => setEditForm({...editForm, showContactInfo: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show contact information to other users</span>
              </label>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalPosts}</div>
          <div className="text-gray-600">Properties Listed</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.totalViews}</div>
          <div className="text-gray-600">Total Views</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.savedPosts}</div>
          <div className="text-gray-600">Saved Properties</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.totalMessages}</div>
          <div className="text-gray-600">Messages</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Username:</span>
                    <span className="ml-2 text-gray-600">{user?.username}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{user?.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Full Name:</span>
                    <span className="ml-2 text-gray-600">{user?.fullName || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-600">{user?.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{user?.location || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Member Since:</span>
                    <span className="ml-2 text-gray-600">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">Your recent property listings and activity will appear here.</p>
                </div>
              </div>
            </div>
          )}

          {/* My Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">My Properties ({userPosts.length})</h3>
                <Link
                  to="/add-post"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Add New Property
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your properties...</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🏠</div>
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Properties Listed</h4>
                  <p className="text-gray-500 mb-6">You haven't listed any properties yet.</p>
                  <Link
                    to="/add-post"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    List Your First Property
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPosts.map((post) => (
                    <div key={post.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={post.images?.[0] || '/placeholder-house.jpg'}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="Arial, sans-serif" font-size="48">🏠</text></svg>';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                            post.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}>
                            {post.type === 'rent' ? 'Rent' : 'Sale'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">📍 {post.city}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(post.price)}
                            {post.type === 'rent' && <span className="text-sm">/mo</span>}
                          </span>
                          <div className="flex space-x-2 text-sm text-gray-500">
                            {post.bedroom > 0 && <span>🛏️ {post.bedroom}</span>}
                            {post.bathroom > 0 && <span>🚿 {post.bathroom}</span>}
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Link
                            to={`/posts/${post.id}`}
                            className="flex-1 bg-blue-600 text-white text-center py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Details
                          </Link>
                          <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded text-sm hover:bg-gray-300 transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Posts Tab */}
          {activeTab === 'saved' && (
            <div>
              <h3 className="text-lg font-semibold mb-6">Saved Properties ({savedPosts.length})</h3>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading saved properties...</p>
                </div>
              ) : savedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💾</div>
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Saved Properties</h4>
                  <p className="text-gray-500 mb-6">Properties you save will appear here.</p>
                  <Link
                    to="/posts"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedPosts.map((post) => (
                    <div key={post.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={post.images?.[0] || '/placeholder-house.jpg'}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="Arial, sans-serif" font-size="48">💾</text></svg>';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                            post.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}>
                            {post.type === 'rent' ? 'Rent' : 'Sale'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">📍 {post.city}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(post.price)}
                            {post.type === 'rent' && <span className="text-sm">/mo</span>}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Link
                            to={`/posts/${post.id}`}
                            className="w-full bg-blue-600 text-white text-center py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View Property
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;