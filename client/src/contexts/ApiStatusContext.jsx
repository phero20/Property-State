import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ApiStatusContext = createContext();

export const ApiStatusProvider = ({ children }) => {
  const [apiStatus, setApiStatus] = useState({
    online: false,
    loading: true,
    lastChecked: null
  });

  const checkApiStatus = async () => {
    try {
      // Use the health check endpoint
      const response = await axios.head('http://property-state.onrender.com/api/health', {
        timeout: 3000,
      });
      
      console.log(`🔌 API server status check: Online (${response.status})`);
      setApiStatus({
        online: true,
        loading: false,
        lastChecked: new Date(),
        statusCode: response.status
      });
    } catch (error) {
      let statusCode = error.response?.status || 'unknown';
      console.log(`🔌 API server status check: Offline (${error.message})`);
      setApiStatus({
        online: false,
        loading: false,
        lastChecked: new Date(),
        statusCode,
        error: error.message
      });
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Set up interval to check every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ApiStatusContext.Provider value={{ apiStatus, checkApiStatus }}>
      {children}
    </ApiStatusContext.Provider>
  );
};