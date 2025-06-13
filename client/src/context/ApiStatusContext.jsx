import React, { createContext, useContext, useState } from 'react';

const ApiStatusContext = createContext();

export const useApiStatus = () => useContext(ApiStatusContext);

export const ApiStatusProvider = ({ children }) => {
  // Always set API as online
  const [apiOnline] = useState(true);

  return (
    <ApiStatusContext.Provider value={{ apiOnline: true }}>
      {children}
    </ApiStatusContext.Provider>
  );
};