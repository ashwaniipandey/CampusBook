import express from 'express';
import {
  getExchangeMatchesData,
  getPlatformImpactData,
  getPriceSuggestionData,
  getRecommendations,
  getSavings,
  getTrending,
} from '../controllers/smartController.js';
import { protect } from '../middlewares/auth.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

router.get('/trending', validateAllowedQuery(['limit']), getTrending);
router.get('/price-suggestion', validateAllowedQuery(['category', 'originalPrice', 'condition', 'edition', 'title']), getPriceSuggestionData);
router.get('/platform-impact', validateAllowedQuery(), getPlatformImpactData);
router.get('/exchange-matches', validateAllowedQuery(), protect, getExchangeMatchesData);
router.get('/recommendations', validateAllowedQuery(['limit']), protect, getRecommendations);
router.get('/savings', validateAllowedQuery(), protect, getSavings);

export default router;
