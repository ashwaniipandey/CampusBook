import express from 'express';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from '../controllers/searchController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/recent', protect, getRecentSearches);
router.post('/recent', protect, addRecentSearch);
router.delete('/recent', protect, clearRecentSearches);
export default router;
