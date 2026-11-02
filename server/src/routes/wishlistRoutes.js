import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.param('bookId', validateObjectIdParam);

// All wishlist routes require authentication
router.use(validateAllowedQuery(), protect);

/**
 * @route   GET /api/wishlist
 * @desc    Get current user's wishlist
 * @access  Private
 */
router.get('/', getWishlist);

/**
 * @route   POST /api/wishlist/:bookId
 * @desc    Add book to user's wishlist
 * @access  Private
 */
router.post('/:bookId', addToWishlist);

/**
 * @route   DELETE /api/wishlist/:bookId
 * @desc    Remove book from user's wishlist
 * @access  Private
 */
router.delete('/:bookId', removeFromWishlist);

export default router;
