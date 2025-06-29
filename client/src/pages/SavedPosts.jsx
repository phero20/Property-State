import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { toast } from '../utils/toast';

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API
        try {
          const response = await postAPI.getSavedPosts();
          setSavedPosts(response.data || []);
        } catch (apiError) {
          toast.error(`Failed to load saved posts from API. ${apiError.message}`);
          setError('Failed to load saved posts. Please try again later.');
        }
      } catch (error) {
        toast.error(`Error in saved posts page. ${error.message}`);
        setError('Failed to load saved posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, [user?._id]);

  return (
    <div className="container mx-auto px-4 py-8 bg-[var(--bg-main)]">
      <h1 className="text-3xl font-bold mb-6 text-[var(--theme-accent)]">Saved Properties</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-[var(--text-muted)]">Loading saved properties...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-md bg-[var(--bg-card)] border border-[var(--theme-accent)]">
          <p className="text-[var(--theme-accent)]">{error}</p>
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="p-8 rounded-md text-center bg-[var(--bg-card)]">
          <p className="mb-4 text-[var(--text-muted)]">You haven't saved any properties yet.</p>
          <a
            href="/posts"
            className="inline-block px-6 py-2 rounded-md hover:opacity-90 bg-[var(--theme-accent)] text-[var(--text-on-accent)]"
          >
            Browse Properties
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPosts.map(post => (
            <PostCard key={post._id} post={{...post, id: post._id}} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;