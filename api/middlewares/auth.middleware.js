const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    console.log('🔒 Verifying auth token...');
    
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Extract token from Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid token format, should be "Bearer [token]"');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('❌ Token not found in Authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Log token for debugging (first part only for security)
    console.log('🔑 Token received:', token.substring(0, 15) + '...');
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log('✅ Token verified for user:', decoded.id || decoded._id);
      
      // Add user ID to request
      req.userId = decoded.id || decoded._id;
      req.user = decoded;
      
      next();
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyToken };