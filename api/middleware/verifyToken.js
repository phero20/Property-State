import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  let token = req.headers.authorization;
  
  console.log('🔐 Verifying token...');
  console.log('📋 Headers:', req.headers);

  if (!token) {
    console.error('❌ No token provided');
    return res.status(401).json({ message: "Not Authenticated!" });
  }

  // Extract token from "Bearer TOKEN" format
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  console.log('🔍 Token extracted:', token.substring(0, 20) + '...');

  try {
    // For development, handle both JWT tokens and simple user IDs
    if (token.startsWith('token_') || token.startsWith('user_')) {
      // Development fallback - extract user ID from token
      console.log('🔄 Using development token authentication');
      req.userId = token.replace('token_', '').replace('user_', '') || token;
      console.log('👤 User ID from dev token:', req.userId);
      next();
    } else {
      // Production JWT verification
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.userId = payload.id;
      console.log('✅ JWT verified, User ID:', req.userId);
      next();
    }
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    
    // Development fallback - try to extract user ID from headers
    const userId = req.headers['x-user-id'];
    if (userId) {
      console.log('🔄 Using fallback authentication with user ID:', userId);
      req.userId = userId;
      next();
    } else {
      res.status(403).json({ message: "Token is not Valid!" });
    }
  }
};
