import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      const socketConnection = socketService.connect(user.id);
      setSocket(socketConnection);

      return () => {
        socketService.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    sendMessage: socketService.sendMessage.bind(socketService),
    onMessage: socketService.onMessage.bind(socketService),
    offMessage: socketService.offMessage.bind(socketService),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};