import React, { useState } from 'react';
import { authAPI, postAPI } from '../services/api';

const Test = () => {
  const [results, setResults] = useState({
    loggedIn: null,
    admin: null,
  });
  const [loading, setLoading] = useState({
    loggedIn: false,
    admin: false,
  });

  const testLoggedIn = async () => {
    setLoading(prev => ({ ...prev, loggedIn: true }));
    try {
      const response = await authAPI.shouldBeLoggedIn();
      setResults(prev => ({ ...prev, loggedIn: response.data.message }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        loggedIn: error.response?.data?.message || 'Error occurred' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, loggedIn: false }));
    }
  };

  const testAdmin = async () => {
    setLoading(prev => ({ ...prev, admin: true }));
    try {
      const response = await postAPI.shouldBeAdmin();
      setResults(prev => ({ ...prev, admin: response.data.message }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        admin: error.response?.data?.message || 'Error occurred' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API Tests</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
          <button
            onClick={testLoggedIn}
            disabled={loading.loggedIn}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading.loggedIn ? 'Testing...' : 'Test Logged In'}
          </button>
          {results.loggedIn && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <strong>Result:</strong> {results.loggedIn}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Admin Test</h2>
          <button
            onClick={testAdmin}
            disabled={loading.admin}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading.admin ? 'Testing...' : 'Test Admin'}
          </button>
          {results.admin && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <strong>Result:</strong> {results.admin}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Test;