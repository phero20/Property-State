/**
 * Simple image compression utility for reducing image size before upload
 * Uses the browser's Canvas API to resize and compress images
 */

/**
 * Compresses an image file to a specified size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB
 * @param {number} options.maxWidthOrHeight - Maximum width or height in pixels
 * @param {boolean} options.useWebWorker - Whether to use web worker for processing
 * @returns {Promise<Blob>} - Compressed image as a Blob
 */
export const imageCompression = async (file, options = {}) => {
  const { 
    maxSizeMB = 1, 
    maxWidthOrHeight = 1920, 
    useWebWorker = false // Not used in this simple implementation
  } = options;
  
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Create URL for the file
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        // Release the object URL after image loads
        URL.revokeObjectURL(url);
        
        // Calculate dimensions to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Scale down if image is larger than max dimensions
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }
        
        // Create canvas and draw the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; // White background
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get the quality based on desired size
        let quality = 0.8; // Start with good quality
        
        // Convert to blob and resolve
        canvas.toBlob(
          (blob) => {
            // If the blob is still too big and we can compress more, do it
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              quality = Math.max(0.3, quality - 0.2);
              canvas.toBlob(
                (finalBlob) => resolve(finalBlob), 
                file.type, 
                quality
              );
            } else {
              resolve(blob);
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
      
    } catch (error) {
      reject(error);
    }
  });
};