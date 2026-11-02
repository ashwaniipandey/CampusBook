import { Book, University, User } from '../models/index.js';
import { getPlatformImpact } from '../services/smartService.js';

const CACHE_DURATION_MS = 5 * 60 * 1000;
let statsCache = null;
let statsRequest = null;

const loadPublicStats = async () => {
  const [students, booksListed, universities, impact] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Book.countDocuments(),
    University.countDocuments({ isActive: true }),
    getPlatformImpact(),
  ]);
  return {
    students,
    booksListed,
    universities,
    booksReused: impact.impact.booksReused,
    co2SavedKg: impact.impact.estimatedCo2SavedKg,
  };
};

export const getPublicStats = async (req, res, next) => {
  try {
    if (statsCache && statsCache.expiresAt > Date.now()) {
      return res.status(200).json({ status: 'success', ...statsCache.value });
    }

    if (!statsRequest) {
      statsRequest = loadPublicStats()
        .then((stats) => {
          statsCache = { value: stats, expiresAt: Date.now() + CACHE_DURATION_MS };
          return stats;
        })
        .finally(() => {
          statsRequest = null;
        });
    }

    const stats = await statsRequest;
    res.status(200).json({ status: 'success', ...stats });
  } catch (error) {
    next(error);
  }
};
