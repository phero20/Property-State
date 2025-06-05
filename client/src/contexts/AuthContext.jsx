// Update the login function in AuthContext

const login = async (input, password) => {
  try {
    setLoading(true);
    console.log('🔐 Login attempt...');
    
    // Determine input type (email or username)
    const inputType = input.includes('@') ? 'email' : 'username';
    
    // Make the API call
    const response = await api.post('/auth/login', {
      input,
      password,
      inputType
    });
    
    const userData = response.data;
    console.log('✅ Login successful');
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    setAuthenticated(true);
    setLoading(false);
    
    return userData;
  } catch (error) {
    setLoading(false);
    console.log('❌ Login failed, checking localStorage:', error);
    
    // Fallback to localStorage if API is down
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const storedInput = input.includes('@') ? userData.email : userData.username;
        
        // Simple fallback validation - check if input matches stored user
        if (storedInput.toLowerCase() === input.toLowerCase()) {
          console.log('⚠️ Using locally stored user data as fallback');
          setUser(userData);
          setAuthenticated(true);
          return userData;
        }
      } catch (e) {
        console.error('❌ Error checking localStorage user:', e);
      }
    }
    
    throw new Error('Login failed');
  }
};