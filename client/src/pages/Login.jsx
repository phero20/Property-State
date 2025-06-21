import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if input is email or username
      const isEmail = formData.emailOrUsername.includes('@');
      
      // Format credentials to match the API expectation
      const credentials = {
        // The API expects either 'email' or 'username' as the field name
        email: isEmail ? formData.emailOrUsername : undefined,
        username: !isEmail ? formData.emailOrUsername : undefined,
        password: formData.password
      };

      console.log('🔐 Login attempt with:', credentials);

      const response = await login(credentials);
      
      if (response.success) {
        console.log('✅ Login successful, redirecting...');
        navigate('/posts');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      alert(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                value={formData.emailOrUsername}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email or username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  const isEmail = formData.emailOrUsername.includes('@');
                  console.log('📊 Debug Login Request:');
                  console.log('Input value:', formData.emailOrUsername);
                  console.log('Is Email:', isEmail);
                  console.log('Will send as:', isEmail ? 'email' : 'username');
                  console.log('Full payload:', {
                    [isEmail ? 'email' : 'username']: formData.emailOrUsername,
                    password: formData.password
                  });
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-normal py-1 px-2 rounded"
              >
                Debug Login
              </button>
            </div>
          )}

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;