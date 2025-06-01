import React, { useState, useEffect } from 'react';
import { usePosts } from '../hooks/usePosts';
import PropertyCard from '../components/PropertyCard';

const Posts = () => {
  const { posts, loading, error, loadPosts } = usePosts();
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    property: '',
    bedroom: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  // Apply filters whenever posts or filters change
  useEffect(() => {
    console.log('🔍 Applying filters to posts...');
    console.log('📊 Total posts available:', posts.allPosts.length);
    console.log('🏷️ Current filters:', filters);

    let filtered = [...posts.allPosts];

    // Apply filters
    if (filters.city) {
      filtered = filtered.filter(post => 
        post.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter(post => post.type === filters.type);
    }

    if (filters.property) {
      filtered = filtered.filter(post => post.property === filters.property);
    }

    if (filters.bedroom) {
      const bedroomCount = parseInt(filters.bedroom);
      filtered = filtered.filter(post => post.bedroom >= bedroomCount);
    }

    if (filters.minPrice) {
      const minPrice = parseInt(filters.minPrice);
      filtered = filtered.filter(post => post.price >= minPrice);
    }

    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice);
      filtered = filtered.filter(post => post.price <= maxPrice);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title?.toLowerCase().includes(searchTerm) ||
        post.address?.toLowerCase().includes(searchTerm) ||
        post.postDetail?.desc?.toLowerCase().includes(searchTerm)
      );
    }

    console.log('✅ Filtered posts count:', filtered.length);
    setFilteredPosts(filtered);
  }, [posts.allPosts, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔄 Filter changed: ${name} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({
      city: '',
      type: '',
      property: '',
      bedroom: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
  };

  const refreshPosts = () => {
    console.log('🔄 Manually refreshing posts...');
    loadPosts();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-600">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'property' : 'properties'} available
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button
            onClick={refreshPosts}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => window.location.href = '/add-post'}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            + Add Property
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-0">Filter Properties</h2>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search properties..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Enter city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="rent">For Rent</option>
              <option value="buy">For Sale</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              name="property"
              value={filters.property}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Properties</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Bedrooms
            </label>
            <select
              name="bedroom"
              value={filters.bedroom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-gray-800 font-semibold mb-2">🔧 Debug Info (Development Only)</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Total Posts: {posts.allPosts.length}</p>
            <p>My Posts: {posts.myPosts.length}</p>
            <p>Filtered Posts: {filteredPosts.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">View Sample Post Data</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(posts.allPosts[0] || {}, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map((post) => (
            <PropertyCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {posts.allPosts.length === 0 ? 'No Properties Available' : 'No Properties Match Your Filters'}
          </h3>
          <p className="text-gray-600 mb-4">
            {posts.allPosts.length === 0 
              ? 'Be the first to list a property!' 
              : 'Try adjusting your search filters to find more properties.'
            }
          </p>
          <div className="flex justify-center space-x-4">
            {posts.allPosts.length === 0 ? (
              <button
                onClick={() => window.location.href = '/add-post'}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                List Your Property
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;