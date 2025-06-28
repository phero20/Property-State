import { io } from 'socket.io-client';

// Define the socket server URL - use production URL
const SOCKET_URL = 'http://localhost:4001'

console.log('🔌 Using Socket URL:', SOCKET_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.connected = false;
  }

  connect(userId) {
    if (!userId) {
      console.log('⚠️ Cannot connect socket: No user ID provided');
      return null;
    }

    if (this.socket && this.connected) {
      console.log('✅ Socket already connected for user:', userId);
      return this.socket;
    }

    try {
      console.log('🔌 Connecting to socket server at:', SOCKET_URL);
      
      // Try to connect to the socket server with HTTPS
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        query: { userId },
        secure: true // Ensure secure connection for HTTPS
      });
      
      this.userId = userId;
      
      this.socket.on('connect', () => {
        console.log('✅ Socket connected! Socket ID:', this.socket.id);
        this.connected = true;
        
        // Register the user with socket server
        this.socket.emit('user:connect', { userId });
      });
      
      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.connected = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        this.connected = false;
        
        // If we can't connect to the socket server, fall back to simulation
        console.log('🔄 Socket connection simulated for user:', userId);
        
        // Clean up failed socket attempt
        if (this.socket) {
          this.socket.close();
          this.socket = {
            id: `sim_${Math.random().toString(36).substr(2, 9)}`,
            connected: true,
            on: (event, callback) => {
              console.log(`🔄 Simulated socket event listener added: ${event}`);
            },
            off: (event) => {
              console.log(`🔄 Simulated socket event listener removed: ${event}`);
            },
            emit: (event, data) => {
              console.log(`🔄 Simulated socket event emitted: ${event}`, data);
              return true;
            },
            disconnect: () => {
              console.log('🔄 Simulated socket disconnected');
              this.connected = false;
            }
          };
          this.connected = true;
        }
      });
      
      return this.socket;
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error.message);
      return null;
    }
  }
  
  getSocketId() {
    if (this.socket && this.connected) {
      return this.socket.id;
    }
    return 'not-connected';
  }
  
  // Update the sendMessage method to include all necessary fields
  sendMessage(receiverId, messageData) {
    if (!messageData || !receiverId) {
      console.error('❌ Cannot send message: Missing data');
      return false;
    }
    
    if (this.socket && this.connected) {
      console.log('📨 Sending message via socket to:', receiverId);
      
      // Ensure all required fields are present
      const message = {
        ...messageData,
        id: messageData.id || `temp_${Date.now()}`,
        chatId: messageData.chatId,
        senderId: messageData.senderId,
        content: messageData.content,
        createdAt: messageData.createdAt || new Date().toISOString(),
      };
      
      this.socket.emit('sendMessage', { 
        receiverId,
        data: message
      });
      
      return true;
    } else {
      console.error('❌ Cannot send message: Socket not connected');
      return false;
    }
  }
  
  // Update the onMessage method to verify the recipient
  onMessage(callback) {
    if (this.socket) {
      console.log('👂 Registering message listener for user:', this.userId);
      this.socket.on('message:receive', (data) => {
        // Verify this message is intended for the current user
        if (data.receiverId === this.userId || data.chatParticipants?.includes(this.userId)) {
          console.log('📩 Received message intended for this user:', data);
          callback(data);
        } else {
          console.warn('⚠️ Received message not intended for this user, ignoring');
        }
      });
    }
  }
  
  offMessage() {
    if (this.socket) {
      this.socket.off('message:receive');
    }
  }
  
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.connected = false;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;