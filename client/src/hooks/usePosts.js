import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';

export const usePosts = (initialFilters = {}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  
  const loadPosts = async (queryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const mergedParams = { ...filters, ...queryParams };
      const response = await postAPI.getAllPosts(mergedParams);
      
      // Check if we got an array back
      const postsData = Array.isArray(response.data) 
        ? response.data 
        : response.data.posts || [];
        
      setPosts(postsData);
      return postsData;
    } catch (error) {
      console.error('❌ Error loading posts from API:', error);
      setError(error.message || 'Failed to load posts');
      
      // Fallback to empty array on error
      setPosts([]);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Load posts on mount or when filters change
  useEffect(() => {
    loadPosts();
  }, [JSON.stringify(filters)]);
  
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  return {
    posts,
    loading,
    error,
    filters,
    updateFilters,
    loadPosts,
    setPosts
  };
};