import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../hooks/usePosts';

const AddPost = () => {
  const { user, isAuthenticated } = useAuth();
  const { createPost } = usePosts(); // Use the hook instead of direct API call
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    address: '',
    city: '',
    bedroom: '',
    bathroom: '',
    latitude: '',
    longitude: '',
    type: 'rent',
    property: 'apartment',
    images: []
  });

  const [postDetail, setPostDetail] = useState({
    desc: '',
    utilities: '',
    pet: '',
    income: '',
    size: '',
    school: '',
    bus: '',
    restaurant: ''
  });

  // Prevent form from disappearing by checking authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      alert('Please login to create a post');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setPostDetail(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Image compression function
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions - more aggressive resizing
        let { width, height } = img;
        
        // Calculate target dimensions to keep file size reasonable
        let targetWidth = width;
        
        // For large images, scale down more aggressively
        if (width > 1600) {
          targetWidth = 800; // Very large images become 800px wide
        } else if (width > 1200) {
          targetWidth = 700; // Large images become 700px wide
        } else if (width > 800) {
          targetWidth = 600; // Medium-large images become 600px wide
        } else if (width > 600) {
          targetWidth = 500; // Medium images remain 500px wide
        } else if (width > 400) {
          targetWidth = 400; // Smaller images remain as is
        }
        
        // Calculate new height to maintain aspect ratio
        const scaleFactor = targetWidth / width;
        height = Math.round(height * scaleFactor);
        width = targetWidth;
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.fillStyle = '#FFFFFF'; // White background
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use a lower quality for JPEG for smaller file size
        const actualQuality = file.size > 1024 * 1024 ? 0.6 : 0.75; // Lower quality for large files
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          actualQuality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    console.log('📸 Processing images:', files.length);
    
    // Check file sizes before processing
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    
    if (oversizedFiles.length > 0) {
      console.log('⚠️ Large files detected, compressing...');
    }

    try {
      const imagePromises = files.map(async (file) => {
        try {
          // If file is too large, compress it
          if (file.size > maxFileSize) {
            console.log(`🔄 Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            return await compressImage(file, 800, 0.7); // More aggressive compression for large files
          } else {
            console.log(`✅ ${file.name} is acceptable size (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            return await compressImage(file, 1200, 0.9); // Light compression for smaller files
          }
        } catch (error) {
          console.error('❌ Error processing file:', file.name, error);
          return null;
        }
      });

      const imageUrls = await Promise.all(imagePromises);
      const validImageUrls = imageUrls.filter(url => url !== null);
      
      console.log('✅ Images processed successfully:', validImageUrls.length);
      
      setImages(prev => [...prev, ...validImageUrls]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validImageUrls]
      }));
      
      // Show success message
      if (validImageUrls.length > 0) {
        console.log(`📸 ${validImageUrls.length} images uploaded successfully`);
      }
      
    } catch (error) {
      console.error('❌ Error processing images:', error);
      alert('Error processing images. Please try again.');
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleNext = () => {
    // Validate basic info before proceeding
    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      alert('Please login to create a post');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Submitting post with complete owner info...');
      console.log('👤 Current user data:', user);
      
      // Calculate total payload size
      const imagesSizeKB = formData.images.reduce((total, img) => {
        return total + (img.length * 0.75) / 1024;
      }, 0);
      
      console.log(`📦 Total images size: ${(imagesSizeKB / 1024).toFixed(2)}MB`);
      
      if (imagesSizeKB > 40 * 1024) {
        alert('Images are too large. Please remove some images or use smaller files.');
        setLoading(false);
        return;
      }
      
      // IMPORTANT: Make sure to properly format the post data with user connection
      const postData = {
        title: formData.title,
        price: parseInt(formData.price),
        address: formData.address,
        city: formData.city,
        bedroom: parseInt(formData.bedroom) || 0,
        bathroom: parseFloat(formData.bathroom) || 0,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        type: formData.type,
        property: formData.property,
        images: formData.images,
        
        // THIS IS CRITICAL - ensure user connection is properly formatted
        user: {
          connect: { id: user.id }
        },
        
        // Use proper nested structure for post details
        postDetail: {
          create: {
            desc: postDetail.desc || '',
            utilities: postDetail.utilities || '',
            pet: postDetail.pet || '',
            income: postDetail.income || '',
            size: postDetail.size ? parseInt(postDetail.size) : null,
            school: postDetail.school ? parseInt(postDetail.school) : null,
            bus: postDetail.bus ? parseInt(postDetail.bus) : null,
            restaurant: postDetail.restaurant ? parseInt(postDetail.restaurant) : null
          }
        }
      };

      console.log('📤 Sending post data with user ID:', user.id);
      const result = await createPost(postData);
      console.log('✅ Post created successfully:', result);
      
      alert('Post created successfully! Your property listing is now live.');
      
      // Clear form
      setFormData({
        title: '',
        price: '',
        address: '',
        city: '',
        bedroom: '',
        bathroom: '',
        latitude: '',
        longitude: '',
        type: 'rent',
        property: 'apartment',
        images: []
      });
      setPostDetail({
        desc: '',
        utilities: '',
        pet: '',
        income: '',
        size: '',
        school: '',
        bus: '',
        restaurant: ''
      });
      setImages([]);
      
      // Navigate to posts page
      navigate('/posts');
      
    } catch (error) {
      console.error('❌ Error creating post:', error);
      
      // Add more detailed error logging
      if (error.response) {
        console.error('🔍 Server error details:', error.response.data);
        console.error('🔍 Status code:', error.response.status);
        
        if (error.response.data?.error?.includes('user')) {
          alert(`User authentication error: ${error.response.data.message || 'Please login again'}`);
        } else {
          alert(`Error: ${error.response.data?.message || error.message}`);
        }
      } else {
        // Generic error handling
        alert('Error creating post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please login to create a post</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Add New Property</h1>
      
      {/* Owner Information Display */}
      {user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Property Owner Information</h3>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
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
                <p className="font-semibold text-blue-900">{user.fullName || user.username}</p>
                {user.verified && <span className="text-green-600">✅</span>}
              </div>
              <p className="text-sm text-blue-700 mb-1">@{user.username}</p>
              <p className="text-sm text-blue-600">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-blue-600">📱 {user.phone}</p>
              )}
              {user.location && (
                <p className="text-sm text-blue-600">📍 {user.location}</p>
              )}
              <p className="text-xs text-blue-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 bg-blue-100 rounded p-2">
            <strong>Note:</strong> This information will be visible to potential buyers/renters so they can contact you about the property.
          </div>
        </div>
      )}
      
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            1
          </span>
          <span className="ml-2">Basic Info</span>
        </div>
        <div className={`w-16 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            2
          </span>
          <span className="ml-2">Details</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter property title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rent">For Rent</option>
                  <option value="buy">For Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedroom"
                  value={formData.bedroom}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of bedrooms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  name="bathroom"
                  value={formData.bathroom}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of bathrooms"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (Max 5MB each)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Large images will be automatically compressed for faster upload
                </p>
              </div>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
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
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Next: Add Details
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Property Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="desc"
                  value={postDetail.desc}
                  onChange={handleDetailChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the property..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilities
                </label>
                <select
                  name="utilities"
                  value={postDetail.utilities}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Included">Included</option>
                  <option value="Not included">Not included</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Policy
                </label>
                <select
                  name="pet"
                  value={postDetail.pet}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Allowed">Allowed</option>
                  <option value="Not allowed">Not allowed</option>
                  <option value="Cats only">Cats only</option>
                  <option value="Dogs only">Dogs only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Requirement
                </label>
                <input
                  type="text"
                  name="income"
                  value={postDetail.income}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3x rent, Good credit required"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (sq ft)
                </label>
                <input
                  type="number"
                  name="size"
                  value={postDetail.size}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Square footage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School (minutes away)
                </label>
                <input
                  type="number"
                  name="school"
                  value={postDetail.school}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minutes to nearest school"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Stop (minutes away)
                </label>
                <input
                  type="number"
                  name="bus"
                  value={postDetail.bus}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minutes to bus stop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant (minutes away)
                </label>
                <input
                  type="number"
                  name="restaurant"
                  value={postDetail.restaurant}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minutes to nearest restaurant"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddPost;