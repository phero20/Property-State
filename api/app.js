import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import testRoute from "./routes/test.route.js";
import postRoute from "./routes/post.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";
import debugRoute from "./routes/debug.route.js";

const app = express();

// Middleware
app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true
}));

// Increase payload limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/test", testRoute);
app.use("/api/posts", postRoute);
app.use("/api/users", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/messages", messageRoute);
app.use('/api/debug', debugRoute);

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
      posts: "/api/posts",
      users: "/api/users",
      chats: "/api/chats",
      messages: "/api/messages",
      test: "/api/test"
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

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 CORS enabled for: http://localhost:5173`);
  console.log(`🌟 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoints: /api/chats, /api/messages`);
});

export default app;
