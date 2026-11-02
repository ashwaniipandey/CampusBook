import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { AppError } from '../middlewares/errorHandler.js';

dotenv.config();

// Extract credentials
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

// Handle edge cases where user pasted the full URL string like CLOUDINARY_URL=cloudinary://key:secret@cloud
if (apiSecret.includes('CLOUDINARY_URL=')) {
  try {
    const cleaned = apiSecret.replace('CLOUDINARY_URL=', '').trim();
    const url = new URL(cleaned);
    apiSecret = url.password || apiSecret;
  } catch (err) {
    // If not a valid URL, keep as is
  }
}

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  !apiSecret.includes('<your_api_secret>') &&
  apiSecret !== ''
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Upload an image buffer directly to Cloudinary
 * @param {Buffer} buffer - Image file buffer from multer memory storage
 * @param {string} folder - Target Cloudinary folder
 * @param {object} options - Optional Cloudinary upload options
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadToCloudinary = (buffer, folder = 'campusbook/books', options = {}) => {
  const { disableFallback = false, ...uploadOptions } = options;
  return new Promise((resolve, reject) => {
    // Graceful fallback for local development if Cloudinary credentials are not configured or are placeholder
    if (!isConfigured) {
      if (disableFallback) {
        return reject(new AppError('Cloudinary image storage is not configured.', 503));
      }
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const mockUrl = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80`;
      return resolve({
        url: mockUrl,
        public_id: mockId,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...uploadOptions,
      },
      (error, result) => {
        if (error) {
          if (disableFallback) return reject(error);
          console.warn(
            `[Cloudinary] Live upload failed (${error.message}). Falling back to local placeholder for dev.`
          );
          const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const mockUrl = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80`;
          return resolve({
            url: mockUrl,
            public_id: mockId,
          });
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} public_id - Cloudinary public id
 * @returns {Promise<object>}
 */
export const deleteFromCloudinary = async (public_id) => {
  if (!public_id || public_id.startsWith('mock_')) {
    return { result: 'ok' };
  }

  if (!isConfigured) {
    return { result: 'ok' };
  }

  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.warn(`[Cloudinary] Failed to delete image ${public_id}:`, error.message);
    return { result: 'error', error: error.message };
  }
};

export default cloudinary;
