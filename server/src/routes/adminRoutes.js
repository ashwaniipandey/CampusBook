import express from 'express';
import {
  getActivity,
  getAnalyticsCategories,
  getAnalyticsUniversities,
  getBooks,
  getCategories,
  getCategory,
  getDonations,
  getExchanges,
  getOrders,
  getRecent,
  getStats,
  getUniversities,
  getUniversity,
  getUsers,
  listPendingVerifications,
  approveIdCard,
  rejectIdCard,
  blockUser,
  unblockUser,
  verifyUser,
  approveBook,
  rejectBook,
  removeBook,
  createCategory,
  updateCategory,
  removeCategory,
  createUniversity,
  updateUniversity,
  removeUniversity,
  exportUsers,
  exportOrders,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAdminQuery, validateAllowedQuery, validateBody } from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.use(protect, authorize('admin'));

router.get('/stats', validateAllowedQuery(), getStats);
router.get('/analytics/activity', validateAdminQuery('activity'), getActivity);
router.get('/analytics/categories', validateAllowedQuery(), getAnalyticsCategories);
router.get('/analytics/universities', validateAllowedQuery(), getAnalyticsUniversities);
router.get('/recent', validateAllowedQuery(), getRecent);

router.get('/users', validateAdminQuery('users'), getUsers);
router.get('/verifications/pending', validateAllowedQuery(), listPendingVerifications);
router.patch('/verifications/:id/approve', validateAllowedQuery(), validateBody('verificationDecision'), approveIdCard);
router.patch('/verifications/:id/reject', validateAllowedQuery(), validateBody('verificationDecision'), rejectIdCard);
router.patch('/users/:id/block', validateAllowedQuery(), blockUser);
router.patch('/users/:id/unblock', validateAllowedQuery(), unblockUser);
router.patch('/users/:id/verify', validateAllowedQuery(), verifyUser);
router.get('/books', validateAdminQuery('books'), getBooks);
router.patch('/books/:id/approve', validateAllowedQuery(), approveBook);
router.patch('/books/:id/reject', validateAllowedQuery(), rejectBook);
router.delete('/books/:id', validateAllowedQuery(), removeBook);
router.get('/orders', validateAdminQuery('orders'), getOrders);
router.get('/exchanges', validateAdminQuery('exchanges'), getExchanges);
router.get('/donations', validateAdminQuery('donations'), getDonations);
router.get('/categories', validateAllowedQuery(), getCategories);
router.post('/categories', validateAllowedQuery(), createCategory);
router.get('/categories/:id', validateAllowedQuery(), getCategory);
router.put('/categories/:id', validateAllowedQuery(), updateCategory);
router.patch('/categories/:id', validateAllowedQuery(), updateCategory);
router.delete('/categories/:id', validateAllowedQuery(), removeCategory);
router.get('/universities', validateAllowedQuery(), getUniversities);
router.post('/universities', validateAllowedQuery(), createUniversity);
router.get('/universities/:id', validateAllowedQuery(), getUniversity);
router.put('/universities/:id', validateAllowedQuery(), updateUniversity);
router.patch('/universities/:id', validateAllowedQuery(), updateUniversity);
router.delete('/universities/:id', validateAllowedQuery(), removeUniversity);
router.get('/export/users', validateAllowedQuery(), exportUsers);
router.get('/export/orders', validateAllowedQuery(), exportOrders);

export default router;
