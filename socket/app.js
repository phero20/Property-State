import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "../api/models/Message.js";
import Chat from "../api/models/Chat.js";

// Load environment variables from .env file
dotenv.config();


mongoose.connect(process.env.DATABASE_URL, {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000
}).then(() => {
  console.log('✅ Socket server connected to MongoDB');
}).catch(err => {
  console.error('❌ Socket server MongoDB connection error:', err);
});




// Get client URL and port from environment variables
const CLIENT_URL = process.env.CLIENT_URL;
const PORT = process.env.PORT || 4001;

// Allow multiple client origins
const allowedOrigins = [
  CLIENT_URL,
  process.env.CLIENT_URL,
];

console.log(
  `📝 Socket server will accept connections from: ${allowedOrigins.join(", ")}`
);

const io = new Server({
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  const userExists = onlineUsers.find((user) => user.userId === userId);
  if (!userExists) {
    onlineUsers.push({ userId, socketId });
    console.log(`👤 User ${userId} connected with socket ${socketId}`);
    console.log(`🟢 Online users: ${onlineUsers.length}`);
  } else {
    // Update socket ID if user reconnects
    userExists.socketId = socketId;
    console.log(`👤 User ${userId} reconnected with new socket ${socketId}`);
  }
};

const removeUser = (socketId) => {
  const user = onlineUsers.find((user) => user.socketId === socketId);
  if (user) {
    console.log(`👤 User ${user.userId} disconnected from socket ${socketId}`);
  }
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
  console.log(`🟢 Remaining online users: ${onlineUsers.length}`);
};

const getUser = (userId) => {
  // Always compare as strings
  return onlineUsers.find((user) => user.userId.toString() === userId.toString());
};

io.on("connection", (socket) => {
  console.log(`🔌 New socket connection: ${socket.id}`);

  // Extract userId from the connection handshake
  const userId = socket.handshake.query?.userId;

  if (userId) {
    console.log(`👤 User ${userId} connected via socket ${socket.id}`);
    addUser(userId, socket.id);

    // Store userId in the socket object for later use
    socket.userId = userId;

    // Broadcast online users
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));

    // Deliver any pending messages immediately
    deliverPendingMessages(userId, socket.id);
  }

  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    // Broadcast online users to all connected clients
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));
  });

  // Add this event listener inside the connection scope
  socket.on("user:connect", ({ userId }) => {
    console.log(`👤 User ${userId} connected via socket ${socket.id}`);
    addUser(userId, socket.id);

    // Broadcast online users
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));

    // Deliver any pending messages
    deliverPendingMessages(userId, socket.id);
  });

  // Update the "sendMessage" event handler
  socket.on("sendMessage", async ({ receiverId, data }) => {
    console.log("[DEBUG] sendMessage event received");
    console.log("  data.chatId:", data.chatId);
    console.log("  data.senderId:", data.senderId);
    console.log("  receiverId:", receiverId);
    console.log("Current onlineUsers:", onlineUsers);
    console.log("Looking for receiverId:", receiverId);

    // Just relay the message in real time
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", { ...data });
      console.log("📤 Relayed message to receiver via socket:", receiver.socketId);
    } else {
      // Optionally, store in pending messages or just drop if offline
      console.log("📭 Receiver offline, message not delivered in real time.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    removeUser(socket.id);
    // Broadcast online users to all connected clients
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));
  });
});

// Use environment variable for port
io.listen(PORT);
console.log(`🔌 Socket.io server running on port ${PORT}`);

// Add function to deliver pending messages when a user connects
const deliverPendingMessages = (userId, socketId) => {
  if (global.pendingMessages && global.pendingMessages[userId]) {
    console.log(
      `📬 Delivering ${global.pendingMessages[userId].length} pending messages to user ${userId}`
    );

    global.pendingMessages[userId].forEach((message) => {
      io.to(socketId).emit("getMessage", message);
    });

    // Clear pending messages after delivery
    delete global.pendingMessages[userId];
  }
};
