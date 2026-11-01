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

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/analytics/activity', getActivity);
router.get('/analytics/categories', getAnalyticsCategories);
router.get('/analytics/universities', getAnalyticsUniversities);
router.get('/recent', getRecent);

router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.patch('/users/:id/verify', verifyUser);
router.get('/books', getBooks);
router.patch('/books/:id/approve', approveBook);
router.patch('/books/:id/reject', rejectBook);
router.delete('/books/:id', removeBook);
router.get('/orders', getOrders);
router.get('/exchanges', getExchanges);
router.get('/donations', getDonations);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/categories/:id', getCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', removeCategory);
router.get('/universities', getUniversities);
router.post('/universities', createUniversity);
router.get('/universities/:id', getUniversity);
router.put('/universities/:id', updateUniversity);
router.patch('/universities/:id', updateUniversity);
router.delete('/universities/:id', removeUniversity);
router.get('/export/users', exportUsers);
router.get('/export/orders', exportOrders);

export default router;
