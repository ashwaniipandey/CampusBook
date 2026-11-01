import express from 'express';
import { getSellerReviews } from '../controllers/reviewController.js';
import {
  updateCurrentUser,
  updateCurrentUserAvatar,
} from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { uploadMessageImage } from '../middlewares/upload.js';
import { validateProfileUpdate } from '../validations/userValidation.js';

const router = express.Router();

router.put('/me', protect, validateProfileUpdate, updateCurrentUser);
router.post('/me/avatar', protect, uploadMessageImage, updateCurrentUserAvatar);

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Get all reviews for a specific seller
 * @access  Public
 */
router.get('/:id/reviews', getSellerReviews);

export default router;
