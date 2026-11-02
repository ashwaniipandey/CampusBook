import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import { Book, Order, Review, User } from '../models/index.js';

dotenv.config();

const DEMO_REVIEW_TARGET = 20;
const APPROVED_STATUSES = ['approved', 'available'];
const reviewSamples = [
  { rating: 5, comment: 'The book was exactly as described, and the pages were in excellent condition. Pickup was easy too.' },
  { rating: 4, comment: 'Good communication and a convenient handoff near the library. The book is great for class.' },
  { rating: 5, comment: 'Quick replies, fair price, and a smooth campus pickup. I would happily buy from this seller again.' },
  { rating: 5, comment: 'The seller kept me updated and had the book ready when we agreed. Very positive experience.' },
  { rating: 4, comment: 'Accurate listing and friendly seller. There is a little wear, but nothing that affects the book.' },
  { rating: 5, comment: 'Everything went smoothly, and the book is already helping with my coursework. Thank you!' },
  { rating: 4, comment: 'Easy to arrange a meeting between classes. The book matched the photos and description.' },
  { rating: 5, comment: 'A really helpful student seller. We found a convenient place to meet on campus.' },
  { rating: 4, comment: 'The handover was on time and the book was in the condition described.' },
  { rating: 5, comment: 'Great experience from the first message to pickup. I would recommend this seller.' },
  { rating: 3, comment: 'The book was useful and the pickup worked out, though arranging a time took a couple of messages.' },
  { rating: 4, comment: 'Fair price for a useful textbook. The seller was responsive and easy to coordinate with.' },
  { rating: 5, comment: 'The seller was kind and the book was ready for pickup right on schedule.' },
  { rating: 4, comment: 'A straightforward campus handoff and a book that will get plenty more use this semester.' },
  { rating: 5, comment: 'Better than expected for a pre-loved copy. Thanks for making the exchange simple.' },
  { rating: 3, comment: 'The book itself is as listed. The meeting time shifted, but we were able to complete the handoff.' },
  { rating: 4, comment: 'Helpful communication and a convenient pickup spot. Happy with the purchase.' },
  { rating: 5, comment: 'Everything was just as promised. I would gladly recommend this seller to other students.' },
  { rating: 4, comment: 'The listing was accurate and the seller made it easy to meet on campus.' },
  { rating: 5, comment: 'Smooth transaction, friendly seller, and a great book for my course.' },
];

function chooseRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function chooseReview() {
  const roll = Math.random();
  const rating = roll < 0.15 ? 3 : roll < 0.58 ? 4 : 5;
  const comments = reviewSamples.filter((sample) => sample.rating === rating);
  return chooseRandom(comments);
}

function isCompleted(order) {
  return order.status === 'completed' || order.orderStatus === 'completed';
}

async function createCompletedDemoOrder(book, students) {
  const sellerId = String(book.seller);
  const eligibleBuyers = students.filter((student) => String(student._id) !== sellerId);
  if (!eligibleBuyers.length) return null;

  const price = Number(book.sellingPrice) || Number(book.price) || 0;
  if (price <= 0) return null;

  const buyer = chooseRandom(eligibleBuyers);
  return Order.create({
    buyer: buyer._id,
    seller: book.seller,
    book: book._id,
    price,
    amount: price,
    status: 'completed',
    orderStatus: 'completed',
    paymentStatus: 'completed',
    paymentMethod: 'handover',
    deliveryMethod: 'campus_pickup',
    meetingLocation: 'Campus library entrance',
    completedAt: new Date(),
    notes: 'Demo transaction completed after an arranged campus handoff.',
    isDemo: true,
  });
}

async function markBookSoldWhenInventoryAllows(bookId, remainingApprovedBooks) {
  if (remainingApprovedBooks <= 25) return remainingApprovedBooks;

  const result = await Book.updateOne(
    { _id: bookId, listingType: 'sell', status: { $in: APPROVED_STATUSES } },
    { $set: { status: 'sold' } }
  );
  return result.modifiedCount ? remainingApprovedBooks - 1 : remainingApprovedBooks;
}

async function createDemoOrdersAndReviews(students, existingDemoReviews) {
  let reviewCount = existingDemoReviews;
  let remainingApprovedBooks = await Book.countDocuments({
    status: { $in: APPROVED_STATUSES },
  });
  let createdOrders = 0;
  let createdReviews = 0;

  const pendingDemoOrders = await Order.find({ isDemo: true })
    .sort({ createdAt: 1 })
    .lean();

  for (const order of pendingDemoOrders) {
    if (reviewCount >= DEMO_REVIEW_TARGET) break;
    if (order.book) {
      remainingApprovedBooks = await markBookSoldWhenInventoryAllows(
        order.book,
        remainingApprovedBooks
      );
    }
    if (!isCompleted(order) || await Review.exists({ order: order._id })) continue;
    const sample = chooseReview();
    await Review.create({
      order: order._id,
      reviewer: order.buyer,
      seller: order.seller,
      rating: sample.rating,
      comment: sample.comment,
      isDemo: true,
    });
    reviewCount += 1;
    createdReviews += 1;
  }

  if (reviewCount >= DEMO_REVIEW_TARGET) {
    return { createdOrders, createdReviews, remainingApprovedBooks };
  }

  const existingOrders = await Order.find({}).select('book').lean();
  const usedBookIds = new Set(existingOrders.map((order) => String(order.book)));
  const candidateBooks = await Book.find({
    listingType: 'sell',
    status: { $in: APPROVED_STATUSES },
    seller: { $in: students.map((student) => student._id) },
  })
    .select('_id seller sellingPrice price')
    .lean();

  for (const book of shuffle(candidateBooks)) {
    if (reviewCount >= DEMO_REVIEW_TARGET) break;
    if (usedBookIds.has(String(book._id))) continue;

    const order = await createCompletedDemoOrder(book, students);
    if (!order) continue;

    createdOrders += 1;
    usedBookIds.add(String(book._id));
    remainingApprovedBooks = await markBookSoldWhenInventoryAllows(
      book._id,
      remainingApprovedBooks
    );

    const sample = chooseReview();
    await Review.create({
      order: order._id,
      reviewer: order.buyer,
      seller: order.seller,
      rating: sample.rating,
      comment: sample.comment,
      isDemo: true,
    });
    reviewCount += 1;
    createdReviews += 1;
  }

  if (reviewCount < DEMO_REVIEW_TARGET) {
    const completedOrders = await Order.find({
      $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
      $expr: { $ne: ['$buyer', '$seller'] },
    })
      .sort({ completedAt: 1, createdAt: 1 })
      .lean();

    for (const order of completedOrders) {
      if (reviewCount >= DEMO_REVIEW_TARGET) break;
      if (await Review.exists({ order: order._id })) continue;
      const sample = chooseReview();
      await Review.create({
        order: order._id,
        reviewer: order.buyer,
        seller: order.seller,
        rating: sample.rating,
        comment: sample.comment,
        isDemo: true,
      });
      reviewCount += 1;
      createdReviews += 1;
    }
  }

  return { createdOrders, createdReviews, remainingApprovedBooks };
}

async function recomputeSellerRatings() {
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
  return users.length;
}

async function seedReviews() {
  const students = await User.find({ role: 'student' }).select('_id').lean();
  const existingDemoReviews = await Review.countDocuments({ isDemo: true });

  let seeded = { createdOrders: 0, createdReviews: 0, remainingApprovedBooks: 0 };
  if (existingDemoReviews >= DEMO_REVIEW_TARGET) {
    console.log(`Demo reviews already exist (${existingDemoReviews}); skipping demo generation.`);
  } else if (students.length < 2) {
    console.log('At least two student accounts are required; skipping demo order and review generation.');
  } else {
    seeded = await createDemoOrdersAndReviews(students, existingDemoReviews);
  }

  const usersUpdated = await recomputeSellerRatings();
  const finalApprovedBooks = await Book.countDocuments({
    status: { $in: APPROVED_STATUSES },
  });
  const finalDemoReviews = await Review.countDocuments({ isDemo: true });

  console.log(`Demo orders created: ${seeded.createdOrders}`);
  console.log(`Demo reviews created: ${seeded.createdReviews}`);
  console.log(`Total generated demo reviews: ${finalDemoReviews}`);
  console.log(`Approved books remaining: ${finalApprovedBooks}`);
  console.log(`Seller ratings recomputed for ${usersUpdated} users.`);
  if (finalDemoReviews < 15) {
    console.warn('Fewer than 15 demo reviews could be generated from the available eligible books and completed orders.');
  }
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
