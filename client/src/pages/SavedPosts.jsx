import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API
        try {
          const response = await postAPI.getSavedPosts();
          console.log('✅ Saved posts loaded:', response.data?.length || 0);
          setSavedPosts(response.data || []);
        } catch (apiError) {
          console.error('Error fetching saved posts from API:', apiError);
          
          // Generate mock data for development
          if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Using mock saved posts data');
            setSavedPosts([
              {
                id: 'mock-saved-1',
                title: 'Modern Apartment',
                price: 1800,
                city: 'Seattle',
                bedroom: 2,
                bathroom: 1,
                images: ['https://via.placeholder.com/400x300?text=Modern+Apartment'],
                type: 'rent',
                createdAt: new Date().toISOString()
              },
              {
                id: 'mock-saved-2',
                title: 'Beach House',
                price: 750000,
                city: 'Miami',
                bedroom: 4,
                bathroom: 3,
                images: ['https://via.placeholder.com/400x300?text=Beach+House'],
                type: 'buy',
                createdAt: new Date().toISOString()
              }
            ]);
          } else {
            throw apiError;
          }
        }
      } catch (error) {
        console.error('Error in saved posts page:', error);
        setError('Failed to load saved posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user?.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Properties</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading saved properties...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">You haven't saved any properties yet.</p>
          <a
            href="/posts"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Browse Properties
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;