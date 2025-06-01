import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4001';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  connect(userId) {
    if (!this.socket && userId) {
      console.log('🔌 Connecting to socket server:', SOCKET_URL);
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });
      
      this.userId = userId;

      this.socket.on('connect', () => {
        console.log('✅ Connected to socket server with ID:', this.socket.id);
        this.socket.emit('newUser', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from socket server');
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ Socket connection error:', error);
      });
    }
    
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from socket server');
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  sendMessage(receiverId, messageData) {
    if (this.socket) {
      console.log('📤 Sending message via socket to:', receiverId);
      this.socket.emit('sendMessage', {
        receiverId,
        data: messageData
      });
    } else {
      console.log('❌ Socket not connected, cannot send message');
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('getMessage', callback);
    }
  }

  offMessage() {
    if (this.socket) {
      this.socket.off('getMessage');
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;