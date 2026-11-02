import express from 'express';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAllowedQuery, validateNotificationsQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.use(protect);

router.get('/unread-count', validateAllowedQuery(), getUnreadNotificationCount);
router.patch('/read-all', validateAllowedQuery(), markAllNotificationsRead);
router.get('/', validateNotificationsQuery, getNotifications);
router.patch('/:id/read', validateAllowedQuery(), markNotificationRead);
router.delete('/:id', validateAllowedQuery(), deleteNotification);

export default router;
