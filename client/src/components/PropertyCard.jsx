import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaBed, FaBath, FaRulerCombined, FaCheckCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser } from 'react-icons/fa';

const PropertyCard = ({ post, isSaved }) => {
  console.log('PropertyCard post:', post);
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
      <div className="rounded-lg p-4 text-center" style={{ background: 'var(--bg-card)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Property data unavailable</p>
      </div>
    );
  }

  return (
  <div
    className="group relative cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-transparent hover:border-[var(--theme-accent)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] w-full max-w-md"
    style={{ minWidth: 0 }}
    onClick={handleClick}
  >
    {/* Header Image */}
    <div className="relative w-full h-48 bg-[var(--bg-light-accent)] flex items-center justify-center">
      {post.images?.length > 0 ? (
        <img
          src={post.images[0]}
          alt={post.title || 'Property Image'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
          }}
        />
      ) : (
        <FaHome className="text-5xl text-[var(--theme-accent)]" />
      )}

      {/* Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="px-3 py-1 text-xs font-semibold text-white rounded-full shadow-md" style={{ background: post.type === 'rent' ? 'var(--theme-accent)' : 'var(--hover-theme-accent)' }}>
          For {post.type === 'rent' ? 'Rent' : 'Sale'}
        </span>
      </div>

      {/* Image Count Badge */}
      {post.images?.length > 1 && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-10">
          <FaHome className="text-xs text-[var(--theme-accent)]" /> {post.images.length}
        </div>
      )}
    </div>

    {/* Card Body */}
    <div className="flex flex-col gap-4 p-4">
      {/* Title & Price */}
      <div className="flex flex-col">
        <h2 className="text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>
          {post.title || 'Untitled Property'}
        </h2>
        <p className="text-lg font-bold" style={{ color: 'var(--theme-accent)' }}>
          {formatPrice(post.price)}
          {post.type === 'rent' && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mo</span>}
        </p>
        <p className="text-xs mt-1 flex items-center text-[var(--text-muted)]">
          <FaMapMarkerAlt className="mr-1" />
          {post.address ? `${post.address}, ` : ''}{post.city || 'Location not specified'}
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 text-xs">
        {post.bedroom > 0 && (
          <span className="flex items-center gap-1 text-[var(--text-light)] bg-[var(--bg-main)] px-2 py-1 rounded-full font-medium">
            🛏️ {post.bedroom} Bed{post.bedroom > 1 ? 's' : ''}
          </span>
        )}
        {post.bathroom > 0 && (
          <span className="flex items-center gap-1 text-[var(--text-light)] bg-[var(--bg-main)] px-2 py-1 rounded-full font-medium">
            🛁 {post.bathroom} Bath{post.bathroom > 1 ? 's' : ''}
          </span>
        )}
        {post.property && (
          <span className="flex items-center gap-1 text-[var(--text-light)] bg-[var(--bg-main)] px-2 py-1 rounded-full font-medium">
            🏬 {post.property}
          </span>
        )}
      </div>

      {/* Owner Info */}
      <div className="flex items-center gap-3 border-t text-[var(--text-light)] pt-3" style={{ borderColor: 'var(--text-light)' }}>
        <div className="w-9 h-9 rounded-full bg-[var(--theme-accent)] text-white flex items-center justify-center shadow">
          {post.ownerInfo?.avatar ? (
            <img
              src={post.ownerInfo.avatar}
              alt={post.ownerInfo.username || 'Owner'}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <FaUser />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-main)' }}>
            {post.ownerInfo?.fullName || post.ownerInfo?.username || 'Property Owner'}
            {post.ownerInfo?.verified && (
              <FaCheckCircle className="text-green-500 text-xs ml-1" title="Verified" />
            )}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            Posted {formatDate(post.createdAt)}
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default PropertyCard;