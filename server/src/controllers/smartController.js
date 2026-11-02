import {
  getExchangeMatches,
  getPlatformImpact,
  getPriceSuggestion,
  getSmartRecommendations,
  getTrendingBooks,
  getUserSavings,
  validatePriceSuggestionQuery,
  validateRecommendationLimit,
} from '../services/smartService.js';

export const getExchangeMatchesData = async (req, res, next) => {
  try {
    const matches = await getExchangeMatches(req.user);
    res.status(200).json({ status: 'success', results: matches.length, matches });
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const limit = validateRecommendationLimit(req.query.limit);
    const recommendations = await getSmartRecommendations(req.user, limit);
    res.status(200).json({
      status: 'success',
      results: recommendations.length,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

export const getTrending = async (req, res, next) => {
  try {
    const limit = validateRecommendationLimit(req.query.limit);
    const books = await getTrendingBooks(limit);
    res.status(200).json({ status: 'success', results: books.length, books });
  } catch (error) {
    next(error);
  }
};

export const getPriceSuggestionData = async (req, res, next) => {
  try {
    const query = validatePriceSuggestionQuery(req.query);
    const suggestion = await getPriceSuggestion(query);
    res.status(200).json({ status: 'success', ...suggestion });
  } catch (error) {
    next(error);
  }
};

export const getSavings = async (req, res, next) => {
  try {
    const savings = await getUserSavings(req.user._id);
    res.status(200).json({ status: 'success', ...savings });
  } catch (error) {
    next(error);
  }
};

export const getPlatformImpactData = async (req, res, next) => {
  try {
    const impact = await getPlatformImpact();
    res.status(200).json({ status: 'success', ...impact });
  } catch (error) {
    next(error);
  }
};
