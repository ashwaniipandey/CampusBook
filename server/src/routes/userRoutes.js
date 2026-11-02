import express from 'express';
import { getSellerReviews } from '../controllers/reviewController.js';
import {
  updateCurrentUser,
  updateCurrentUserAvatar,
} from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { uploadMessageImage } from '../middlewares/upload.js';
import { validateProfileUpdate } from '../validations/userValidation.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { sanitizeRequestInputs, validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.put('/me', validateAllowedQuery(), protect, validateProfileUpdate, updateCurrentUser);
router.post('/me/avatar', validateAllowedQuery(), protect, uploadLimiter, uploadMessageImage, sanitizeRequestInputs, updateCurrentUserAvatar);

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Get all reviews for a specific seller
 * @access  Public
 */
router.get('/:id/reviews', validateAllowedQuery(), getSellerReviews);

export default router;
