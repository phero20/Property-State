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
      
      // If we're using mock data from the fallback
      if (response.isMock) {
        console.log('🔄 Using mock post data in usePosts hook');
        // Format the structure to match what the component expects
        const formattedData = {
          allPosts: response.data,
          myPosts: response.data.filter(post => user && post.user && post.user.id === user.id)
        };
        
        setPosts(formattedData);
        console.log('✅ Posts loaded from API:', formattedData.allPosts.length, 'posts');
        setLoading(false);
        return;
      }

      // Normal API response processing
      const allPosts = response.data;
      
      // Filter for user's posts if logged in
      const myPosts = user 
        ? allPosts.filter(post => post.userId === user.id || (post.user && post.user.id === user.id))
        : [];
      
      setPosts({ allPosts, myPosts });
      console.log('✅ Posts loaded from API:', allPosts.length, 'posts');
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

  return { posts, loading, error, loadPosts };
};