/**
 * Helper functions for handling API requests in development mode
 */

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === 'development';

// Real user IDs that exist in the database (update these to match your database)
const validUserIds = [
  1, // Use an integer instead of a string to match Prisma's expectations
];

/**
 * Transforms mock user IDs into real database IDs for development environment
 */
export const getValidUserId = (mockUserId) => {
  if (!isDevelopment) return mockUserId;
  
  // If it's a mock ID, return the first valid ID
  if (mockUserId && typeof mockUserId === 'string' && mockUserId.startsWith('mock_')) {
    console.log('⚠️ Using development fallback user ID instead of:', mockUserId);
    return validUserIds[0] || 1; // Default to ID 1 as integer
  }
  
  // Try to convert to integer if it's a string
  if (typeof mockUserId === 'string') {
    const numId = parseInt(mockUserId);
    if (!isNaN(numId)) {
      return numId;
    }
  }
  
  return mockUserId;
};

/**
 * Creates a local mock response for development when API fails
 */
export const createMockResponse = (data, originalError) => {
  console.log('🔄 Creating development fallback response');
  
  return {
    data: {
      id: `local_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocalOnly: true
    },
    status: 200,
    originalError // Store the original error for debugging
  };
};