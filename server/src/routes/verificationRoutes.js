import express from 'express';
import {
  getVerificationStatus,
  sendCollegeEmailOtp,
  submitIdCard,
  verifyCollegeEmailOtp,
} from '../controllers/verificationController.js';
import { protect } from '../middlewares/auth.js';
import { sensitiveAuthLimiter, uploadLimiter } from '../middlewares/rateLimiter.js';
import { uploadIdCardImage } from '../middlewares/upload.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';
import { validateVerificationBody } from '../validations/authValidation.js';

const router = express.Router();
router.use(validateAllowedQuery(), protect);
router.get('/status', getVerificationStatus);
router.post('/email/send-otp', sensitiveAuthLimiter, validateVerificationBody('collegeEmail'), sendCollegeEmailOtp);
router.post('/email/verify', sensitiveAuthLimiter, validateVerificationBody('collegeOtp'), verifyCollegeEmailOtp);
router.post('/id-card', uploadLimiter, uploadIdCardImage, submitIdCard);

export default router;
