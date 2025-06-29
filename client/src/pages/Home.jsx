import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { toast } from '../utils/toast';
import { FaHome, FaKey, FaBriefcase } from 'react-icons/fa';


const Home = () => {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedPosts();
  }, []);

  const fetchFeaturedPosts = async () => {
    try {
      // Add timeout handling 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await postAPI.getAllPosts({
        limit: 6,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setFeaturedPosts(response.data.slice(0, 6));
    } catch (error) {
      toast.error(`error fetching featured posts. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center my-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--theme-accent)' }}>
            Welcome to Property State
          </h1>
          <p className="text-xl mb-8" style={{ color: 'var(--text-muted)' }}>
            Find your perfect property - Buy, Rent, or Sell with ease
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 px-6 gap-6 mb-8">
            <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-transparent hover:border-[var(--theme-accent)] bg-[var(--bg-card)] group cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[var(--bg-main)] border-2 border-[var(--theme-accent)] mx-auto  transition-colors">
                <FaHome className="text-3xl" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>Buy Properties</h3>
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>Discover amazing properties for sale</p>
            </div>
            <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-transparent hover:border-[var(--theme-accent)] bg-[var(--bg-card)] group cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[var(--bg-main)] border-2 border-[var(--theme-accent)] mx-auto  transition-colors">
                <FaKey className="text-3xl" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>Rent Properties</h3>
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>Find perfect rental properties</p>
            </div>
            <div className="p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-transparent hover:border-[var(--theme-accent)] bg-[var(--bg-card)] group cursor-pointer transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[var(--bg-main)] border-2 border-[var(--theme-accent)] mx-auto transition-colors">
                <FaBriefcase className="text-3xl" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>Sell Properties</h3>
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>List your property for sale</p>
            </div>
          </div>
          <Link
            to="/posts"
            className="px-8 py-3 rounded-lg bg-[var(--theme-accent)] text-white cursor-pointer hover:bg-[var(--hover-theme-accent)] text-lg font-semibold shadow-md transition-all inline-block border border-transparent hover:border-[var(--theme-accent)] hover:shadow-lg transform hover:-translate-y-1"
          >
            Browse Properties
          </Link>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-[var(--text-main)]">Featured Properties</h2>
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-accent)] mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-center justify-center gap-5 px-6 xl:px-10 auto-rows-fr">
            {featuredPosts.map(post => (
              <div key={post._id} className="flex h-full justify-center w-full">
                <PropertyCard post={{ ...post, id: post._id }} />
              </div>
            ))}
          </div>
        )}

        {!loading && featuredPosts.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/posts"
              className="text-[var(--theme-accent)] hover:text-[var(--hover-theme-accent)] font-medium hover:border-b-2 hover:border-[var(--hover-theme-accent)] transition-all"
            >
              View All Properties →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;