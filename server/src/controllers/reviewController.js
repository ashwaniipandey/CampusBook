import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Submit a review for a completed order
 * POST /api/reviews
 * Access: Private (Buyer of completed order only)
 */
export const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    const order = await Order.findById(orderId).populate('book', 'title');
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Rule 1: Only the buyer can review
    if (order.buyer.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the buyer of this order can submit a review', 403));
    }

    // Rule 2: Order must be completed
    const currentStatus = order.status || order.orderStatus;
    if (currentStatus !== 'completed') {
      return next(new AppError('You can only review completed orders', 400));
    }

    // Rule 3: Once per order
    const existingReview = await Review.findOne({ order: order._id });
    if (existingReview) {
      return next(new AppError('You have already submitted a review for this order', 400));
    }

    const review = await Review.create({
      order: order._id,
      reviewer: req.user._id,
      seller: order.seller,
      rating: Number(rating),
      comment: comment || '',
    });

    // Update seller's average rating and total ratings on User model
    const stats = await Review.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(order.seller) } },
      {
        $group: {
          _id: '$seller',
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10;
      await User.findByIdAndUpdate(order.seller, {
        rating: avg,
        totalRatings: stats[0].totalRatings,
      });
    }

    // Notify seller
    await Notification.create({
      recipient: order.seller,
      sender: req.user._id,
      type: 'system',
      title: 'New Review Received',
      message: `${req.user.name} gave you a ${rating}★ review for "${order.book?.title}".`,
      link: '/profile',
      data: { reviewId: review._id, orderId: order._id },
    });

    await review.populate('reviewer', 'name avatar isVerified department yearOfStudy');

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('You have already reviewed this order', 400));
    }
    next(error);
  }
};

/**
 * Get all reviews for a specific seller
 * GET /api/users/:id/reviews
 * Access: Public
 */
export const getSellerReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid user ID format', 400));
    }

    const seller = await User.findById(id).select(
      'name avatar rating totalRatings isVerified department'
    );
    if (!seller) {
      return next(new AppError('User not found', 404));
    }

    const reviews = await Review.find({ seller: id })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'name avatar isVerified department yearOfStudy')
      .populate('order', 'orderNumber createdAt');

    res.status(200).json({
      status: 'success',
      seller: {
        _id: seller._id,
        name: seller.name,
        avatar: seller.avatar,
        rating: seller.rating,
        totalRatings: seller.totalRatings,
        isVerified: seller.isVerified,
        department: seller.department,
      },
      results: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

