import mongoose from 'mongoose';
import {
  Book,
  Conversation,
  DonationRequest,
  ExchangeRequest,
  Notification,
  Order,
  Review,
  Wishlist,
} from '../models/index.js';
import { buildNotificationLink } from '../utils/notifications.js';

const completedOrdersFilter = (userId) => ({
  buyer: userId,
  $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
});

const activityItem = (type, text, link, createdAt) => ({
  type,
  text,
  link,
  createdAt,
});

const orderActivityText = (order, userId) => {
  const isBuyer = order.buyer?._id?.toString() === userId.toString();
  const status = order.status || order.orderStatus || 'placed';
  return isBuyer
    ? `Purchase ${status.replaceAll('_', ' ')}: ${order.book?.title || 'a book'}`
    : `Sale ${status.replaceAll('_', ' ')}: ${order.book?.title || 'a book'}`;
};

const getUnreadCount = (unreadCounts, userId) => {
  if (unreadCounts instanceof Map) return Number(unreadCounts.get(userId.toString()) || 0);
  return Number(unreadCounts?.[userId.toString()] || 0);
};

const getRecommendations = async (user, wishlistCategoryIds, purchasedCategoryIds) => {
  const interests = [];
  if (user.course) interests.push({ course: new RegExp(user.course.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  if (user.semester) interests.push({ semester: new RegExp(user.semester.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
  if (user.university) interests.push({ university: user.university._id || user.university });

  const categoryIds = [...wishlistCategoryIds, ...purchasedCategoryIds];
  if (categoryIds.length) {
    interests.push({ category: { $in: categoryIds } });
  }

  const baseFilter = {
    status: 'approved',
    seller: { $ne: user._id },
  };
  let recommendations = [];
  if (interests.length) {
    recommendations = await Book.find({ ...baseFilter, $or: interests })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category', 'name slug')
      .populate('university', 'name code')
      .populate('seller', 'name avatar isVerified')
      .lean();
  }

  if (!recommendations.length) {
    recommendations = await Book.find(baseFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('category', 'name slug')
      .populate('university', 'name code')
      .populate('seller', 'name avatar isVerified')
      .lean();
  }
  return recommendations;
};

export const getStudentDashboard = async (user) => {
  const userId = new mongoose.Types.ObjectId(user._id);
  const [
    booksListed,
    booksSold,
    completedPurchases,
    activeExchanges,
    donationsMade,
    donationsReceived,
    pendingExchanges,
    pendingDonations,
    conversations,
    wishlistItems,
    purchasedBooks,
    orderActivity,
    exchangeActivity,
    donationActivity,
    reviewActivity,
    notificationActivity,
  ] = await Promise.all([
    Book.countDocuments({ seller: userId }),
    Book.countDocuments({ seller: userId, status: 'sold' }),
    Order.find(completedOrdersFilter(userId)).select('price amount book createdAt status orderStatus').populate('book', 'title originalPrice').lean(),
    ExchangeRequest.countDocuments({
      $or: [{ requester: userId }, { bookOwner: userId }],
      status: { $in: ['pending', 'accepted'] },
    }),
    DonationRequest.countDocuments({ donor: userId, status: 'completed' }),
    DonationRequest.countDocuments({ requester: userId, status: 'completed' }),
    ExchangeRequest.countDocuments({ bookOwner: userId, status: 'pending' }),
    DonationRequest.countDocuments({ donor: userId, status: 'pending' }),
    Conversation.find({ participants: userId }).select('unreadCounts').lean(),
    Wishlist.find({ user: userId }).select('book').populate('book', 'category').lean(),
    Order.find(completedOrdersFilter(userId)).select('book').populate('book', 'category').lean(),
    Order.find({ $or: [{ buyer: userId }, { seller: userId }] })
      .sort({ updatedAt: -1 }).limit(10).populate('book', 'title').populate('buyer', 'name').lean(),
    ExchangeRequest.find({ $or: [{ requester: userId }, { bookOwner: userId }] })
      .sort({ updatedAt: -1 }).limit(10).populate('requestedBook', 'title').lean(),
    DonationRequest.find({ $or: [{ requester: userId }, { donor: userId }] })
      .sort({ updatedAt: -1 }).limit(10).populate('book', 'title').lean(),
    Review.find({ $or: [{ reviewer: userId }, { seller: userId }] })
      .sort({ createdAt: -1 }).limit(10).populate({ path: 'order', populate: { path: 'book', select: 'title' } }).lean(),
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const purchasedCategoryIds = purchasedBooks
    .map((order) => order.book?.category)
    .filter(Boolean);
  const wishlistCategoryIds = wishlistItems
    .map((item) => item.book?.category)
    .filter(Boolean);

  const totalMoneySaved = completedPurchases.reduce((total, order) => {
    const originalPrice = Number(order.book?.originalPrice || 0);
    const paidPrice = Number(order.price ?? order.amount ?? 0);
    return total + Math.max(0, originalPrice - paidPrice);
  }, 0);

  const activities = [
    ...orderActivity.map((order) => activityItem(
      'order',
      orderActivityText(order, userId),
      order.book?._id ? `/books/${order.book._id}` : '/orders',
      order.updatedAt || order.createdAt
    )),
    ...exchangeActivity.map((exchange) => activityItem(
      'exchange',
      `Exchange ${exchange.status}: ${exchange.requestedBook?.title || 'a book'}`,
      '/exchanges',
      exchange.updatedAt || exchange.createdAt
    )),
    ...donationActivity.map((donation) => activityItem(
      'donation',
      `Donation ${donation.status}: ${donation.book?.title || 'a book'}`,
      '/donations',
      donation.updatedAt || donation.createdAt
    )),
    ...reviewActivity.map((review) => activityItem(
      'review',
      `Review submitted: ${review.order?.book?.title || 'a book'}`,
      '/orders',
      review.createdAt
    )),
    ...notificationActivity.map((notification) => activityItem(
      'notification',
      notification.message,
      buildNotificationLink(notification),
      notification.createdAt
    )),
  ]
    .filter((activity) => activity.createdAt)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 10);

  const [unreadMessages, recommended] = await Promise.all([
    Promise.resolve(conversations.reduce(
      (total, conversation) => total + getUnreadCount(conversation.unreadCounts, userId),
      0
    )),
    getRecommendations(user, wishlistCategoryIds, purchasedCategoryIds),
  ]);

  return {
    booksListed,
    booksSold,
    booksPurchased: completedPurchases.length,
    activeExchanges,
    donationsMade,
    donationsReceived,
    totalMoneySaved,
    pendingRequests: pendingExchanges + pendingDonations,
    unreadMessages,
    recentActivity: activities,
    recommended,
  };
};
