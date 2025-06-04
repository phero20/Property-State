import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="text-6xl text-blue-500">404</div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 text-center mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;