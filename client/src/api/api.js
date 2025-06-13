// Add request interceptor to log all outgoing requests
api.interceptors.request.use(
  function (config) {
    console.log('🚀 Outgoing request:', {
      method: config.method,
      url: config.url,
      data: config.data ? JSON.stringify(config.data).substring(0, 1000) + '...' : 'No data'
    });
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);