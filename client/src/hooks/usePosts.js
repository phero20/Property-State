import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';

export const usePosts = () => {
  const [posts, setPosts] = useState({
    myPosts: [],
    savedPosts: [],
    allPosts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading posts from API...');
      
      const response = await postAPI.getAllPosts();
      const allPosts = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Posts loaded from API:', allPosts.length, 'posts');
      
      // Get current user to filter posts
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      const myPosts = currentUser 
        ? allPosts.filter(post => post.userId === currentUser.id || post.ownerInfo?.id === currentUser.id)
        : [];
      
      setPosts({
        myPosts,
        savedPosts: [], // TODO: Implement saved posts
        allPosts
      });
      
      setError(null);
    } catch (error) {
      console.error('❌ Error loading posts from API:', error);
      setError('Failed to load posts from server');
      setPosts({ myPosts: [], savedPosts: [], allPosts: [] });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData) => {
    try {
      console.log('📝 Creating new post via API...');
      const response = await postAPI.createPost(postData);
      const newPost = response.data;
      
      console.log('✅ Post created successfully:', newPost.id);
      
      // Update local state
      setPosts(prev => ({
        ...prev,
        myPosts: [newPost, ...prev.myPosts],
        allPosts: [newPost, ...prev.allPosts]
      }));
      
      // Reload all posts to ensure consistency
      setTimeout(() => {
        loadPosts();
      }, 1000);
      
      return { success: true, post: newPost };
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    loadPosts,
    createPost
  };
};