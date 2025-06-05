import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173", // client URL
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

  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    // Broadcast online users to all connected clients
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    console.log(
      `📨 Message from ${data.senderId} to ${receiverId}: ${data.content}`
    );
    const receiver = getUser(receiverId);

    if (receiver) {
      console.log(
        `✅ Receiver ${receiverId} is online with socket ${receiver.socketId}`
      );
      io.to(receiver.socketId).emit("getMessage", data);
    } else {
      console.log(
        `❌ Receiver ${receiverId} is offline, message will be delivered when they connect`
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    removeUser(socket.id);
    // Broadcast online users to all connected clients
    io.emit("onlineUsers", onlineUsers.map((u) => u.userId));
  });
});

// Use port 4001 for socket server
io.listen(4001);
console.log("🔌 Socket.io server running on port 4001");
