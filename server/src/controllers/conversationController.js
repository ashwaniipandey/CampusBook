import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { saveConversationMessage } from '../services/conversationMessageService.js';

const populateConversation = (query) =>
  query
    .populate({
      path: 'participants',
      select: 'name avatar university isVerified lastSeen',
      populate: { path: 'university', select: 'name code domain city state' },
    })
    .populate('book', 'title images')
    .populate('relatedBook', 'title images');

const getParticipant = (conversation, userId) =>
  conversation.participants.find(
    (participant) => participant._id.toString() !== userId.toString()
  );

const serializeConversation = (conversation, currentUserId) => {
  const result = conversation.toObject();
  const unreadCounts = conversation.unreadCounts;
  result.book = conversation.book || conversation.relatedBook || null;
  result.lastMessage = conversation.lastMessageText || conversation.lastMessage || '';
  result.otherParticipant = getParticipant(conversation, currentUserId);
  result.unreadCount = Number(unreadCounts?.get(currentUserId.toString()) || 0);
  return result;
};

export const requireConversationParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid conversation ID format', 400));
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }
    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return next(new AppError('You are not a participant in this conversation', 403));
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { userId, bookId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError('A valid userId is required', 400));
    }
    if (new mongoose.Types.ObjectId(userId).equals(req.user._id)) {
      return next(new AppError('You cannot start a conversation with yourself', 400));
    }
    if (
      bookId !== undefined &&
      bookId !== null &&
      bookId !== '' &&
      !mongoose.Types.ObjectId.isValid(bookId)
    ) {
      return next(new AppError('Invalid bookId format', 400));
    }

    const [otherUser, book] = await Promise.all([
      User.findById(userId).select('_id'),
      bookId ? Book.findById(bookId).select('_id') : Promise.resolve(null),
    ]);
    if (!otherUser) return next(new AppError('User not found', 404));
    if (bookId && !book) return next(new AppError('Book listing not found', 404));

    const participants = [req.user._id, otherUser._id];
    const participantPair = participants
      .map((participant) => participant.toString())
      .sort()
      .join(':');
    const conversationFilter = { participantPair, book: book?._id || null };
    let conversation = await Conversation.findOne(conversationFilter);

    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: participants },
        $expr: { $eq: [{ $size: '$participants' }, 2] },
        relatedBook: book?._id || null,
      });
      if (conversation) {
        conversation.participantPair = participantPair;
        conversation.book = book?._id || null;
        if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
        for (const participant of participants) {
          const participantId = participant.toString();
          if (!conversation.unreadCounts.has(participantId)) {
            conversation.unreadCounts.set(participantId, 0);
          }
        }
        await conversation.save();
      }
    }

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          participants,
          participantPair,
          book: book?._id || null,
          relatedBook: book?._id || null,
          unreadCounts: new Map([
            [req.user._id.toString(), 0],
            [otherUser._id.toString(), 0],
          ]),
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        conversation = await Conversation.findOne(conversationFilter);
        if (!conversation) throw error;
      }
    }

    const populatedConversation = await populateConversation(
      Conversation.findById(conversation._id)
    );
    res.status(200).json({
      status: 'success',
      conversation: serializeConversation(populatedConversation, req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const filter = { participants: req.user._id };
    if (req.query.q !== undefined) {
      if (typeof req.query.q !== 'string') {
        return next(new AppError('Search query must be text', 400));
      }
      const query = req.query.q.trim();
      if (query) {
        const matchingUsers = await User.find({
          name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
        }).select('_id');
        const matchingIds = matchingUsers
          .filter((user) => !user._id.equals(req.user._id))
          .map((user) => user._id);
        if (matchingIds.length === 0) {
          return res.status(200).json({
            status: 'success',
            results: 0,
            conversations: [],
          });
        }
        filter.participants = { $all: [req.user._id], $in: matchingIds };
      }
    }

    const conversations = await populateConversation(
      Conversation.find(filter).sort({ lastMessageAt: -1, updatedAt: -1 })
    );
    res.status(200).json({
      status: 'success',
      results: conversations.length,
      conversations: conversations.map((conversation) =>
        serializeConversation(conversation, req.user._id)
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 30 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return next(new AppError('Limit must be an integer between 1 and 100', 400));
    }

    const messages = await Message.find({ conversation: req.conversation._id })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar isVerified');
    const total = await Message.countDocuments({ conversation: req.conversation._id });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      page,
      limit,
      hasMore: page * limit < total,
      messages: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return next(new AppError('Message text is required', 400));
    }
    if (text.trim().length > 2000) {
      return next(new AppError('Message cannot exceed 2000 characters', 400));
    }

    const { message } = await saveConversationMessage({
      conversationId: req.conversation._id,
      senderId: req.user._id,
      text: text.trim(),
    });
    res.status(201).json({
      status: 'success',
      message: 'Message sent',
      sentMessage: message,
    });
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const conversation = req.conversation;
    const now = new Date();
    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        readAt: null,
      },
      {
        $set: { isRead: true, readAt: now },
        $addToSet: { readBy: req.user._id },
      }
    );
    conversation.unreadCounts.set(req.user._id.toString(), 0);
    await conversation.save();

    res.status(200).json({
      status: 'success',
      message: 'Conversation marked as read',
      conversationId: conversation._id,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadConversationImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please attach an image in the image field', 400));
    }
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (text.length > 2000) {
      return next(new AppError('Message cannot exceed 2000 characters', 400));
    }

    const uploadedImage = await uploadToCloudinary(
      req.file.buffer,
      'campusbook/messages'
    );
    const { message, recipientId } = await saveConversationMessage({
      conversationId: req.conversation._id,
      senderId: req.user._id,
      text,
      image: uploadedImage.url,
    });
    const io = req.app.get('io');
    if (io) {
      const senderId = req.user._id.toString();
      const recipientRoom = `user:${recipientId}`;
      const messageData = message.toObject();
      io.to(`user:${senderId}`).to(recipientRoom).emit('receive_message', messageData);

      const recipientIsOnline = Boolean(io.sockets.adapter.rooms.get(recipientRoom)?.size);
      if (recipientIsOnline) {
        io.to(recipientRoom).emit('new_message_notification', {
          conversationId: req.conversation._id,
          messageId: message._id,
          senderId,
          senderName: req.user.name,
          text: message.text || 'Image',
          createdAt: message.createdAt,
        });
      } else {
        try {
          await Notification.create({
            recipient: recipientId,
            sender: req.user._id,
            type: 'message',
            title: `New message from ${req.user.name}`,
            message: message.text || 'You received an image.',
            link: `/messages/${req.conversation._id}`,
            data: {
              conversationId: req.conversation._id,
              messageId: message._id,
              senderId,
            },
          });
        } catch (error) {
          console.error(`Unable to create offline image-message notification: ${error.message}`);
        }
      }
    }
    res.status(201).json({
      status: 'success',
      message: 'Image message sent',
      sentMessage: message,
    });
  } catch (error) {
    next(error);
  }
};
