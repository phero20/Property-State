import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[var(--bg-main)]">
      <div className="max-w-md w-full rounded-lg shadow-md overflow-hidden bg-[var(--bg-card)]">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="text-6xl font-bold text-[var(--theme-accent)]">404</div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-4 text-[var(--text-main)]">
            Page Not Found
          </h2>
          <p className="text-center mb-8 text-[var(--text-muted)]">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 rounded-md hover:opacity-90 transition-colors duration-300 bg-[var(--theme-accent)] text-[var(--text-on-accent)]"
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