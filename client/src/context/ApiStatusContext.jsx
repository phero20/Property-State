import React, { createContext, useState, useContext, useEffect } from 'react';

const ApiStatusContext = createContext({
  isServerOnline: false,
  isUsingMockData: true,
  checkServerStatus: () => {}
});

export const ApiStatusProvider = ({ children }) => {
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  
  const checkServerStatus = async () => {
    try {
      // Try a common endpoint that should exist
      const response = await fetch('http://localhost:4000/api', {
        method: 'HEAD', // Only request headers, not the full response
        signal: AbortSignal.timeout(2000)
      });
      
      // Consider any response as online (even 404, which means server is up but route doesn't exist)
      // This is because the API server is responding, even if the specific endpoint doesn't exist
      const online = response.status !== 0;
      console.log('🔌 API server status check:', online ? 'Online' : 'Offline', `(${response.status})`);
      
      setIsServerOnline(online);
      setIsUsingMockData(!online);
      return online;
    } catch (error) {
      console.log('⚠️ API server check failed:', error.message);
      setIsServerOnline(false);
      setIsUsingMockData(true);
      return false;
    }
  };
  
  useEffect(() => {
    // Check on mount and periodically
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ApiStatusContext.Provider value={{ isServerOnline, isUsingMockData, checkServerStatus }}>
      {children}
    </ApiStatusContext.Provider>
  );
};

export const useApiStatus = () => useContext(ApiStatusContext);

export default ApiStatusContext;