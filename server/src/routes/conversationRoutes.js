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
import { protect } from '../middlewares/auth.js';
import { uploadMessageImage } from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id/messages', requireConversationParticipant, getConversationMessages);
router.post('/:id/messages', requireConversationParticipant, sendMessage);
router.patch('/:id/read', requireConversationParticipant, markConversationRead);
router.post(
  '/:id/image',
  requireConversationParticipant,
  uploadMessageImage,
  uploadConversationImage
);

export default router;
