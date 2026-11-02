import mongoose from 'mongoose';
import Review from '../models/Review.js';

export async function getReviewStatsBySeller(sellerIds) {
  const ids = [...new Set((sellerIds || []).filter(Boolean).map(String))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!ids.length) return new Map();

  const results = await Review.aggregate([
    { $match: { seller: { $in: ids } } },
    {
      $group: {
        _id: '$seller',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    results.map((result) => [
      result._id.toString(),
      {
        rating: Math.round(result.averageRating * 10) / 10,
        totalRatings: result.totalRatings,
      },
    ])
  );
}

export async function getReviewStatsForSeller(sellerId) {
  const stats = await getReviewStatsBySeller([sellerId]);
  return stats.get(String(sellerId)) || { rating: 0, totalRatings: 0 };
}
