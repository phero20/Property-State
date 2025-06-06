import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, chatAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-toastify';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading post details for ID:', id);
      
      // Try to get from API first
      try {
        const response = await postAPI.getPost(id);
        setPost(response.data);
        console.log('✅ Post loaded from API:', response.data);
      } catch (apiError) {
        console.log('🔄 API unavailable, checking localStorage...');
        
        // Fallback to localStorage
        const allPosts = JSON.parse(localStorage.getItem('allPosts') || '[]');
        const foundPost = allPosts.find(p => p.id === id);
        
        if (foundPost) {
          setPost(foundPost);
          console.log('✅ Post loaded from localStorage:', foundPost);
        } else {
          throw new Error('Post not found');
        }
      }
      
      setError(null);
    } catch (error) {
      console.error('❌ Error loading post:', error);
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  };

  // Enhance the handleContactOwner function with better error handling
  const handleContactOwner = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      console.log('🔄 Contacting owner. Post data:', post);
      
      // Get the owner ID from the correct location
      const ownerId = post.postedById || (post.ownerInfo && post.ownerInfo.id) || post.userId;
      
      console.log('🔄 Owner ID:', ownerId);
      console.log('🔄 Current user:', user);
      
      // Check if IDs are valid
      if (!ownerId) {
        console.error('❌ Post has no owner ID');
        throw new Error('Cannot contact owner: post has no owner information');
      }
      
      if (ownerId === user.id) {
        toast.info("This is your own post!");
        return;
      }
      
      setContacting(true); // Use contacting instead of loading to avoid UI confusion
      toast.info("Creating conversation...");
      
      const response = await chatAPI.createChat(ownerId, post.id);
      console.log('✅ Conversation created/retrieved:', response.data);
      
      toast.success("Conversation created! Redirecting to chat...");
      
      // Navigate to chat with this conversation selected
      navigate('/chat', { state: { selectedChatId: response.data.id } });
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      
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
        toast.error('Failed to contact the owner. Please try again later.');
      }
    } finally {
      setContacting(false);
    }
  };

  const handleShowContact = () => {
    if (!isAuthenticated) {
      alert('Please login to view contact information');
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
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/posts')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse All Properties
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
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        ← Back to Properties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="relative bg-gray-200 rounded-lg overflow-hidden mb-6" style={{ height: '400px' }}>
            {post.images && post.images.length > 0 ? (
              <>
                <img
                  src={post.images[currentImageIndex]}
                  alt={`${post.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                
                {/* Navigation Arrows */}
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      →
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {post.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
                    {currentImageIndex + 1} / {post.images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400 text-6xl">🏠</span>
              </div>
            )}
            
            {/* Fallback placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: 'none' }}>
              <span className="text-gray-400 text-6xl">🏠</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
              <span className={`px-3 py-1 rounded text-sm font-semibold text-white ${
                post.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                For {post.type === 'rent' ? 'Rent' : 'Sale'}
              </span>
            </div>

            <div className="flex items-center text-gray-600 mb-4">
              <span className="mr-4">📍 {post.address ? `${post.address}, ` : ''}{post.city}</span>
              <span className="text-sm">Posted {formatDate(post.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-3xl font-bold text-blue-600">
                {formatPrice(post.price)}
                {post.type === 'rent' && <span className="text-lg font-normal">/month</span>}
              </div>
              
              <div className="flex space-x-6 text-gray-700">
                {post.bedroom > 0 && (
                  <span className="flex items-center">
                    🛏️ {post.bedroom} bed{post.bedroom > 1 ? 's' : ''}
                  </span>
                )}
                {post.bathroom > 0 && (
                  <span className="flex items-center">
                    🚿 {post.bathroom} bath{post.bathroom > 1 ? 's' : ''}
                  </span>
                )}
                {post.postDetail?.size && (
                  <span className="flex items-center">
                    📐 {post.postDetail.size} sq ft
                  </span>
                )}
              </div>
            </div>

            {/* Property Description */}
            {post.postDetail?.desc && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{post.postDetail.desc}</p>
              </div>
            )}

            {/* Property Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.postDetail?.utilities && (
                <div>
                  <h4 className="font-semibold mb-2">🔌 Utilities</h4>
                  <p className="text-gray-700">{post.postDetail.utilities}</p>
                </div>
              )}
              
              {post.postDetail?.pet && (
                <div>
                  <h4 className="font-semibold mb-2">🐕 Pet Policy</h4>
                  <p className="text-gray-700">{post.postDetail.pet}</p>
                </div>
              )}
              
              {post.postDetail?.income && (
                <div>
                  <h4 className="font-semibold mb-2">💰 Income Requirement</h4>
                  <p className="text-gray-700">{post.postDetail.income}</p>
                </div>
              )}
            </div>

            {/* Nearby Amenities */}
            {(post.postDetail?.school || post.postDetail?.bus || post.postDetail?.restaurant) && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Nearby Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {post.postDetail.school && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl mb-1">🏫</div>
                      <div className="font-medium">Schools</div>
                      <div className="text-sm text-gray-600">{post.postDetail.school} Minutes</div>
                    </div>
                  )}
                  
                  {post.postDetail.bus && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl mb-1">🚌</div>
                      <div className="font-medium">Public Transport</div>
                      <div className="text-sm text-gray-600">{post.postDetail.bus} Minutes</div>
                    </div>
                  )}
                  
                  {post.postDetail.restaurant && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl mb-1">🍽️</div>
                      <div className="font-medium">Restaurants</div>
                      <div className="text-sm text-gray-600">{post.postDetail.restaurant} Minutes</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Owner Information */}
          {post.ownerInfo && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Property Owner</h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold">
                  {post.ownerInfo.avatar ? (
                    <img 
                      src={post.ownerInfo.avatar} 
                      alt={post.ownerInfo.username} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    (post.ownerInfo.fullName || post.ownerInfo.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">
                      {post.ownerInfo.fullName || post.ownerInfo.username}
                    </h4>
                    {post.ownerInfo.verified && (
                      <span className="text-green-600 text-sm">✅</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">@{post.ownerInfo.username}</p>
                  {post.ownerInfo.location && (
                    <p className="text-gray-500 text-sm">📍 {post.ownerInfo.location}</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Member since {formatDate(post.ownerInfo.memberSince)}</p>
                {post.ownerInfo.userType && (
                  <p className="capitalize">{post.ownerInfo.userType} account</p>
                )}
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleContactOwner}
                  disabled={!isAuthenticated || post.ownerInfo.id === user?.id}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {!isAuthenticated ? 'Login to Contact' : 
                   post.ownerInfo.id === user?.id ? 'Your Property' : 
                   '💬 Send Message'}
                </button>

                {post.ownerInfo.showContactInfo && (
                  <button
                    onClick={handleShowContact}
                    disabled={!isAuthenticated}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                  >
                    📞 Show Contact Info
                  </button>
                )}
              </div>

              {/* Debug Socket Connection - DEV ONLY */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    console.log('📊 Debug Socket Connection:');
                    console.log('Socket service:', socketService);
                    console.log('Current socket ID:', socketService.getSocketId());
                    console.log('Current user ID:', user?.id);
                    console.log('Property owner ID:', post.ownerInfo?.id);
                    console.log('Available routes:', ['/chat', '/messages']);
                  }}
                  className="mt-2 w-full bg-gray-100 text-xs text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Debug Socket Connection
                </button>
              )}

              {/* Contact Information */}
              {showContactInfo && post.ownerInfo.showContactInfo && (
                <div className="mt-4 p-3 bg-gray-50 rounded border-t">
                  <h5 className="font-semibold mb-2">Contact Information</h5>
                  <div className="space-y-1 text-sm">
                    <p>📧 {post.ownerInfo.email}</p>
                    {post.ownerInfo.phone && (
                      <p>📱 {post.ownerInfo.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Location</h3>
            <div className="bg-gray-100 h-48 rounded flex items-center justify-center">
              <span className="text-gray-500">🗺️ Map coming soon</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              📍 {post.address ? `${post.address}, ` : ''}{post.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;