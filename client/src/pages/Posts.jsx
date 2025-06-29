import React, { useState, useEffect } from 'react';
import { usePosts } from '../hooks/usePosts';
import PropertyCard from '../components/PropertyCard';
import { useApiStatus } from '../context/ApiStatusContext';
import { toast } from '../utils/toast';

const Posts = () => {
  const { posts, loading, error, loadPosts } = usePosts();
  const { isUsingMockData } = useApiStatus();
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
    setFilteredPosts(filtered);
  }, [posts.allPosts, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    toast.info(`Filter changed: ${name} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    toast.info('Clearing all filters');
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
    loadPosts();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--theme-accent)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>Properties</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {filteredPosts.length} {filteredPosts.length === 1 ? 'property' : 'properties'} available
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button
            onClick={refreshPosts}
            className="px-4 py-2 rounded hover:opacity-90 transition cursor-pointer"
            style={{ background: 'var(--text-light)', color: '#fff' }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => window.location.href = '/add-post'}
            className="px-6 py-2 rounded hover:opacity-90 transition cursor-pointer"
            style={{ background: 'var(--theme-accent)', color: 'var(--text-on-accent)' }}
          >
            + Add Property
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--theme-accent)' }}>
          <div className="flex items-center">
            <span className="mr-2" style={{ color: 'var(--theme-accent)' }}>⚠️</span>
            <p style={{ color: 'var(--text-main)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg shadow-md p-6 mb-8" style={{ background: 'var(--bg-card)' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-semibold mb-4 md:mb-0" style={{ color: 'var(--text-main)' }}>Filter Properties</h2>
          <button
            onClick={clearFilters}
            className="text-sm font-medium hover:underline cursor-pointer"
            style={{ color: 'var(--theme-accent)' }}
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search properties..."
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              City
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Enter city"
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            >
              <option value="">All Types</option>
              <option value="rent">For Rent</option>
              <option value="buy">For Sale</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Property Type
            </label>
            <select
              name="property"
              value={filters.property}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Min Bedrooms
            </label>
            <select
              name="bedroom"
              value={filters.bedroom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
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
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Min Price
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="No limit"
              className="w-full px-3 py-2 border rounded-md focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:outline-none"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-main)', background: 'var(--bg-main)' }}
            />
          </div>
        </div>
      </div>

      {/* API Status Message */}
      {isUsingMockData && (
        <div className="mb-4 p-3 text-sm rounded-md" style={{ background: 'var(--bg-card)', color: 'var(--theme-accent)' }}>
          <p><span className="font-semibold">⚠️ Using mock data:</span> API server is offline</p>
        </div>
      )}

      {/* Properties Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map(post => (
            <div className="flex w-full justify-center"> <PropertyCard key={post._id} post={{...post, id: post._id}} /></div>
           
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg shadow-md" style={{ background: 'var(--bg-card)' }}>
          <div className="text-6xl mb-4" style={{ color: 'var(--theme-accent)' }}>🏠</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-main)' }}>
            {posts.allPosts.length === 0 ? 'No Properties Available' : 'No Properties Match Your Filters'}
          </h3>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            {posts.allPosts.length === 0 
              ? 'Be the first to list a property!' 
              : 'Try adjusting your search filters to find more properties.'
            }
          </p>
          <div className="flex justify-center space-x-4">
            {posts.allPosts.length === 0 ? (
              <button
                onClick={() => window.location.href = '/add-post'}
                className="px-6 py-3 rounded-md hover:opacity-90 transition-colors cursor-pointer"
                style={{ background: 'var(--theme-accent)', color: 'var(--text-on-accent)' }}
              >
                List Your Property
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="px-6 py-3 rounded-md hover:opacity-90 transition-colors cursor-pointer"
                style={{ background: 'var(--theme-accent)', color: 'var(--text-on-accent)' }}
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