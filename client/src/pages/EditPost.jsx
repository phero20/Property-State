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
    <div className="container mx-auto py-8 px-4" style={{ background: 'var(--bg-main)' }}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--theme-accent)' }}>Edit Property</h1>
      <form onSubmit={handleSubmit} className="rounded-lg shadow-md p-6" style={{ background: 'var(--bg-card)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Property Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            >
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Property</label>
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Bedrooms</label>
            <input
              type="number"
              name="bedroom"
              min="1"
              value={formData.bedroom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Bathrooms</label>
            <input
              type="number"
              name="bathroom"
              min="1"
              value={formData.bathroom}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
          <textarea
            name="desc"
            value={formData.postDetail?.desc || ''}
            onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, desc: e.target.value } }))}
            rows={4}
            required
            className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
            style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
          />
        </div>
        {/* Images */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(formData.images || []).map((img, idx) => (
              <img key={idx} src={img} alt="Property" className="w-20 h-20 object-cover rounded border" style={{ borderColor: 'var(--theme-accent)' }} />
            ))}
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded hover:opacity-90 focus:outline-none focus:ring-2 transition cursor-pointer"
            style={{ background: 'var(--theme-accent)', color: 'white' }}
            onClick={() => document.getElementById('image-upload-input').click()}
          >
            Upload Images
          </button>
          <input
            id="image-upload-input"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={async e => {
              const files = Array.from(e.target.files);
              // Convert to base64 and update images array
              const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              const base64Images = await Promise.all(files.map(toBase64));
              setFormData(prev => ({ ...prev, images: [...prev.images, ...base64Images] }));
              // Reset input value so same file can be uploaded again if needed
              e.target.value = '';
            }}
          />
        </div>
        {/* postDetail fields */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Utilities</label>
            <select
              name="utilities"
              value={formData.postDetail?.utilities || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, utilities: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            >
              <option value="">Select</option>
              <option value="included">Included</option>
              <option value="nonincluded">Non-Included</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Pet Policy</label>
            <select
              name="pet"
              value={formData.postDetail?.pet || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, pet: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            >
              <option value="">Select</option>
              <option value="allowed">Allowed</option>
              <option value="not">Not Allowed</option>
              <option value="dogonly">Dog Only</option>
              <option value="catonly">Cat Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Income Requirement</label>
            <input
              type="text"
              name="income"
              value={formData.postDetail?.income || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, income: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Size (sqft)</label>
            <input
              type="text"
              name="size"
              value={formData.postDetail?.size || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, size: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nearby School</label>
            <input
              type="text"
              name="school"
              value={formData.postDetail?.school || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, school: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nearby Bus</label>
            <input
              type="text"
              name="bus"
              value={formData.postDetail?.bus || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, bus: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nearby Restaurant</label>
            <input
              type="text"
              name="restaurant"
              value={formData.postDetail?.restaurant || ''}
              onChange={e => setFormData(prev => ({ ...prev, postDetail: { ...prev.postDetail, restaurant: e.target.value } }))}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={() => navigate(`/posts/${id}`)}
            className="mr-4 px-4 py-2 rounded-md hover:opacity-90 transition-colors"
            style={{ background: 'var(--text-light)', color: '#fff', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md hover:opacity-90 transition-colors"
            style={{ background: 'var(--theme-accent)', color: 'white', cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;