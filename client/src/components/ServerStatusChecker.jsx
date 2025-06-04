import React, { useState, useEffect } from 'react';
import OfflineNotice from './OfflineNotice';

const ServerStatusChecker = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        // Try the base API URL instead of /health
        const response = await fetch('http://localhost:4000/api', { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        // Any response means the server is up
        setIsOffline(response.status === 0);
      } catch (error) {
        console.log('⚠️ API server appears to be offline:', error.message);
        setIsOffline(true);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isOffline && process.env.NODE_ENV !== 'production' && <OfflineNotice />}
      {children}
    </>
  );
};

export default ServerStatusChecker;