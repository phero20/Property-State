import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../services/api';
import PropertyCard from '../components/PropertyCard';

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
      console.error('Error fetching featured posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Welcome to Property State
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find your perfect property - Buy, Rent, or Sell with ease
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-500 text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">Buy Properties</h3>
              <p className="text-gray-600">Discover amazing properties for sale</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-green-500 text-4xl mb-4">🔑</div>
              <h3 className="text-xl font-semibold mb-2">Rent Properties</h3>
              <p className="text-gray-600">Find perfect rental properties</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-purple-500 text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-2">Sell Properties</h3>
              <p className="text-gray-600">List your property for sale</p>
            </div>
          </div>
          
          <Link
            to="/posts"
            className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-600 inline-block transition-colors transform hover:scale-105"
          >
            Browse Properties
          </Link>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Featured Properties</h2>
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.map(post => (
              <PropertyCard key={post._id} post={{...post, id: post._id}} />
            ))}
          </div>
        )}
        
        {!loading && featuredPosts.length > 0 && (
          <div className="text-center mt-8">
            <Link
              to="/posts"
              className="text-blue-500 hover:text-blue-600 font-medium hover:underline transition-all"
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