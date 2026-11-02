import express from 'express';
import { createReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';
import { validateCreateReview } from '../validations/reviewValidation.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a completed order
 * @access  Private (Buyer of completed order)
 */
router.post('/', validateAllowedQuery(), protect, validateCreateReview, createReview);

export default router;
