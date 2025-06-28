import React from 'react';
import { useApiStatus } from '../context/ApiStatusContext';

const withOfflineHandling = (WrappedComponent) => (props) => <WrappedComponent {...props} />;

export default withOfflineHandling;

// Usage example:
// const PostsWithOfflineHandling = withOfflineHandling(
//   Posts, 
//   "You're viewing mock post data while the server is offline."
// );