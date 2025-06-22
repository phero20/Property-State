const axios = require('axios');

const API_URL = 'http://property-state.onrender.com';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with your valid JWT token

const testChatRoutes = async () => {
  // Set up headers with authorization
  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    console.log('🔍 Testing Chat API routes...');
    
    // 1. Test GET /api/chat/conversations
    try {
      console.log('\n1. Testing GET /api/chat/conversations');
      const response = await axios.get(`${API_URL}/api/chat/conversations`, { headers });
      console.log('✅ Status:', response.status);
      console.log('📄 Data:', response.data);
    } catch (error) {
      console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // 2. Test POST /api/chat (create conversation)
    try {
      console.log('\n2. Testing POST /api/chat (create conversation)');
      // Replace with valid user ID from your database
      const response = await axios.post(`${API_URL}/api/chat`, { 
        userId: '6841cedbf80fa3d3e579458a'  // Replace with valid recipient ID
      }, { headers });
      console.log('✅ Status:', response.status);
      console.log('📄 Data:', response.data);
      
      const chatId = response.data.id;
      
      // 3. Test GET /api/chat/:chatId/messages
      try {
        console.log(`\n3. Testing GET /api/chat/${chatId}/messages`);
        const msgResponse = await axios.get(`${API_URL}/api/chat/${chatId}/messages`, { headers });
        console.log('✅ Status:', msgResponse.status);
        console.log('📄 Data:', msgResponse.data);
      } catch (error) {
        console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
      }
      
      // 4. Test POST /api/chat/:chatId/messages
      try {
        console.log(`\n4. Testing POST /api/chat/${chatId}/messages`);
        const sendResponse = await axios.post(`${API_URL}/api/chat/${chatId}/messages`, {
          content: 'Test message from API verification script'
        }, { headers });
        console.log('✅ Status:', sendResponse.status);
        console.log('📄 Data:', sendResponse.data);
      } catch (error) {
        console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
      }
      
      // 5. Test PUT /api/chat/:chatId/read
      try {
        console.log(`\n5. Testing PUT /api/chat/${chatId}/read`);
        const readResponse = await axios.put(`${API_URL}/api/chat/${chatId}/read`, {}, { headers });
        console.log('✅ Status:', readResponse.status);
        console.log('📄 Data:', readResponse.data);
      } catch (error) {
        console.error('❌ Failed:', error.response?.status, error.response?.data || error.message);
      }
      
    } catch (error) {
      console.error('❌ Create conversation failed:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testChatRoutes();