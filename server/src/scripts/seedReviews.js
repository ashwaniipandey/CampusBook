import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import { Book, Order, Review, User } from '../models/index.js';

dotenv.config();

const MAX_REVIEWS = 12;
const reviewSamples = [
  { rating: 5, comment: 'The book was exactly as described and the campus handoff was easy. Thank you!' },
  { rating: 5, comment: 'Great communication and a smooth pickup. I would gladly buy from this student again.' },
  { rating: 4, comment: 'The listing was accurate and the book is in good shape. Pickup was convenient.' },
  { rating: 5, comment: 'Friendly seller, quick replies, and the book was ready right on time.' },
  { rating: 4, comment: 'A helpful and reliable seller. The book has been great for my course.' },
];

async function createOrdersForSoldBooksWhenNeeded() {
  const [soldBooks, students] = await Promise.all([
    Book.find({ listingType: 'sell', status: 'sold' })
      .select('_id seller sellingPrice price updatedAt')
      .sort({ updatedAt: -1 })
      .limit(MAX_REVIEWS)
      .lean(),
    User.find({ role: 'student' }).select('_id').lean(),
  ]);
  if (!soldBooks.length || students.length < 2) return [];

  const createdOrders = [];
  for (const book of soldBooks) {
    const sellerId = String(book.seller);
    const buyer = students.find((student) => String(student._id) !== sellerId);
    const price = Number(book.sellingPrice) || Number(book.price) || 0;
    if (!buyer || price <= 0 || await Order.exists({ book: book._id })) continue;

    createdOrders.push(await Order.create({
      buyer: buyer._id,
      seller: book.seller,
      book: book._id,
      price,
      amount: price,
      status: 'completed',
      orderStatus: 'completed',
      paymentStatus: 'completed',
      completedAt: book.updatedAt || new Date(),
      notes: 'Completed listing recovered by the review seed utility.',
    }));
  }
  return createdOrders;
}

async function seedReviews() {
  let completedOrders = await Order.find({
    $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
    $expr: { $ne: ['$buyer', '$seller'] },
  })
    .sort({ completedAt: 1, createdAt: 1 })
    .limit(MAX_REVIEWS)
    .lean();

  if (!completedOrders.length) {
    const createdOrders = await createOrdersForSoldBooksWhenNeeded();
    completedOrders = createdOrders;
  }

  let createdReviews = 0;
  for (const [index, order] of completedOrders.entries()) {
    const alreadyReviewed = await Review.exists({ order: order._id });
    if (alreadyReviewed) continue;

    const sample = reviewSamples[index % reviewSamples.length];
    await Review.create({
      order: order._id,
      reviewer: order.buyer,
      seller: order.seller,
      rating: sample.rating,
      comment: sample.comment,
    });
    createdReviews += 1;
  }

  const ratingStats = await Review.aggregate([
    {
      $group: {
        _id: '$seller',
        rating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);
  const statsBySeller = new Map(
    ratingStats.map((stats) => [
      stats._id.toString(),
      {
        rating: Math.round(stats.rating * 10) / 10,
        totalRatings: stats.totalRatings,
      },
    ])
  );
  const users = await User.find({}).select('_id').lean();
  if (users.length) {
    await User.bulkWrite(users.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: statsBySeller.get(user._id.toString()) || { rating: 0, totalRatings: 0 },
        },
      },
    })));
  }

  console.log(`Completed orders checked: ${completedOrders.length}`);
  console.log(`Reviews created: ${createdReviews}`);
  console.log(`Seller ratings recomputed for ${users.length} users.`);
}

async function run() {
  try {
    await connectDB();
    await seedReviews();
  } catch (error) {
    console.error(`Review seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

await run();
