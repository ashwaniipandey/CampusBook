import multer from 'multer';
import { AppError } from './errorHandler.js';

// Configure memory storage
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`,
        400
      ),
      false
    );
  }
};

// Base multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 files
  },
  fileFilter,
});

// Accept images under 'images' (plural) or 'image' (singular) form fields
const uploadHandler = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'image', maxCount: 5 },
]);

/**
 * Middleware for uploading up to 5 book images
 * Accepts 'images' or 'image' multipart fields
 */
export const uploadBookImages = (req, res, next) => {
  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large: Each image must be less than 5MB.', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Too many files: You can upload a maximum of 5 images.', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      return next(err);
    }

    // Normalize req.files to always be an Array for downstream handlers
    if (req.files && !Array.isArray(req.files)) {
      const combined = [];
      if (req.files.images) combined.push(...req.files.images);
      if (req.files.image) combined.push(...req.files.image);
      req.files = combined;
    } else if (!req.files) {
      req.files = [];
    }

    next();
  });
};

export default { uploadBookImages };
