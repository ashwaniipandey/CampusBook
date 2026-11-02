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

const router = express.Router();

router.get('/trending', getTrending);
router.get('/price-suggestion', getPriceSuggestionData);
router.get('/platform-impact', getPlatformImpactData);
router.get('/exchange-matches', protect, getExchangeMatchesData);
router.get('/recommendations', protect, getRecommendations);
router.get('/savings', protect, getSavings);

export default router;
