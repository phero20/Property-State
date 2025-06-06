import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
  try {
    // Log the authorization header for debugging
    console.log('🔑 Authorization Header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log('✅ Token verified, decoded payload:', decoded);
      
      // Set the user information in the request object
      req.user = decoded;
      
      // Ensure the user ID is set correctly
      if (!req.user.id) {
        // Try to find id from possible field names
        if (req.user._id) req.user.id = req.user._id;
        else if (req.user.userId) req.user.id = req.user.userId;
        
        if (!req.user.id) {
          console.error('❌ User ID not found in token payload');
          return res.status(400).json({ message: 'Invalid token format: user ID missing' });
        }
      }
      
      console.log('👤 User ID extracted from token:', req.user.id);
      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(400).json({ message: 'Invalid token.', error: error.message });
    }
  } catch (error) {
    console.error('❌ Unexpected error in verifyToken middleware:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// In the handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isAuthenticated || !user) {
    alert('Please login to create a post');
    navigate('/login');
    return;
  }

  setLoading(true);

  try {
    // Simple validation
    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      alert('Please fill in all required fields');
      setLoading(false);
      return;
    }

    console.log('📝 Submitting post...');
    
    // Format the data properly for the API
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
      
      // Format post details as expected by the API
      postDetail: {
        desc: postDetail.desc || '',
        utilities: postDetail.utilities || '',
        pet: postDetail.pet || '',
        income: postDetail.income || '',
        size: postDetail.size ? parseInt(postDetail.size) : null,
        school: postDetail.school ? parseInt(postDetail.school) : null,
        bus: postDetail.bus ? parseInt(postDetail.bus) : null,
        restaurant: postDetail.restaurant ? parseInt(postDetail.restaurant) : null,
      }
    };
    
    console.log('📤 Sending post data:', postData);
    
    // Call the API to create the post
    const response = await createPost(postData);
    console.log('✅ Post created successfully:', response);
    
    // Clear the form and show success message
    resetForm();
    alert('Post created successfully!');
    
    // Navigate to the posts page
    navigate('/posts');
  } catch (error) {
    console.error('❌ Error creating post:', error);
    alert('Failed to create post: ' + (error.message || 'Unknown error'));
  } finally {
    setLoading(false);
  }
};
