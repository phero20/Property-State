import React from 'react';
import OfflineNotice from './OfflineNotice';
import { useApiStatus } from '../context/ApiStatusContext';

// We'll reuse the API status from the context instead of checking again
const ServerStatusChecker = ({ children }) => {
  const { isApiOnline } = useApiStatus();

  // No need for a separate check since we're using ApiStatusContext
  return (
    <>
      {!isApiOnline && <OfflineNotice />}
      {children}
    </>
  );
};

export default ServerStatusChecker;