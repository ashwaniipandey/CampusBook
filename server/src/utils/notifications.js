import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';

const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id;
  if (typeof value.toHexString === 'function') return value;
  return typeof value.id === 'string' ? value.id : value;
};

const normalizeNotificationIds = (values) => Object.fromEntries(
  Object.entries(values).map(([key, value]) => [
    key,
    key.endsWith('Id') && value ? getId(value).toString() : value,
  ])
);

export const buildNotificationLink = (notification) => {
  const ids = notification.data || {};
  switch (notification.type) {
    case 'order':
    case 'review':
      return '/orders';
    case 'exchange_request':
      return '/exchanges';
    case 'donation_request':
      return '/donations';
    case 'message':
      return ids.conversationId ? `/messages/${ids.conversationId}` : '/messages';
    case 'book_status':
    case 'wishlist_alert':
      return ids.bookId ? `/books/${ids.bookId}` : '/';
    case 'system':
      if (ids.orderId) return '/orders';
      if (ids.conversationId) return `/messages/${ids.conversationId}`;
      if (ids.bookId) return `/books/${ids.bookId}`;
      if (ids.verificationStatus) return '/verify';
      return '/';
    default:
      return '/';
  }
};

const requiredIdByType = {
  order: ['orderId'],
  review: ['orderId'],
  exchange_request: ['exchangeId', 'exchangeRequestId'],
  donation_request: ['donationId', 'donationRequestId'],
  message: ['conversationId'],
  book_status: ['bookId'],
  wishlist_alert: ['bookId'],
};

export const createNotification = async ({
  user,
  sender,
  type,
  title,
  message,
  ids = {},
  data = {},
  io,
}) => {
  const recipient = getId(user);
  if (!recipient) throw new AppError('A notification recipient is required', 400);
  if (!type) throw new AppError('A notification type is required', 400);

  const requiredIds = requiredIdByType[type] || [];
  if (requiredIds.length && !requiredIds.some((key) => ids[key] || data[key])) {
    throw new AppError(`A ${requiredIds[0]} is required for ${type} notifications`, 400);
  }

  const notificationData = normalizeNotificationIds({ ...data, ...ids });
  const link = buildNotificationLink({ type, data: notificationData });
  const now = new Date();
  const fields = {
    ...(sender ? { sender: getId(sender) } : {}),
    title,
    message,
    link,
    data: notificationData,
    isRead: false,
    readAt: null,
    createdAt: now,
    updatedAt: now,
  };
  let notification;

  if (type === 'message' && notificationData.conversationId) {
    notification = await Notification.findOneAndUpdate(
      {
        recipient,
        type,
        'data.conversationId': notificationData.conversationId,
      },
      {
        $set: fields,
        $setOnInsert: { recipient, type },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        timestamps: false,
      }
    );
  } else {
    notification = await Notification.create({
      recipient,
      ...(sender ? { sender: getId(sender) } : {}),
      type,
      title,
      message,
      link,
      data: notificationData,
    });
  }

  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification', notification.toObject());
  }
  return notification;
};
