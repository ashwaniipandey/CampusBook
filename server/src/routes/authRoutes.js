import express from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { authLimiter, sensitiveAuthLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', sensitiveAuthLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', sensitiveAuthLimiter, resendOtp);
router.post('/forgot-password', sensitiveAuthLimiter, forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, resetPassword);
router.post('/logout', logout);

// Authenticated user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, sensitiveAuthLimiter, changePassword);

// Role middleware test route (Admin only)
router.get('/admin-check', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Authorized: You have admin privileges.',
    user: req.user,
  });
});

export default router;

