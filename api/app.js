import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import mongoose from "mongoose";

const app = express();
// app.use(cors())
// Allow requests from any origin
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || '*');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());



// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/messages", messageRoute);
app.use('/api/posts', postRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "API is running!", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Property State API", 
    status: "Running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      chats: "/api/chats",
      messages: "/api/messages"
    }
  });
});

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// OR even simpler
app.head('/api', (req, res) => {
  res.status(200).end();
});

const PORT = process.env.PORT || 4000;

// Increase server-side timeout
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Set server timeout to 2 minutes (120000 ms)
  server.timeout = 120000;
});

// Add MongoDB connection timeout handling
mongoose.connect(process.env.DATABASE_URL, {
  serverSelectionTimeoutMS: 60000, // 1 minute
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000
}).then(()=>{
  console.log('conncted to mongodb');

}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

export default app;
