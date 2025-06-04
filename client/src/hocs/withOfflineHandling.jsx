import React from 'react';
import { useApiStatus } from '../context/ApiStatusContext';

const withOfflineHandling = (WrappedComponent, offlineMessage) => {
  return (props) => {
    const { isUsingMockData } = useApiStatus();
    
    return (
      <>
        {isUsingMockData && offlineMessage && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-2">
            {offlineMessage}
          </div>
        )}
        <WrappedComponent {...props} />
      </>
    );
  };
};

export default withOfflineHandling;

// Usage example:
// const PostsWithOfflineHandling = withOfflineHandling(
//   Posts, 
//   "You're viewing mock post data while the server is offline."
// );