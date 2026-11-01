import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';
import { buildNotificationLink } from '../utils/notifications.js';

const parsePositiveInteger = (value, fallback, name, maximum) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum && parsed > maximum)) {
    throw new AppError(
      `${name} must be an integer between 1 and ${maximum || 'a positive integer'}`,
      400
    );
  }
  return parsed;
};

const serializeNotification = (notification) => ({
  _id: notification._id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  link: buildNotificationLink(notification),
  data: notification.data || {},
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

export const getNotifications = async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1, 'page');
    const limit = parsePositiveInteger(req.query.limit, 20, 'limit', 100);
    if (req.query.unread !== undefined && !['true', 'false'].includes(req.query.unread)) {
      return next(new AppError('unread must be true or false', 400));
    }

    const filter = { recipient: req.user._id };
    if (req.query.unread === 'true') filter.isRead = false;
    if (req.query.unread === 'false') filter.isRead = true;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      status: 'success',
      notifications: notifications.map(serializeNotification),
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.status(200).json({ status: 'success', unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

const findOwnedNotification = async (notificationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Invalid notification ID format', 400);
  }
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new AppError('Notification not found', 404);
  if (!notification.recipient.equals(userId)) {
    throw new AppError('You do not have permission to access this notification', 403);
  }
  return notification;
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await findOwnedNotification(req.params.id, req.user._id);
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      notification: serializeNotification(notification),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await findOwnedNotification(req.params.id, req.user._id);
    await notification.deleteOne();
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
      notificationId: notification._id,
    });
  } catch (error) {
    next(error);
  }
};
