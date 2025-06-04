import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Simple mock implementation of token verification

export const verifyToken = async (req, res, next) => {
  try {
    console.log('🔒 Verifying authentication token (mock)');
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided in Authorization header');
      return res.status(401).json({ message: 'Not authenticated. No token provided.' });
    }
    
    // For mock purposes, just accept any token
    const token = authHeader.split(' ')[1];
    console.log('🔑 Found token:', token.substring(0, 10) + '...');
    
    // Add a mock userId to the request
    req.userId = 'mock-user-123';
    
    // Continue to the next middleware or route handler
    console.log('✅ Token verified successfully (mock)');
    next();
  } catch (err) {
    console.error('❌ Authentication error:', err);
    res.status(401).json({ message: 'Authentication failed' });
  }
};