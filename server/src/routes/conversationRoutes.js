import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationMessages,
  markConversationRead,
  requireConversationParticipant,
  sendMessage,
  uploadConversationImage,
} from '../controllers/conversationController.js';
import { protect, requireVerified } from '../middlewares/auth.js';
import { uploadMessageImage } from '../middlewares/upload.js';
import { chatLimiter, uploadLimiter } from '../middlewares/rateLimiter.js';
import { sanitizeRequestInputs, validateObjectIdParam } from '../middlewares/requestSecurity.js';
import {
  validateAllowedQuery,
  validateBody,
  validateConversationListQuery,
  validatePagedQuery,
} from '../validations/requestValidation.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.use(protect);

router.post('/', requireVerified, validateAllowedQuery(), validateBody('conversation'), createConversation);
router.get('/', validateConversationListQuery, getConversations);
router.get('/:id/messages', validatePagedQuery(['page', 'limit']), requireConversationParticipant, getConversationMessages);
router.post('/:id/messages', validateAllowedQuery(), chatLimiter, requireConversationParticipant, validateBody('message'), sendMessage);
router.patch('/:id/read', validateAllowedQuery(), requireConversationParticipant, markConversationRead);
router.post(
  '/:id/image',
  validateAllowedQuery(),
  uploadLimiter,
  requireConversationParticipant,
  uploadMessageImage,
  sanitizeRequestInputs,
  validateBody('imageMessage'),
  uploadConversationImage
);

export default router;
