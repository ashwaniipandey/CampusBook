import express from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

/**
 * @route   GET /api/cart
 * @desc    Get current user's shopping cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart/:bookId
 * @desc    Add book to shopping cart
 * @access  Private
 */
router.post('/:bookId', addToCart);

/**
 * @route   DELETE /api/cart/:bookId
 * @desc    Remove book from shopping cart
 * @access  Private
 */
router.delete('/:bookId', removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear shopping cart
 * @access  Private
 */
router.delete('/', clearCart);

export default router;

