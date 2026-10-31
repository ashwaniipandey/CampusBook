import express from 'express';
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from '../validations/orderValidation.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

/**
 * @route   POST /api/orders
 * @desc    Create a new order (single book or checkout from cart)
 * @access  Private
 */
router.post('/', validateCreateOrder, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get current user's orders (?role=buying|selling&status=...)
 * @access  Private
 */
router.get('/', getOrders);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (confirm, complete, cancel)
 * @access  Private
 */
router.patch('/:id/status', validateUpdateOrderStatus, updateOrderStatus);

export default router;

