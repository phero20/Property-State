import React from 'react';

// Always pass through children without checking API status
const ServerStatusChecker = ({ children }) => {
  return <>{children}</>;
};

export default ServerStatusChecker;