import { useState, useEffect, useCallback } from 'react';
import { postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const usePosts = () => {
  const [posts, setPosts] = useState({ allPosts: [], myPosts: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all posts
      const response = await postAPI.getAllPosts();
      
      // Normal API response processing
      const allPosts = response.data;
      
      // Filter for user's posts if logged in
      const myPosts = user 
        ? allPosts.filter(post => post.userId === user._id || (post.user && post.user._id === user._id))
        : [];
      
      setPosts({ allPosts, myPosts });
    } catch (error) {
      console.error('❌ Error loading posts from API:', error);
      setError('Failed to load properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const getPostById = (posts, id) => posts.find(post => post._id === id);

  return { posts, loading, error, loadPosts, getPostById };
};