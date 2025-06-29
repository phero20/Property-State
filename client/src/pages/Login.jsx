import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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

      const response = await login(credentials);
      
      if (response.success) {
        toast.success('Login successful! Redirecting...');
        navigate('/posts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Login failed. ${error.message || 'Please check your credentials.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow rounded-lg sm:px-10" style={{ background: 'var(--bg-card)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                value={formData.emailOrUsername}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)', placeholderColor: 'var(--text-muted)' }}
                placeholder="Enter your email or username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]"
                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', borderColor: 'var(--text-light)', placeholderColor: 'var(--text-muted)' }}
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
                  className="h-4 w-4 rounded focus:ring-2 focus:ring-[var(--theme-accent)]"
                  style={{ accentColor: 'var(--theme-accent)' }}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm" style={{ color: 'var(--text-main)' }}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/login"
                  className="font-medium underline"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2 disabled:opacity-50"
                style={{ background: 'var(--theme-accent)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--text-light)' }}></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium underline"
                style={{ color: 'var(--theme-accent)' }}
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