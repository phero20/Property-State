import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 Connecting to socket server:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      secure: SOCKET_URL.startsWith('https'), // Enable secure flag for HTTPS
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected!');
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);