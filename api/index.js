import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Import your routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import chatRoutes from './routes/chat.route.js';

// Configure dotenv with proper path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Create Express app instance
const app = express();

console.log('📋 Environment variables loaded:');
console.log('- MONGO_URI:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('- JWT_SECRET_KEY:', process.env.JWT_SECRET_KEY ? '✓ Set' : '✗ Missing');
console.log('- PORT:', process.env.PORT || '4000 (default)');

// Check database connection
const checkDatabaseConnection = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL;
    if (!mongoUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUrl);
    
    // Get database stats if connection is successful
    let stats = {};
    try {
      stats = {
        users: await mongoose.connection.db.collection('users').countDocuments(),
        posts: await mongoose.connection.db.collection('posts').countDocuments()
      };
    } catch (statError) {
      console.warn('Could not get collection stats:', statError.message);
    }
    
    console.log('✅ Database connected successfully');
    console.log(`✅ Database statistics: ${stats.users || 0} users, ${stats.posts || 0} posts`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware for logging requests
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📥 ${req.method} ${req.url}`);
  
  // Add a listener for when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Base API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'PropertyState API is running',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/users', '/api/posts', '/api/chats'],
    documentation: 'API documentation coming soon'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    dbConnected: mongoose.connection.readyState === 1
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  
  // Send detailed error in development, limited info in production
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack,
      path: req.path
    });
  } else {
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect to database and start server
const startServer = async () => {
  const dbConnected = await checkDatabaseConnection();
  
  // Even if DB connection fails, start server for development purposes
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (!dbConnected) {
      console.warn('⚠️ Server running without database connection. Some features may not work.');
    }
  });
};

startServer();