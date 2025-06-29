import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "../api/models/Message.js";
import Chat from "../api/models/Chat.js";

// Load environment variables from .env file
dotenv.config();

// Get client URL and port from environment variables
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const PORT = process.env.PORT || 4001;

// Allow multiple client origins
const allowedOrigins = [
  CLIENT_URL,
  "http://localhost:5173",
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
  return onlineUsers.find((user) => user.userId === userId);
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
    console.log(
      `📨 Message from ${data.senderId} to ${receiverId}: ${data.content.substring(
        0,
        20
      )}...`
    );

    // Get the socket's user ID from the onlineUsers array
    const socketUser = onlineUsers.find((user) => user.socketId === socket.id);

    if (!socketUser) {
      console.warn(`⚠️ Unauthorized socket attempt to send message`);
      return;
    }

    if (data.senderId !== socketUser.userId) {
      console.warn(
        `⚠️ User ${socketUser.userId} attempted to send message as ${data.senderId}. Blocked.`
      );
      return;
    }

    // Save message to DB
    try {
      // Find the chat
      const chat = await Chat.findById(data.chatId);
      if (!chat) {
        console.warn(`❌ Chat not found: ${data.chatId}`);
        return;
      }
      // Check if sender is a participant
      if (![chat.user1Id.toString(), chat.user2Id.toString()].includes(data.senderId)) {
        console.warn(`❌ Sender is not a participant in chat ${data.chatId}`);
        return;
      }
      // Create and save the message
      const newMessage = await Message.create({
        content: data.content,
        senderId: data.senderId,
        conversationId: data.chatId,
      });
      // Add message to chat
      chat.messages.push(newMessage._id);
      chat.lastMessage = data.content;
      await chat.save();
      // Emit to receiver if online
      const receiver = getUser(receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("getMessage", {
          ...data,
          id: newMessage._id,
          createdAt: newMessage.createdAt,
        });
      } else {
        // Store pending messages for offline users
        if (!global.pendingMessages) {
          global.pendingMessages = {};
        }
        if (!global.pendingMessages[receiverId]) {
          global.pendingMessages[receiverId] = [];
        }
        global.pendingMessages[receiverId].push({
          ...data,
          id: newMessage._id,
          createdAt: newMessage.createdAt,
        });
        console.log(`📫 Message stored for offline user ${receiverId}`);
      }
    } catch (err) {
      console.error("❌ Error saving message to DB:", err);
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
