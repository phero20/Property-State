import React from 'react';
import { useNavigate } from 'react-router-dom';

const PropertyCard = ({ post, isSaved }) => {
  const navigate = useNavigate();

  // Use post._id for navigation and logic
  const handleClick = () => {
    // Pass isSaved state if provided (for saved posts tab)
    navigate(`/posts/${post._id}`, { state: { isSaved: !!isSaved } });
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle missing post data gracefully
  if (!post) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center">
        <p className="text-gray-500">Property data unavailable</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-gray-200"
      onClick={handleClick}
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0]}
            alt={post.title || 'Property'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: post.images?.length ? 'none' : 'flex' }}>
          <span className="text-gray-400 text-4xl">🏠</span>
        </div>
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
            post.type === 'rent' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            For {post.type === 'rent' ? 'Rent' : 'Sale'}
          </span>
        </div>
        
        {/* Image Count */}
        {post.images && post.images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
            📸 {post.images.length}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Price and Title */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {post.title || 'Untitled Property'}
            </h3>
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(post.price)}
              {post.type === 'rent' && <span className="text-sm font-normal">/mo</span>}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 flex items-center">
            📍 {post.address ? `${post.address}, ` : ''}{post.city || 'Location not specified'}
          </p>
        </div>

        {/* Property Features */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {(post.bedroom || 0) > 0 && (
            <span className="flex items-center">
              🛏️ {post.bedroom} bed{post.bedroom > 1 ? 's' : ''}
            </span>
          )}
          {(post.bathroom || 0) > 0 && (
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

        {/* Owner Information */}
        {post.ownerInfo && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {post.ownerInfo.avatar ? (
                  <img 
                    src={post.ownerInfo.avatar} 
                    alt={post.ownerInfo.username || 'Owner'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  (post.ownerInfo.username || post.ownerInfo.fullName || 'U')?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.ownerInfo.fullName || post.ownerInfo.username || 'Property Owner'}
                  </p>
                  {post.ownerInfo.verified && (
                    <span className="text-green-600 text-xs">✅</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>@{post.ownerInfo.username || 'owner'}</span>
                  {post.ownerInfo.location && (
                    <>
                      <span>•</span>
                      <span>📍 {post.ownerInfo.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Contact Information (if allowed) */}
            {post.ownerInfo.showContactInfo && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {post.ownerInfo.email && (
                  <p>📧 {post.ownerInfo.email}</p>
                )}
                {post.ownerInfo.phone && (
                  <p>📱 {post.ownerInfo.phone}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Posted Date */}
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-gray-500">
            Posted {formatDate(post.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;