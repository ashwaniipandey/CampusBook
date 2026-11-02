import Book from '../models/Book.js';
import SearchHistory from '../models/SearchHistory.js';
import { AppError } from '../middlewares/errorHandler.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getBookSuggestions = async (req, res, next) => {
  try {
    if (typeof req.query.q !== 'string' || req.query.q.trim().length < 2 || req.query.q.length > 120) {
      return next(new AppError('q must contain between 2 and 120 characters.', 400));
    }

    const query = req.query.q.trim();
    const regex = new RegExp(escapeRegex(query), 'i');
    const books = await Book.find({
      status: { $in: ['approved', 'available'] },
      $or: [{ title: regex }, { author: regex }, { isbn: regex }],
    })
      .select('title author isbn views createdAt')
      .sort({ views: -1, createdAt: -1 })
      .limit(30)
      .lean();

    const suggestions = [];
    const seen = new Set();
    for (const book of books) {
      for (const [type, value] of [
        ['title', book.title],
        ['author', book.author],
        ['isbn', book.isbn],
      ]) {
        const normalized = value?.trim();
        const key = normalized?.toLowerCase();
        if (normalized && regex.test(normalized) && !seen.has(`${type}:${key}`)) {
          suggestions.push({ type, value: normalized });
          seen.add(`${type}:${key}`);
          if (suggestions.length === 8) break;
        }
      }
      if (suggestions.length === 8) break;
    }

    res.status(200).json({ status: 'success', suggestions });
  } catch (error) {
    next(error);
  }
};

export const getRecentSearches = async (req, res, next) => {
  try {
    const history = await SearchHistory.findOne({ user: req.user._id }).select('searches').lean();
    res.status(200).json({
      status: 'success',
      searches: history?.searches?.map(({ term, searchedAt }) => ({ term, searchedAt })) || [],
    });
  } catch (error) {
    next(error);
  }
};

export const addRecentSearch = async (req, res, next) => {
  try {
    const { term } = req.body;
    if (typeof term !== 'string' || !term.trim() || term.trim().length > 120) {
      return next(new AppError('term must be a non-empty string of 120 characters or fewer.', 400));
    }

    const normalizedTerm = term.trim();
    const history = await SearchHistory.findOne({ user: req.user._id });
    const searches = history?.searches || [];
    const updatedSearches = [
      { term: normalizedTerm, searchedAt: new Date() },
      ...searches.filter((search) => search.term.toLowerCase() !== normalizedTerm.toLowerCase()),
    ].slice(0, 10);

    const savedHistory = await SearchHistory.findOneAndUpdate(
      { user: req.user._id },
      { $set: { searches: updatedSearches } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select('searches');

    res.status(200).json({
      status: 'success',
      searches: savedHistory.searches.map(({ term: searchTerm, searchedAt }) => ({
        term: searchTerm,
        searchedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const clearRecentSearches = async (req, res, next) => {
  try {
    await SearchHistory.findOneAndUpdate(
      { user: req.user._id },
      { $set: { searches: [] } },
      { new: true }
    );
    res.status(200).json({ status: 'success', searches: [] });
  } catch (error) {
    next(error);
  }
};
