import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { AppError } from '../middlewares/errorHandler.js';

export const saveConversationMessage = async ({
  conversationId,
  senderId,
  text = '',
  image = '',
}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : '';
  if (normalizedText.length > 2000) {
    throw new AppError('Message cannot exceed 2000 characters', 400);
  }
  if (!normalizedText && !image) {
    throw new AppError('Message text or image is required', 400);
  }
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid conversation ID format', 400);
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }
  const senderIdString = senderId.toString();
  if (!conversation.participants.some((participant) => participant.toString() === senderIdString)) {
    throw new AppError('You are not a participant in this conversation', 403);
  }

  const recipient = conversation.participants.find(
    (participant) => participant.toString() !== senderIdString
  );
  if (!recipient) {
    throw new AppError('Conversation must have another participant', 400);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    recipient,
    text: normalizedText,
    content: normalizedText,
    image,
    readBy: [senderId],
  });

  const recipientId = recipient.toString();
  const lastMessage = normalizedText || 'Image';
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage,
        lastMessageText: lastMessage,
        lastMessageAt: message.createdAt,
      },
      $inc: { [`unreadCounts.${recipientId}`]: 1 },
    }
  );

  await message.populate('sender', 'name avatar isVerified');
  return {
    message,
    conversation,
    recipientId,
  };
};
