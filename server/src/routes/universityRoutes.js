import express from 'express';
import University from '../models/University.js';

const router = express.Router();

/**
 * Get all active universities
 * GET /api/universities
 */
router.get('/', async (req, res, next) => {
  try {
    const universities = await University.find({ isActive: true })
      .select('name code domain city state country campuses')
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: universities.length,
      universities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

