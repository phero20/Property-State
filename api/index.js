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
import chatRoutes from './routes/chat.routes.js';

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
    console.log(mongoUrl)
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

// Add this before starting your server
// This will print all registered routes
const listRoutes = () => {
  console.log('📋 API Routes:');
  
  const printRoutes = (path, layer) => {
    if (layer.route) {
      layer.route.stack.forEach(routeStack => {
        const method = Object.keys(routeStack.route.methods)[0].toUpperCase();
        console.log(`${method} ${path}${routeStack.route.path}`);
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(stackItem => {
        printRoutes(path + layer.regexp.source.replace("^\\", "").replace("\\/?(?=\\/|$)", ""), stackItem);
      });
    }
  };
  
  app._router.stack.forEach(printRoutes.bind(null, ''));
  console.log('');
};

// Middleware
const allowedOrigins = [
  'https://property-state-1.onrender.com',
  'http://localhost:5173',
  'https://property-state.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware for logging requests
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`🔹 ${req.method} ${req.originalUrl} [${new Date().toISOString()}]`);
  console.log(`📦 Body:`, req.body);
  
  // Add a listener for when the response is completed
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`🔸 ${req.method} ${req.originalUrl} [${res.statusCode}] ${duration}ms`);
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
app.use('/api/chat', chatRoutes); // Note '/api/chat' prefix

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
  const dbConnected = await testDbConnection();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server: Database connection failed');
    process.exit(1);
  }
  
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

// After registering all routes, call this function
listRoutes();

// Log database connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('❗ MongoDB connection disconnected');
});

const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});