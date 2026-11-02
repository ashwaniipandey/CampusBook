import express from 'express';
import {
  register,
  googleLogin,
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
import { validateAuthBody } from '../validations/authValidation.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.use(validateAllowedQuery());

// Public routes with rate limiting
router.post('/register', authLimiter, validateAuthBody('register'), register);
router.post('/login', sensitiveAuthLimiter, validateAuthBody('login'), login);
router.post('/google', sensitiveAuthLimiter, validateAuthBody('google'), googleLogin);
router.post('/verify-otp', sensitiveAuthLimiter, validateAuthBody('verifyOtp'), verifyOtp);
router.post('/resend-otp', sensitiveAuthLimiter, validateAuthBody('resendOtp'), resendOtp);
router.post('/forgot-password', sensitiveAuthLimiter, validateAuthBody('forgotPassword'), forgotPassword);
router.post('/reset-password', sensitiveAuthLimiter, validateAuthBody('resetPassword'), resetPassword);
router.post('/logout', logout);

// Authenticated user routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateAuthBody('profile'), updateProfile);
router.put('/change-password', protect, sensitiveAuthLimiter, validateAuthBody('changePassword'), changePassword);

// Role middleware test route (Admin only)
router.get('/admin-check', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Authorized: You have admin privileges.',
    user: req.user,
  });
});

export default router;
