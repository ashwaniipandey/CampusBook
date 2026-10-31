import express from 'express';
import { getSellerReviews } from '../controllers/reviewController.js';

const router = express.Router();

/**
 * @route   GET /api/users/:id/reviews
 * @desc    Get all reviews for a specific seller
 * @access  Public
 */
router.get('/:id/reviews', getSellerReviews);

export default router;

