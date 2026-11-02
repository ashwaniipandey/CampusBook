import express from 'express';
import {
  createDonationRequest,
  getDonationRequests,
  updateDonationRequestStatus,
} from '../controllers/donationController.js';
import { protect, requireVerified } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAllowedQuery, validateBody, validateRoleQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.use(protect);

router.post('/', requireVerified, validateAllowedQuery(), validateBody('donation'), createDonationRequest);
router.get('/', validateRoleQuery(['received', 'sent']), getDonationRequests);
router.patch('/:id/status', validateAllowedQuery(), validateBody('requestStatus'), updateDonationRequestStatus);

export default router;
