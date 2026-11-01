import express from 'express';
import {
  createExchangeRequest,
  getExchangeRequests,
  updateExchangeRequestStatus,
} from '../controllers/exchangeController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createExchangeRequest);
router.get('/', getExchangeRequests);
router.patch('/:id/status', updateExchangeRequestStatus);

export default router;
