import {
  getActivityAnalytics,
  getAdminStats,
  getCategoryAnalytics,
  getRecentAdminActivity,
  getUniversityAnalytics,
  approveAdminBook,
  createAdminCategory,
  createAdminUniversity,
  deleteAdminBook,
  deleteAdminCategory,
  deleteAdminUniversity,
  exportAdminOrdersCsv,
  exportAdminUsersCsv,
  getAdminBooks,
  getAdminDonations,
  getAdminExchanges,
  getAdminOrders,
  getAdminUsers,
  getAdminCategory,
  getAdminUniversity,
  listAdminCategories,
  listAdminUniversities,
  rejectAdminBook,
  setAdminUserBlocked,
  updateAdminCategory,
  updateAdminUniversity,
  verifyAdminUser,
} from '../services/adminService.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  approveIdCard,
  listPendingVerifications,
  rejectIdCard,
} from './verificationController.js';

const handleError = (error, next) => {
  if (error?.code === 11000) {
    return next(new AppError('A record with one of these unique values already exists.', 409));
  }
  return next(error);
};

const rejectUnknownFields = (body, allowed) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new AppError(`Unexpected field(s): ${unexpected.join(', ')}.`, 400);
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json({ status: 'success', ...stats });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const rawMonths = req.query.months === undefined ? '6' : req.query.months;
    const months = Number(rawMonths);
    if (!Number.isInteger(months) || months < 1 || months > 24) {
      return next(new AppError('months must be an integer between 1 and 24.', 400));
    }

    const activity = await getActivityAnalytics(months);
    res.status(200).json({ status: 'success', ...activity });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsCategories = async (req, res, next) => {
  try {
    const categories = await getCategoryAnalytics();
    res.status(200).json({ status: 'success', ...categories });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsUniversities = async (req, res, next) => {
  try {
    const universities = await getUniversityAnalytics();
    res.status(200).json({ status: 'success', ...universities });
  } catch (error) {
    next(error);
  }
};

export const getRecent = async (req, res, next) => {
  try {
    const recent = await getRecentAdminActivity();
    res.status(200).json({ status: 'success', ...recent });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', ...(await getAdminUsers(req.query)) });
  } catch (error) {
    handleError(error, next);
  }
};

export { listPendingVerifications, approveIdCard, rejectIdCard };

export const blockUser = async (req, res, next) => {
  try {
    const user = await setAdminUserBlocked(req.params.id, true, req.user._id);
    res.status(200).json({ status: 'success', message: 'User blocked successfully.', user });
  } catch (error) {
    handleError(error, next);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const user = await setAdminUserBlocked(req.params.id, false, req.user._id);
    res.status(200).json({ status: 'success', message: 'User unblocked successfully.', user });
  } catch (error) {
    handleError(error, next);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const user = await verifyAdminUser(req.params.id);
    res.status(200).json({ status: 'success', message: 'User verified successfully.', user });
  } catch (error) {
    handleError(error, next);
  }
};

export const getBooks = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', ...(await getAdminBooks(req.query)) });
  } catch (error) {
    handleError(error, next);
  }
};

export const approveBook = async (req, res, next) => {
  try {
    const book = await approveAdminBook(req.params.id, req.app.get('io'));
    res.status(200).json({ status: 'success', message: 'Book listing approved.', book });
  } catch (error) {
    handleError(error, next);
  }
};

export const rejectBook = async (req, res, next) => {
  try {
    rejectUnknownFields(req.body, ['reason']);
    if (req.body.reason !== undefined && typeof req.body.reason !== 'string') {
      throw new AppError('reason must be a string.', 400);
    }
    if (req.body.reason?.length > 500) throw new AppError('reason cannot exceed 500 characters.', 400);
    const book = await rejectAdminBook(req.params.id, req.body.reason, req.app.get('io'));
    res.status(200).json({ status: 'success', message: 'Book listing rejected.', book });
  } catch (error) {
    handleError(error, next);
  }
};

export const removeBook = async (req, res, next) => {
  try {
    const result = await deleteAdminBook(req.params.id);
    res.status(200).json({ status: 'success', message: 'Book listing and associated data deleted.', ...result });
  } catch (error) {
    handleError(error, next);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', ...(await getAdminOrders(req.query)) });
  } catch (error) {
    handleError(error, next);
  }
};

export const getExchanges = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', ...(await getAdminExchanges(req.query)) });
  } catch (error) {
    handleError(error, next);
  }
};

export const getDonations = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', ...(await getAdminDonations(req.query)) });
  } catch (error) {
    handleError(error, next);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await listAdminCategories();
    res.status(200).json({ status: 'success', results: categories.length, categories });
  } catch (error) {
    handleError(error, next);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await getAdminCategory(req.params.id);
    res.status(200).json({ status: 'success', category });
  } catch (error) {
    handleError(error, next);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    rejectUnknownFields(req.body, ['name', 'slug', 'description', 'icon', 'isActive']);
    const category = await createAdminCategory(req.body);
    res.status(201).json({ status: 'success', message: 'Category created.', category });
  } catch (error) {
    handleError(error, next);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    rejectUnknownFields(req.body, ['name', 'slug', 'description', 'icon', 'isActive']);
    const category = await updateAdminCategory(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'Category updated.', category });
  } catch (error) {
    handleError(error, next);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    await deleteAdminCategory(req.params.id);
    res.status(200).json({ status: 'success', message: 'Category deleted.' });
  } catch (error) {
    handleError(error, next);
  }
};

export const getUniversities = async (req, res, next) => {
  try {
    const universities = await listAdminUniversities();
    res.status(200).json({ status: 'success', results: universities.length, universities });
  } catch (error) {
    handleError(error, next);
  }
};

export const getUniversity = async (req, res, next) => {
  try {
    const university = await getAdminUniversity(req.params.id);
    res.status(200).json({ status: 'success', university });
  } catch (error) {
    handleError(error, next);
  }
};

export const createUniversity = async (req, res, next) => {
  try {
    rejectUnknownFields(req.body, ['name', 'code', 'domain', 'city', 'state', 'country', 'campuses', 'isActive']);
    const university = await createAdminUniversity(req.body);
    res.status(201).json({ status: 'success', message: 'University created.', university });
  } catch (error) {
    handleError(error, next);
  }
};

export const updateUniversity = async (req, res, next) => {
  try {
    rejectUnknownFields(req.body, ['name', 'code', 'domain', 'city', 'state', 'country', 'campuses', 'isActive']);
    const university = await updateAdminUniversity(req.params.id, req.body);
    res.status(200).json({ status: 'success', message: 'University updated.', university });
  } catch (error) {
    handleError(error, next);
  }
};

export const removeUniversity = async (req, res, next) => {
  try {
    await deleteAdminUniversity(req.params.id);
    res.status(200).json({ status: 'success', message: 'University deleted.' });
  } catch (error) {
    handleError(error, next);
  }
};

export const exportUsers = async (req, res, next) => {
  try {
    const csv = await exportAdminUsersCsv();
    res.status(200).type('text/csv').attachment('campusbook-users.csv').send(csv);
  } catch (error) {
    handleError(error, next);
  }
};

export const exportOrders = async (req, res, next) => {
  try {
    const csv = await exportAdminOrdersCsv();
    res.status(200).type('text/csv').attachment('campusbook-orders.csv').send(csv);
  } catch (error) {
    handleError(error, next);
  }
};

export const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { title, message, link, audience, universityId } = req.body;
    if (!title || !title.trim() || !message || !message.trim()) {
      return next(new AppError('Announcement title and message are required.', 400));
    }

    const User = (await import('../models/User.js')).default;
    const Notification = (await import('../models/Notification.js')).default;

    // Filter by audience:
    // 'all' (default) -> all active non-blocked users
    // 'verified' -> verified students
    // 'university' -> users at a specific university
    const filter = { isBlocked: false, status: { $ne: 'suspended' } };
    if (audience === 'verified') {
      filter.$or = [{ isVerified: true }, { verificationStatus: 'verified' }];
    } else if (audience === 'university' && universityId) {
      filter.university = universityId;
    }

    const users = await User.find(filter).select('_id');
    if (!users.length) {
      return res.status(200).json({
        status: 'success',
        message: 'No users found matching the selected audience criteria.',
        count: 0,
      });
    }

    const safeTitle = title.trim().slice(0, 120);
    const safeMessage = message.trim().slice(0, 500);
    const safeLink = (link || '/').trim().slice(0, 500);

    const notifications = users.map((u) => ({
      recipient: u._id,
      sender: req.user?._id || null,
      type: 'system',
      title: safeTitle,
      message: safeMessage,
      link: safeLink,
      isRead: false,
    }));

    await Notification.insertMany(notifications, { ordered: false });

    // Real-time broadcast to connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      const payload = {
        type: 'system',
        title: safeTitle,
        message: safeMessage,
        link: safeLink,
        createdAt: new Date().toISOString(),
      };

      if (!audience || audience === 'all') {
        io.emit('notification', payload);
      } else {
        // Targeted real-time delivery to users in their personal socket rooms
        for (const user of users) {
          io.to(`user:${user._id}`).emit('notification', payload);
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Announcement broadcast successfully to ${users.length} users.`,
      count: users.length,
    });
  } catch (error) {
    handleError(error, next);
  }
};

export const getBroadcastHistory = async (req, res, next) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;

    // Aggregate unique system notifications grouped by title + message + sender
    const history = await Notification.aggregate([
      { $match: { type: 'system' } },
      {
        $group: {
          _id: {
            title: '$title',
            message: '$message',
            link: '$link',
          },
          sentAt: { $max: '$createdAt' },
          recipientCount: { $sum: 1 },
        },
      },
      { $sort: { sentAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          title: '$_id.title',
          message: '$_id.message',
          link: '$_id.link',
          sentAt: 1,
          recipientCount: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      history,
    });
  } catch (error) {
    handleError(error, next);
  }
};
