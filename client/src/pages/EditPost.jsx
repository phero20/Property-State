import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    address: '',
    city: '',
    type: 'rent',
    property: 'apartment',
    bedroom: 1,
    bathroom: 1,
    images: [],
    description: '',
    postDetail: {
      desc: '',
      utilities: '',
      pet: '',
      income: '',
      size: '',
      school: '',
      bus: '',
      restaurant: ''
    }
  });
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await postAPI.getPost(id);
        const postData = response.data || response;
        const ownerId = postData.userId?._id || postData.userId || postData.ownerInfo?.id;
        if (!user || ownerId !== user._id) {
          setError("You don't have permission to edit this property");
          toast.error("You don't have permission to edit this property");
          return;
        }
        setFormData({
          title: postData.title || '',
          price: postData.price || '',
          address: postData.address || '',
          city: postData.city || '',
          type: postData.type || 'rent',
          property: postData.property || 'apartment',
          bedroom: postData.bedroom || 1,
          bathroom: postData.bathroom || 1,
          images: postData.images || [],
          description: postData.postDetail?.desc || postData.description || '',
          postDetail: {
            desc: postData.postDetail?.desc || '',
            utilities: postData.postDetail?.utilities || '',
            pet: postData.postDetail?.pet || '',
            income: postData.postDetail?.income || '',
            size: postData.postDetail?.size || '',
            school: postData.postDetail?.school || '',
            bus: postData.postDetail?.bus || '',
            restaurant: postData.postDetail?.restaurant || ''
          }
        });
      } catch (error) {
        setError('Failed to load property details.');
        toast.error(`Failed to load property details. ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      postDetail: {
        ...prev.postDetail,
        [name]: value
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64Images = await Promise.all(files.map(toBase64));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...base64Images] }));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { postDetail, ...rest } = formData;
      const finalPostDetail = { ...postDetail, desc: formData.postDetail?.desc || '' };
      const postData = { ...rest };
      delete postData.description;
      await postAPI.updatePost(id, { postData, postDetail: finalPostDetail });
      toast.success('Property updated successfully!');
      navigate(`/posts/${id}`);
    } catch (error) {
      setError('Failed to update property.');
      toast.error(`Failed to update property. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: 'var(--bg-main)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--theme-accent)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-error-bg, #fef2f2)', border: '1px solid var(--theme-accent)', color: 'var(--theme-accent)' }}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/posts')}
            className="mt-4 px-4 py-2 rounded hover:opacity-90 transition-colors"
            style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer' }}
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ background: 'var(--bg-main)' }}>
      <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: 'var(--theme-accent)' }}>Edit Property</h1>
      {/* Owner Information Display (if user) */}
      {user && (
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--theme-accent)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--theme-accent)' }}>Property Owner Information</h3>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold" style={{ background: 'var(--theme-accent)', color: '#fff' }}>
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                user.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{user.fullName || user.username}</p>
                {user.verified && <span className="text-green-600">✅</span>}
              </div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>{user.email}</p>
              {user.phone && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>📱 {user.phone}</p>
              )}
              {user.location && (
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>📍 {user.location}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs rounded p-2" style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> This information will be visible to potential buyers/renters so they can contact you about the property.
          </div>
        </div>
      )}
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${currentStep >= 1 ? '' : 'text-gray-400'}`}
          style={currentStep >= 1 ? { color: 'var(--theme-accent)' } : {}}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? '' : 'bg-gray-300'}`}
            style={currentStep >= 1 ? { background: 'var(--theme-accent)', color: '#fff' } : {}}>
            1
          </span>
          <span className="ml-2">Basic Info</span>
        </div>
        <div className={`w-16 h-1 mx-4 ${currentStep >= 2 ? '' : 'bg-gray-300'}`}
          style={currentStep >= 2 ? { background: 'var(--theme-accent)' } : {}}></div>
        <div className={`flex items-center ${currentStep >= 2 ? '' : 'text-gray-400'}`}
          style={currentStep >= 2 ? { color: 'var(--theme-accent)' } : {}}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? '' : 'bg-gray-300'}`}
            style={currentStep >= 2 ? { background: 'var(--theme-accent)', color: '#fff' } : {}}>
            2
          </span>
          <span className="ml-2">Details</span>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="rounded-lg shadow-md p-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-main)' }}>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Enter property title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                >
                  <option value="rent">For Rent</option>
                  <option value="buy">For Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Property Type *
                </label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="land">Land</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedroom"
                  value={formData.bedroom}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Number of bedrooms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathroom"
                  value={formData.bathroom}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Number of bathrooms"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Images (Max 5MB each)
                </label>
                <input
                  id="image-upload-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Large images will be automatically compressed for faster upload
                </p>
              </div>
            </div>
            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images ({formData.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 rounded hover:opacity-90 transition cursor-pointer"
                style={{ background: 'var(--theme-accent)', color: 'white' }}
              >
                Next: Edit Details
              </button>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div className="rounded-lg shadow-md p-6" style={{ background: 'var(--bg-card)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-main)' }}>Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Description
                </label>
                <textarea
                  name="desc"
                  value={formData.postDetail?.desc || ''}
                  onChange={handleDetailChange}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Describe the property..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Utilities
                </label>
                <select
                  name="utilities"
                  value={formData.postDetail?.utilities || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                >
                  <option value="">Select</option>
                  <option value="Included">Included</option>
                  <option value="Not included">Not included</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Pet Policy
                </label>
                <select
                  name="pet"
                  value={formData.postDetail?.pet || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                >
                  <option value="">Select</option>
                  <option value="Allowed">Allowed</option>
                  <option value="Not allowed">Not allowed</option>
                  <option value="Cats only">Cats only</option>
                  <option value="Dogs only">Dogs only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Income Requirement
                </label>
                <input
                  type="text"
                  name="income"
                  value={formData.postDetail?.income || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="e.g., 3x rent, Good credit required"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Size (sq ft)
                </label>
                <input
                  type="number"
                  name="size"
                  value={formData.postDetail?.size || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Square footage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  School (minutes away)
                </label>
                <input
                  type="number"
                  name="school"
                  value={formData.postDetail?.school || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Minutes to nearest school"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Bus Stop (minutes away)
                </label>
                <input
                  type="number"
                  name="bus"
                  value={formData.postDetail?.bus || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Minutes to bus stop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Restaurant (minutes away)
                </label>
                <input
                  type="number"
                  name="restaurant"
                  value={formData.postDetail?.restaurant || ''}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
                  style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
                  placeholder="Minutes to nearest restaurant"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 rounded hover:opacity-90 transition cursor-pointer"
                style={{ background: 'var(--text-light)', color: '#fff' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--theme-accent)', color: 'white' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditPost;