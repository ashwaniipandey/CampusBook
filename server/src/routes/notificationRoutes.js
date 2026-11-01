import express from 'express';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getUnreadNotificationCount);
router.patch('/read-all', markAllNotificationsRead);
router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
