import express from 'express';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from '../controllers/searchController.js';
import { protect } from '../middlewares/auth.js';
import { validateAllowedQuery, validateBody } from '../validations/requestValidation.js';

const router = express.Router();

router.get('/recent', validateAllowedQuery(), protect, getRecentSearches);
router.post('/recent', validateAllowedQuery(), protect, validateBody('search'), addRecentSearch);
router.delete('/recent', validateAllowedQuery(), protect, clearRecentSearches);
export default router;
