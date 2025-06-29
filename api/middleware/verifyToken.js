import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      
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

