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
import { validateAllowedQuery, validateOrderQuery } from '../validations/requestValidation.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

// All order routes require authentication
router.use(protect);

/**
 * @route   POST /api/orders
 * @desc    Create a new order (single book or checkout from cart)
 * @access  Private
 */
router.post('/', validateAllowedQuery(), validateCreateOrder, createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get current user's orders (?role=buying|selling&status=...)
 * @access  Private
 */
router.get('/', validateOrderQuery, getOrders);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (confirm, complete, cancel)
 * @access  Private
 */
router.patch('/:id/status', validateAllowedQuery(), validateUpdateOrderStatus, updateOrderStatus);

export default router;
