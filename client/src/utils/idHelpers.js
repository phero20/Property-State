/**
 * Formats user IDs based on your database schema requirements
 * @param {string|number} userId - The user ID to format
 * @param {boolean} forceInteger - Whether to force integer conversion
 * @returns {number|string} The correctly formatted user ID
 */
export const formatUserId = (userId, forceInteger = true) => {
  if (!userId) return null;
  
  // Handle mock IDs for development
  if (typeof userId === 'string' && userId.startsWith('mock_')) {
    // Return a valid database ID for development
    return forceInteger ? 1 : '1';
  }
  
  // Normal ID handling
  if (forceInteger) {
    const numId = parseInt(userId);
    return isNaN(numId) ? userId : numId; // Return original if parsing fails
  }
  
  return userId;
};