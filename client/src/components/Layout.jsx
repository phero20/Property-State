import React from 'react';
import Navbar from './Navbar';
import { useSocket } from '../hooks/useSocket';

const Layout = ({ children }) => {
  useSocket(); // Initialize socket connection

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;