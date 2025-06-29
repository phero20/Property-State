import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import PropertyCard from '../components/PropertyCard';
import { toast } from '../utils/toast';
import { FaMapMarkerAlt, FaHome, FaSave } from 'react-icons/fa';
import { MdOutlineMail } from 'react-icons/md';

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

  useEffect(() => {
    if (!user?._id) return;
    loadProfileData();
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === 'saved' && isAuthenticated) {
      fetchSavedPosts();
    }
    // eslint-disable-next-line
  }, [activeTab, isAuthenticated]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchProfilePosts(),
        fetchSavedPosts()
      ]);
    } catch (error) {
      toast.error(`Error loading profile data. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await userAPI.getUserStats();
      setStats(response.data || {
        totalPosts: 0,
        totalViews: 0,
        savedPosts: 0,
        totalMessages: 0
      });
    } catch (error) {
      toast.error(`Error fetching user stats. ${error.message}`);
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
      const response = await userAPI.getProfilePosts(user?._id);
      setUserPosts(response.data || []);
    } catch (error) {
      toast.error(`Error fetching profile posts. ${error.message}`);
      setUserPosts([]);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await userAPI.getSavedPosts();
      const filtered = (response.data || []).filter(Boolean);
      setSavedPosts(filtered);
      setStats((prev) => ({ ...prev, savedPosts: filtered.length }));
      await fetchUserStats();
    } catch (error) {
      toast.error(`Error fetching saved posts. ${error.message}`);
      setSavedPosts([]);
      setStats((prev) => ({ ...prev, savedPosts: 0 }));
      await fetchUserStats();
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = user.token;
    try {
      const updatedData = {
        fullName: editForm.fullName,
        phone: editForm.phone,
        city: editForm.city,
        state: editForm.state,
        showContactInfo: editForm.showContactInfo,
      };
      const response = await userAPI.updateProfile(updatedData);
      if (!response) {
        throw new Error("Failed to update profile");
      }
      updateUser(response.userWithoutPw, token);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(`Failed to update profile. ${error.message}`);
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
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Please login to view your profile</h2>
        <Link to="/login" className="px-8 py-3 rounded-lg font-semibold bg-[var(--theme-accent,#2563eb)] text-white shadow-md hover:bg-[var(--hover-theme-accent,#1d4ed8)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] cursor-pointer">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-4 py-8" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Profile Header */}
      <div className="rounded-2xl shadow-md p-6 md:p-10 mb-10 flex flex-col md:flex-row items-center gap-8 md:gap-12" style={{ background: 'var(--bg-card)' }}>
        {/* Avatar */}
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-[var(--theme-accent,#2563eb)] bg-gradient-to-br from-[var(--theme-accent,#2563eb)] to-[var(--hover-theme-accent,#1d4ed8)] relative overflow-hidden">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full rounded-full object-cover border-none"
            />
          ) : (
            (user?.fullName || user?.username || 'U').charAt(0).toUpperCase()
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 w-full min-w-0">
          <h1 className="text-2xl md:text-4xl font-extrabold truncate" style={{ color: 'var(--text-main)' }}>{user?.fullName || user?.username || 'User'}</h1>
          <p className="font-mono text-base md:text-lg truncate" style={{ color: 'var(--text-muted)' }}>@{user?.username}</p>
          <p className="text-sm md:text-base truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>

          <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-light)' }}>
            <FaMapMarkerAlt className="inline mr-1 mb-0.5 text-[var(--theme-accent)]" />
            {user.address && <span>{user.address}, </span>}
            {user.city && <span>{user.city}, </span>}
            {user.state && <span>{user.state} </span>}
            {user.zipCode && <span>{user.zipCode}, </span>}
            {user.country && <span>{user.country}</span>}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-light)' }}>Member since {formatDate(user?.createdAt)}</p>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-5 py-2.5 rounded-lg font-semibold transition-all shadow border border-[var(--theme-accent,#2563eb)] bg-[var(--theme-accent,#2563eb)] text-white hover:bg-[var(--hover-theme-accent,#1d4ed8)] focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] focus:outline-none text-base md:text-lg min-w-[120px] cursor-pointer"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleEditProfile} className="rounded-2xl shadow-lg p-6 md:p-10 mb-10 animate-fade-in border-[var(--theme-accent,#2563eb)]" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>Full Name</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] transition-colors"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] transition-colors"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>City</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] transition-colors"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>State</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] transition-colors"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)' }}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center" style={{ color: 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={editForm.showContactInfo}
                onChange={(e) => setEditForm({ ...editForm, showContactInfo: e.target.checked })}
                className="mr-2 accent-[var(--theme-accent,#2563eb)]"
                style={{ accentColor: 'var(--theme-accent,#2563eb)' }}
              />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Show contact information to other users</span>
            </label>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-lg font-semibold transition-all shadow border border-[var(--theme-accent,#2563eb)] bg-[var(--theme-accent,#2563eb)] text-white hover:bg-[var(--hover-theme-accent,#1d4ed8)] disabled:opacity-50 focus:ring-2 focus:ring-[var(--theme-accent,#2563eb)] focus:outline-none cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-7 py-2.5 rounded-lg font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all focus:ring-2 focus:ring-gray-400 focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  try {
                    await userAPI.deleteAccount();
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    toast.success('Account deleted successfully.');
                  } catch (err) {
                    toast.error(`Failed to delete account. ${err.message}`);
                  }
                }
              }}
              className="px-7 py-2.5 rounded-lg font-semibold border border-red-600 bg-white text-red-600 hover:text-white hover:bg-red-600 transition-all focus:ring-2 focus:ring-red-400 focus:outline-none cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </form>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="rounded-xl shadow p-6 text-center bg-white dark:bg-slate-800" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>{stats.totalPosts}</div>
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Properties Listed</div>
        </div>
        <div className="rounded-xl shadow p-6 text-center bg-white dark:bg-slate-800" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>{stats.totalViews}</div>
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Total Views</div>
        </div>
        <div className="rounded-xl shadow p-6 text-center bg-white dark:bg-slate-800" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>{stats.savedPosts}</div>
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Saved Properties</div>
        </div>
        <div className="rounded-xl shadow p-6 text-center bg-white dark:bg-slate-800" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
          <div className="text-3xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>{stats.totalMessages}</div>
          <div className="mt-1" style={{ color: 'var(--text-muted)' }}>Messages</div>
        </div>
      </div>
      {/* Tabs */}
      <div className="rounded-2xl shadow-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-2 sm:gap-8 px-4 sm:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 sm:px-4 border-b-2 font-semibold text-base transition-all rounded-t-lg cursor-pointer ${activeTab === tab.id
                  ? 'border-[var(--theme-accent,#2563eb)] text-[var(--theme-accent,#2563eb)] '
                  : 'border-transparent text-gray-500 hover:text-[var(--theme-accent,#2563eb)] hover:border-[var(--theme-accent,#2563eb)]'}`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-normal">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Username:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{user?.username}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Email:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Full Name:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{user?.fullName || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Phone:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{user?.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Location:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{user.address && <span>{user.address}, </span>}{user.city && <span>{user.city}, </span>}{user.state && <span>{user.state} </span>}{user.zipCode && <span>{user.zipCode}, </span>}{user.country && <span>{user.country}</span>}</span>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>Member Since:</span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4" style={{ color: 'var(--text-light)' }}>
                  <p>Your recent property listings and activity will appear here.</p>
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
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
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
                  <FaHome className="text-gray-400 text-6xl mb-4 mx-auto" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Properties Listed</h4>
                  <p className="text-gray-500 mb-6">You haven't listed any properties yet.</p>
                  <Link
                    to="/add-post"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    List Your First Property
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPosts.map(post => (
                    <PropertyCard key={post._id} post={post} />
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
                  <FaSave className="text-gray-400 text-6xl mb-4 mx-auto" />
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">No Saved Properties</h4>
                  <p className="text-gray-500 mb-6">Properties you save will appear here.</p>
                  <Link
                    to="/posts"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedPosts.map(post => (
                    post ? <PropertyCard key={post._id || post.id} post={post} isSaved={true} /> : null
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