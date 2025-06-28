/**
 * Formats user IDs based on your database schema requirements
 * @param {string|number} userId - The user ID to format
 * @param {boolean} forceInteger - Whether to force integer conversion
 * @returns {number|string} The correctly formatted user ID
 */
export const formatUserId = (userId, forceInteger = true) => {
  if (!userId) return null;
  
  // Normal ID handling
  if (forceInteger) {
    const numId = parseInt(userId);
    return isNaN(numId) ? userId : numId; // Return original if parsing fails
  }
  
  return userId;
};