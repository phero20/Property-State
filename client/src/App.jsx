import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApiStatusProvider } from './context/ApiStatusContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Profile from './pages/profile'; // Changed to lowercase
import Chat from './pages/Chat';
import Test from './pages/test'; // Changed to lowercase
import AddPost from './pages/AddPost';
import socketService from './services/socket';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Connect socket when user is authenticated
    if (user?.id) {
      console.log('🔌 Initializing socket connection for user:', user.id);
      const socket = socketService.connect(user.id);
      console.log('✅ Socket initialized:', socket?.id);
    }

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection');
      socketService.disconnect();
    };
  }, [user]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ApiStatusProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:chatId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test"
                element={
                  <ProtectedRoute>
                    <Test />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-post"
                element={
                  <ProtectedRoute>
                    <AddPost />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </ApiStatusProvider>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;