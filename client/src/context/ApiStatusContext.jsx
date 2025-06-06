import React, { createContext, useState, useEffect, useContext } from 'react';

// Define the base API URL correctly
const API_URL = 'http://localhost:4000';

// Create the context
const ApiStatusContext = createContext({
  isApiOnline: false,
  setApiOnline: () => {}
});

export const ApiStatusProvider = ({ children }) => {
  const [isApiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    // Function to check if API is online
    const checkApiStatus = async () => {
      try {
        // Use a more reliable endpoint that likely exists in your API
        // '/health' or '/api/health' would be even better if you have it
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${API_URL}`, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Any response means the server is up, even 404
        // This is enough to know the server is running
        setApiOnline(true);
        console.log(`🔌 API server status check: Online (${response.status})`);
      } catch (error) {
        // Only log if it's not an abort error
        if (error.name !== 'AbortError') {
          console.log('📴 API server appears to be offline');
          setApiOnline(false);
        }
      }
    };

    // Check immediately on load
    checkApiStatus();
    
    // Then check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <ApiStatusContext.Provider value={{ isApiOnline, setApiOnline }}>
      {children}
    </ApiStatusContext.Provider>
  );
};

export const useApiStatus = () => useContext(ApiStatusContext);

export default ApiStatusContext;