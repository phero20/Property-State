import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, chatAPI,userAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaArrowRight, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaRegStar, FaStar, FaBed, FaBath, FaRulerCombined, FaPlug, FaDog, FaMoneyBillWave, FaSchool, FaBus, FaUtensils, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  // Use location.state?.isSaved as initial value if present
  const [isSaved, setIsSaved] = useState(location.state?.isSaved || false);
  const hasInitialIsSaved = useRef(!!location.state?.isSaved);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  useEffect(() => {
    checkIfSaved();
  }, [id, isAuthenticated]);

  const loadPost = async () => {
    try {
      setLoading(true);
      // Removed debug console logs
      try {
        const response = await postAPI.getPost(id);
        setPost(response);
      } catch (apiError) {
        const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
        const foundPost = allPosts.find(p => p._id === id);
        if (foundPost) {
          setPost(foundPost);
        } else {
          throw new Error('Post not found');
        }
      }
      setError(null);
    } catch (error) {
      setError('Post not found');
      toast.error(`Post not found. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!isAuthenticated) {
      setIsSaved(false);
      return;
    }
    try {
      const savedPostsRes = await userAPI.getSavedPosts();
      const savedPosts = savedPostsRes.data || [];
      // Only update isSaved if not set from router state
      if (!hasInitialIsSaved.current) {
        setIsSaved(savedPosts.some((p) => String(p._id) === String(id)));
      }
    } catch (err) {
      if (!hasInitialIsSaved.current) {
        setIsSaved(false);
      }
    }
  };

  // Enhance the handleContactOwner function with better error handling
  const handleContactOwner = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      // Removed debug console logs
      const ownerId = post.postedById || (post.ownerInfo && post.ownerInfo.id) || post.userId;
      // Removed debug console logs
      if (!ownerId) {
        toast.error('Cannot contact owner: post has no owner information');
        throw new Error('Cannot contact owner: post has no owner information');
      }
      if (ownerId === user._id) {
        toast.info("This is your own post!");
        return;
      }
      setContacting(true);
      toast.info("Creating conversation...");
      const response = await chatAPI.createChat(ownerId, post.id);
      toast.success("Conversation created! Redirecting to chat...");
      navigate('/chat', { state: { selectedChatId: response.data.id } });
    } catch (error) {
      // More specific error messages based on error type
      if (error.response?.status === 404) {
        toast.error('User not found. They may have deleted their account.');
      } else if (error.response?.status === 500) {
        if (error.response.data?.error?.includes('fullName')) {
          toast.error('Sorry, there was a database schema issue. Please try again later.');
        } else {
          toast.error('Server error. Please try again later.');
        }
      } else {
        toast.error(`Failed to contact the owner. ${error.message}`);
      }
    } finally {
      setContacting(false);
    }
  };

  const handleShowContact = () => {
    if (!isAuthenticated) {
      toast.info('Please login to view contact information');
      navigate('/login');
      return;
    }
    setShowContactInfo(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
    
  // Save/Unsave Post Handler
  const handleSaveUnsave = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to save properties.');
      navigate('/login');
      return;
    }
    // Optimistic UI update
    const prevSaved = isSaved;
    setIsSaved(!isSaved);
    try {
      if (prevSaved) {
        await userAPI.unsavePost(post._id);
        toast.success('Property unsaved!');
      } else {
        await userAPI.savePost(post._id);
        toast.success('Property saved!');
      }
      // No need to re-check, we already updated the state
    } catch (err) {
      // Rollback UI state
      setIsSaved(prevSaved);
      toast.error('Failed to update saved properties.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <FaExclamationTriangle className="text-6xl mb-4" style={{ color: 'var(--theme-accent)' }} />
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-main)' }}>Property Not Found</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>The property you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/posts')}
            className="px-6 py-3 rounded-md hover:opacity-90 transition-colors font-semibold flex items-center gap-2"
            style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer' }}
          >
            <FaArrowLeft style={{ color: 'white' }} /> Browse All Properties
          </button>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    }
  };

  const prevImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/posts')}
        className="mb-6 flex items-center cursor-pointer hover:border-b border-[var(--theme-accent)] transition-colors"
        style={{ color: 'var(--theme-accent)' }}
      >
        ← Back to Properties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Image Gallery */}
          <div
            className="relative rounded-2xl overflow-hidden mb-4 group shadow-md"
            style={{ background: 'var(--bg-light-accent)', height: '400px', cursor: post.images && post.images.length > 1 ? 'pointer' : 'default' }}
            onClick={() => post.images && post.images.length > 1 && nextImage()}
          >
            {post.images && post.images.length > 0 ? (
              <>
                <img
                  src={post.images[currentImageIndex]}
                  alt={`${post.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ background: 'var(--bg-card)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
                {/* Navigation Arrows */}
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity z-10 shadow-md "
                      style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer', width: 30, height: 30 }}
                      tabIndex={0}
                    >
                      <FaArrowLeft size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center rounded-full hover:opacity-80 transition-opacity z-10 shadow-md "
                      style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer', width: 30, height: 30 }}
                      tabIndex={0}
                    >
                      <FaArrowRight size={15} />
                    </button>
                  </>
                )}
                {/* Image Counter */}
                {post.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 px-3 py-1 rounded text-sm z-10 shadow-md" style={{ background: 'var(--theme-accent)', color: 'white' }}>
                    {currentImageIndex + 1} / {post.images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '3rem' }}>🏠</span>
              </div>
            )}
            {/* Fallback placeholder */}
            <div className="w-full h-full flex items-center justify-center" style={{ display: 'none', background: 'var(--bg-card)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '3rem' }}>🏠</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="rounded-2xl shadow-md p-6 flex flex-col gap-6" style={{ background: 'var(--bg-card)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-main)' }}>{post.title}</h1>
              <span className="px-3 py-1 rounded text-sm font-semibold text-white self-start sm:self-auto" style={{ background: post.type === 'rent' ? 'var(--theme-accent)' : 'var(--hover-theme-accent)' }}>
                For {post.type === 'rent' ? 'Rent' : 'Sale'}
              </span>
            </div>

            <div className="flex flex-wrap items-center text-sm mb-2 gap-2" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1 mr-4"><FaMapMarkerAlt style={{ color: 'var(--theme-accent)' }} /> {post.address ? `${post.address}, ` : ''}{post.city}</span>
              <span className="text-xs">Posted {formatDate(post.createdAt)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--theme-accent)' }}>
                {formatPrice(post.price)}
                {post.type === 'rent' && <span className="text-lg font-normal" style={{ color: 'var(--text-muted)' }}>/month</span>}
              </div>
              <div className="flex flex-wrap gap-4 text-base" style={{ color: 'var(--text-main)' }}>
                {post.bedroom > 0 && (
                  <span className="flex items-center bg-gray-500/40 rounded-md p-1 gap-1">🛏️ {post.bedroom} bed{post.bedroom > 1 ? 's' : ''}</span>
                )}
                {post.bathroom > 0 && (
                   <span className="flex items-center bg-gray-500/40 rounded-md p-1 gap-1">🛁 {post.bathroom} bath{post.bathroom > 1 ? 's' : ''}</span>
                )}
                {post.postDetail?.size && (
                   <span className="flex items-center bg-gray-500/40 rounded-md p-1 gap-1">📐 {post.postDetail.size} sq ft</span>
                )}
                {post.property && (
                   <span className="flex items-center bg-gray-500/40 rounded-md p-1 gap-1">🏬 {post.property}</span>
                )}
              </div>
            </div>

            {/* Property Description */}
            {post.postDetail?.desc && (
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 flex-wrap break-words" style={{ color: 'var(--text-main)' }}><FaRegStar style={{ color: 'var(--theme-accent)' }} />
                <span className="break-words">Description</span>
                </h3>
                <p className='break-words w-full' style={{ color: 'var(--text-muted)' }}>{post.postDetail.desc}</p>
              </div>
            )}

            {/* Property Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.postDetail?.utilities && (
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><span>🔌</span> Utilities</h4>
                  <p style={{ color: 'var(--text-muted)' }}>{post.postDetail.utilities}</p>
                </div>
              )}
              {post.postDetail?.pet && (
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><span>🐶</span> Pet Policy</h4>
                  <p style={{ color: 'var(--text-muted)' }}>{post.postDetail.pet}</p>
                </div>
              )}
              {post.postDetail?.income && (
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><span>💵</span> Income Requirement</h4>
                  <p style={{ color: 'var(--text-muted)' }}>{post.postDetail.income}</p>
                </div>
              )}
            </div>

            {/* Nearby Amenities */}
            {(post.postDetail?.school || post.postDetail?.bus || post.postDetail?.restaurant) && (
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><span>📍</span> Nearby Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {post.postDetail.school && (
                    <div className="text-center p-3 rounded flex flex-col items-center gap-1" style={{ background: 'var(--bg-light-accent)' }}>
                      <span style={{ fontSize: '2rem' }}>🏫</span>
                      <div className="font-medium" style={{ color: 'var(--text-main)' }}>Schools</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.postDetail.school} Minutes</div>
                    </div>
                  )}
                  {post.postDetail.bus && (
                    <div className="text-center p-3 rounded flex flex-col items-center gap-1" style={{ background: 'var(--bg-light-accent)' }}>
                      <span style={{ fontSize: '2rem' }}>🚌</span>
                      <div className="font-medium" style={{ color: 'var(--text-main)' }}>Public Transport</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.postDetail.bus} Minutes</div>
                    </div>
                  )}
                  {post.postDetail.restaurant && (
                    <div className="text-center p-3 rounded flex flex-col items-center gap-1" style={{ background: 'var(--bg-light-accent)' }}>
                      <span style={{ fontSize: '2rem' }}>🍽️</span>
                      <div className="font-medium" style={{ color: 'var(--text-main)' }}>Restaurants</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.postDetail.restaurant} Minutes</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          {/* Owner Information */}
          {post.ownerInfo && (
            <div className="rounded-2xl shadow-md p-6 mb-6 flex flex-col gap-4" style={{ background: 'var(--bg-card)' }}>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-main)' }}>🏠 Property Owner</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold" style={{ background: 'var(--theme-accent)' }}>
                  {post.ownerInfo.avatar ? (
                    <img 
                      src={post.ownerInfo.avatar} 
                      alt={post.ownerInfo.username} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span role="img" aria-label="User">👤</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold" style={{ color: 'var(--text-main)' }}>
                      {post.ownerInfo.fullName || post.ownerInfo.username}
                    </h4>
                    {post.ownerInfo.verified && (
                      <span className="text-green-600 text-sm" title="Verified">✅</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{post.ownerInfo.username}</p>
                  {post.ownerInfo.location && (
                    <p className="text-sm flex mt-1 gap-1 items-center" style={{ color: 'var(--text-muted)' }}><FaMapMarkerAlt style={{ color: 'var(--theme-accent)' }} /> {post.ownerInfo.location}</p>
                  )}
                </div>
              </div>
              <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                <p>Member since {formatDate(post.ownerInfo.memberSince)}</p>
                {post.ownerInfo.userType && (
                  <p className="capitalize">{post.ownerInfo.userType} account</p>
                )}
              </div>

              {/* If current user is the owner, show Edit and Delete buttons */}
              {isAuthenticated && user && post.ownerInfo.id === user._id && (
                <div className="flex flex-col space-y-2 mb-4">
                  <button
                    onClick={() => navigate(`/edit-post/${post._id}`)}
                    className="w-full px-4 py-2 rounded-md hover:opacity-90 text-white transition-colors flex items-center justify-center gap-2"
                    style={{ background: 'var(--theme-accent)', cursor: 'pointer' }}
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        try {
                          await postAPI.deletePost(post._id);
                          toast.success('Post deleted!');
                          navigate('/posts');
                        } catch (err) {
                          toast.error('Failed to delete post.');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 rounded-md text-white hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                    style={{ background: '#dc2626', cursor: 'pointer' }}
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              )}

              {/* Contact Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleContactOwner}
                  disabled={!isAuthenticated || post.ownerInfo.id === user?._id}
                  className="w-full px-4 py-3 rounded-md hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer' }}
                >
                  <FaEnvelope style={{ color: 'white' }} />
                  {!isAuthenticated ? 'Login to Contact' : 
                   post.ownerInfo.id === user?._id ? 'Your Property' : 
                   'Send Message'}
                </button>

                {/* Save/Unsave Post Button */}
                {isAuthenticated && post.ownerInfo.id !== user?._id && (
                  <button
                    onClick={handleSaveUnsave}
                    disabled={!isAuthenticated}
                    className={`w-full px-4 py-3 rounded-md hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${isSaved ? 'bg-[#797979] text-zinc-900' : 'bg-[var(--theme-accent)] text-white'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {isSaved ? '⭐ Unsave Property' : '🌟 Save Property'}
                  </button>
                )}

                {post.ownerInfo.showContactInfo && (
                  <button
                    onClick={handleShowContact}
                    disabled={!isAuthenticated}
                    className="w-full px-4 py-3 rounded-md hover:opacity-90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-slate-300"
                    style={{ cursor: 'pointer' }}
                  >
                    <FaPhone style={{ color: 'rgb(5,150,105)' }} /> Show Contact Info
                  </button>
                )}
              </div>

              {/* Contact Information */}
              {showContactInfo && post.ownerInfo.showContactInfo && (
                <div className="mt-4 p-4 rounded-lg flex flex-col gap-2 bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-slate-300">
                  <h5 className="font-semibold mb-2 flex items-center gap-2"><FaUser className="inline-block text-[var(--theme-accent)]" />Contact Information</h5>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2"><FaEnvelope className="inline-block text-[var(--theme-accent)]" />{post.ownerInfo.email}</p>
                    {post.ownerInfo.phone && (
                      <p className="flex items-center gap-2"><FaPhone className="inline-block text-[var(--theme-accent)]" />{post.ownerInfo.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map placeholder */}
          <div className="rounded-2xl shadow-md p-6" style={{ background: 'var(--bg-card)' }}>
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-main)' }}>Location</h3>
            <div className="h-48 rounded flex items-center justify-center bg-slate-100">
              <FaMapMarkerAlt style={{ color: 'var(--theme-accent)', fontSize: '2rem' }} />
              <span className="ml-2 text-slate-500">Map coming soon</span>
            </div>
            <p className="text-sm mt-2 flex items-center gap-2 text-slate-500">
              <FaMapMarkerAlt style={{ color: 'var(--theme-accent)' }} /> {post.address ? `${post.address}, ` : ''}{post.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;

// When using getPost, always check for post._id and post.ownerInfo (may be null)
// Example usage:
// const post = await postAPI.getPost(id);
// if (!post || !post._id) { /* handle error */ }
// const owner = post.ownerInfo || {};