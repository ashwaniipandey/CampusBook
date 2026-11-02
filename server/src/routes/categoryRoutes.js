import express from 'express';
import Category from '../models/Category.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

/**
 * Get all active book categories
 * GET /api/categories
 * Access: Public
 */
router.get('/', validateAllowedQuery(), async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description icon')
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
