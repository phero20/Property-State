import { debugAPI } from '../services/api';

export const runDiagnostics = async () => {
  console.group('🔍 Running System Diagnostics');
  
  console.log('🔧 Environment:', process.env.NODE_ENV);
  console.log('🌐 API URL:', process.env.REACT_APP_API_URL || 'Using default URL');
  
  try {
    console.log('📊 Checking database connection...');
    const dbResponse = await debugAPI.getDBStats();
    console.log('📊 Database status:', dbResponse.data?.status || 'unknown');
    console.log('📊 Collection counts:', dbResponse.data?.collections);
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
  
  try {
    console.log('🔑 Checking authentication...');
    const authResponse = await debugAPI.checkAuth();
    console.log('🔑 Auth status:', authResponse.data?.status || 'unauthenticated');
    console.log('👤 Current user:', authResponse.data?.user || 'none');
  } catch (error) {
    console.error('❌ Auth check failed:', error);
  }
  
  console.groupEnd();
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    apiUrl: process.env.REACT_APP_API_URL || 'default'
  };
};

// Add a global diagnostic function in development
if (process.env.NODE_ENV === 'development') {
  window.runDiagnostics = runDiagnostics;
}