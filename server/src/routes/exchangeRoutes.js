import express from 'express';
import {
  createExchangeRequest,
  getExchangeRequests,
  updateExchangeRequestStatus,
} from '../controllers/exchangeController.js';
import { protect, requireVerified } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import { validateAllowedQuery, validateBody, validateRoleQuery } from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.use(protect);

router.post('/', requireVerified, validateAllowedQuery(), validateBody('exchange'), createExchangeRequest);
router.get('/', validateRoleQuery(['received', 'sent']), getExchangeRequests);
router.patch('/:id/status', validateAllowedQuery(), validateBody('requestStatus'), updateExchangeRequestStatus);

export default router;
