const axios = require('axios');

const API_URL = 'http://localhost:4000';

const testRoutes = async () => {
  try {
    console.log('🔍 Testing API routes...');
    
    // Test get conversations
    try {
      const token = 'YOUR_AUTH_TOKEN'; // Replace with a valid token
      const response = await axios.get(`${API_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ GET /api/chat/conversations:', response.status);
      console.log('📄 Data:', response.data);
    } catch (error) {
      console.error('❌ GET /api/chat/conversations failed:', error.response?.status, error.response?.data);
    }
    
    // Test other routes as needed...
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testRoutes();