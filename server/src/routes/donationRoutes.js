import express from 'express';
import {
  createDonationRequest,
  getDonationRequests,
  updateDonationRequestStatus,
} from '../controllers/donationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createDonationRequest);
router.get('/', getDonationRequests);
router.patch('/:id/status', updateDonationRequestStatus);

export default router;
