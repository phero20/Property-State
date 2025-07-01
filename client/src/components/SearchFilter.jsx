import React, { useState } from 'react';
import { PROPERTY_TYPES, POST_TYPES } from '../utils/constants';

const SearchFilter = ({ filters, onFilterChange, onReset }) => {
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value,
    });
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden flex justify-end mb-4">
        <button
          className="px-4 py-2 bg-[var(--theme-accent)] text-white rounded font-semibold shadow"
          onClick={() => setShowMobileFilter((v) => !v)}
        >
          Filter
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`bg-white p-6 rounded-lg shadow-md mb-8 ${
          showMobileFilter ? 'block' : 'hidden'
        } md:block fixed md:static top-0 left-0 w-full h-full z-50 md:w-auto md:h-auto md:z-auto overflow-auto md:overflow-visible ${
          showMobileFilter ? '' : 'md:mb-8'
        }`}
        style={showMobileFilter ? { background: 'rgba(255,255,255,0.98)' } : {}}
      >
        {/* Close button for mobile */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Properties</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
            {/* Only show close on mobile */}
            <button
              className="md:hidden ml-2 px-2 py-1 text-gray-700 bg-gray-200 rounded"
              onClick={() => setShowMobileFilter(false)}
            >
              Close
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleInputChange}
              placeholder="Enter city"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value={POST_TYPES.BUY}>For Sale</option>
              <option value={POST_TYPES.RENT}>For Rent</option>
            </select>
          </div>
          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property
            </label>
            <select
              name="property"
              value={filters.property}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Properties</option>
              <option value={PROPERTY_TYPES.APARTMENT}>Apartment</option>
              <option value={PROPERTY_TYPES.HOUSE}>House</option>
              <option value={PROPERTY_TYPES.CONDO}>Condo</option>
              <option value={PROPERTY_TYPES.LAND}>Land</option>
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
              onChange={handleInputChange}
              placeholder="Min price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={handleInputChange}
              placeholder="Max price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms
            </label>
            <select
              name="bedroom"
              value={filters.bedroom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="1">1+ Bedroom</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Bedrooms</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchFilter;