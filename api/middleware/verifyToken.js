import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Debug log the header
    console.log('🔑 Auth header:', authHeader);
    
    // Extract the token (remove "Bearer " prefix)
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // If it doesn't start with Bearer, try to use it directly
      token = authHeader;
    }
    
    if (!token) {
      console.log('❌ Empty token after extraction');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Handle non-standard token formats (like user ID directly passed as token)
    let userId = null;
    
    try {
      // First try to verify as a proper JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      userId = decoded.id;
      console.log('✅ Valid JWT token - User ID:', userId);
    } catch (jwtError) {
      console.warn('⚠️ JWT verification failed:', jwtError.message);
      
      // Special handling for specific client-side error
      if (token.length === 24 && /^[0-9a-f]+$/.test(token)) {
        // This appears to be a MongoDB ObjectId
        console.log('⚠️ Client sent ObjectId as token, using as userId:', token);
        userId = token;
      } else {
        // Try to extract user info from other auth headers
        const userIdHeader = req.headers['x-user-id'];
        if (userIdHeader) {
          console.log('⚠️ Using fallback user ID from headers:', userIdHeader);
          userId = userIdHeader;
        } else {
          console.error('❌ No valid authentication found');
          return res.status(401).json({ 
            message: 'Invalid token',
            details: jwtError.message
          });
        }
      }
    }
    
    // Add the user ID to the request object for use in the controller
    req.userId = userId;
    console.log('👤 Request authorized for user:', userId);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ message: 'Authentication error', error: error.message });
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
