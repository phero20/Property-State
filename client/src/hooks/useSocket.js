import { useEffect } from 'react';
import socketService from '../services/socket.js';
import { useAuth } from '../context/AuthContext';

export const useSocket = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    }

    return () => {
      if (!user?.id) {
        socketService.disconnect();
      }
    };
  }, [user?.id]);

  return socketService;
};