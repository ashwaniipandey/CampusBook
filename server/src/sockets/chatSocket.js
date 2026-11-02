import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import { saveConversationMessage } from '../services/conversationMessageService.js';
import { createNotification } from '../utils/notifications.js';
import { getJwtSecret } from '../config/jwt.js';
import { stripHtmlFromText } from '../middlewares/requestSecurity.js';

const personalRoom = (userId) => `user:${userId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;
const MESSAGE_RATE_WINDOW_MS = 15 * 60 * 1000;
const MESSAGE_RATE_LIMIT = 30;
const messageRateWindows = new Map();
const messageRateCleanup = setInterval(() => {
  const now = Date.now();
  for (const [userId, window] of messageRateWindows) {
    if (now - window.startedAt >= MESSAGE_RATE_WINDOW_MS) messageRateWindows.delete(userId);
  }
}, MESSAGE_RATE_WINDOW_MS);
messageRateCleanup.unref();

const enforceSocketMessageLimit = (userId) => {
  const now = Date.now();
  const window = messageRateWindows.get(userId);
  if (!window || now - window.startedAt >= MESSAGE_RATE_WINDOW_MS) {
    messageRateWindows.set(userId, { startedAt: now, count: 1 });
    return;
  }
  if (window.count >= MESSAGE_RATE_LIMIT) {
    throw new AppError('Too many messages sent. Please wait before sending more.', 429);
  }
  window.count += 1;
};

const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return null;
  }
};

const sendEventError = (socket, eventName, error, acknowledge) => {
  const message = error instanceof Error ? error.message : 'Unable to process chat event';
  const response = { status: 'error', event: eventName, message };
  if (typeof acknowledge === 'function') acknowledge(response);
  else socket.emit('chat_error', response);
};

const getConversationForParticipant = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError('Invalid conversation ID format', 400);
  }
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (!conversation.participants.some((participant) => participant.toString() === userId)) {
    throw new AppError('You are not a participant in this conversation', 403);
  }
  return conversation;
};

export const configureChatSockets = (io) => {
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, 'token');
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id).select('_id name status isBlocked');
      if (!user || user.status === 'suspended' || user.isBlocked) {
        return next(new Error('Authenticated user is unavailable'));
      }

      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
      };
      next();
    } catch (error) {
      next(new Error(error.name === 'TokenExpiredError'
        ? 'Authentication token has expired'
        : 'Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    const userRoom = personalRoom(userId);
    const userSockets = onlineUsers.get(userId) || new Set();
    const wasOffline = userSockets.size === 0;
    userSockets.add(socket.id);
    onlineUsers.set(userId, userSockets);
    socket.join(userRoom);

    if (wasOffline) {
      io.except(userRoom).emit('presence_update', { userId, online: true });
    }

    socket.on('get_online_users', (acknowledge) => {
      const response = { status: 'success', userIds: Array.from(onlineUsers.keys()) };
      if (typeof acknowledge === 'function') acknowledge(response);
      else socket.emit('online_users', response.userIds);
    });

    socket.on('join_conversation', async (conversationId, acknowledge) => {
      try {
        const conversation = await getConversationForParticipant(conversationId, userId);
        const room = conversationRoom(conversation._id.toString());
        await socket.join(room);
        socket.data.conversationRooms ??= new Set();
        socket.data.conversationRooms.add(room);
        if (typeof acknowledge === 'function') {
          acknowledge({ status: 'success', conversationId: conversation._id });
        }
      } catch (error) {
        sendEventError(socket, 'join_conversation', error, acknowledge);
      }
    });

    socket.on('leave_conversation', (conversationId, acknowledge) => {
      if (typeof conversationId !== 'string' || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return sendEventError(
          socket,
          'leave_conversation',
          new AppError('Invalid conversation ID format', 400),
          acknowledge
        );
      }
      const room = conversationRoom(conversationId);
      socket.leave(room);
      socket.data.conversationRooms?.delete(room);
      if (typeof acknowledge === 'function') {
        acknowledge({ status: 'success', conversationId });
      }
    });

    socket.on('send_message', async (payload = {}, acknowledge) => {
      try {
        enforceSocketMessageLimit(userId);
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new AppError('Message payload must be an object.', 400);
        }
        const { conversationId, text: rawText } = payload;
        if (typeof rawText !== 'string') {
          throw new AppError('Message text is required', 400);
        }
        const text = stripHtmlFromText(rawText);
        if (!text) {
          throw new AppError('Message text is required', 400);
        }
        if (text.length > 2000) {
          throw new AppError('Message cannot exceed 2000 characters', 400);
        }

        const { message, recipientId } = await saveConversationMessage({
          conversationId,
          senderId: userId,
          text,
        });
        const messageData = message.toObject();
        const response = { status: 'success', message: messageData };

        io.to(personalRoom(userId))
          .to(personalRoom(recipientId))
          .emit('receive_message', messageData);

        if (typeof acknowledge === 'function') acknowledge(response);
        else socket.emit('message_sent', response);

        if (onlineUsers.has(recipientId)) {
          io.to(personalRoom(recipientId)).emit('new_message_notification', {
            conversationId,
            messageId: message._id,
            senderId: userId,
            senderName: socket.data.user.name,
            text: message.text || 'Image',
            createdAt: message.createdAt,
          });
        }
        try {
          await createNotification({
            user: recipientId,
            sender: userId,
            type: 'message',
            title: `New message from ${socket.data.user.name}`,
            message: message.text || 'You received an image.',
            ids: { conversationId, messageId: message._id },
            data: { senderId: userId },
            io,
          });
        } catch (error) {
          console.error(`Unable to create chat notification: ${error.message}`);
          socket.emit('chat_error', {
            event: 'notification',
            message: 'Your message was sent, but its notification could not be saved',
          });
        }
      } catch (error) {
        sendEventError(socket, 'send_message', error, acknowledge);
      }
    });

    socket.on('typing', async (payload = {}, acknowledge) => {
      try {
        const { conversationId, isTyping } = payload;
        if (typeof isTyping !== 'boolean') {
          throw new AppError('isTyping must be a boolean', 400);
        }
        const conversation = await getConversationForParticipant(conversationId, userId);
        const otherParticipant = conversation.participants.find(
          (participant) => participant.toString() !== userId
        );
        io.to(personalRoom(otherParticipant.toString())).emit('typing', {
          conversationId: conversation._id,
          userId,
          isTyping,
        });
        if (typeof acknowledge === 'function') {
          acknowledge({ status: 'success' });
        }
      } catch (error) {
        sendEventError(socket, 'typing', error, acknowledge);
      }
    });

    socket.on('mark_read', async (payload = {}, acknowledge) => {
      try {
        const { conversationId } = payload;
        const conversation = await getConversationForParticipant(conversationId, userId);
        const otherParticipant = conversation.participants.find(
          (participant) => participant.toString() !== userId
        );
        const unreadMessages = await Message.find({
          conversation: conversation._id,
          sender: otherParticipant,
          readAt: null,
        }).select('_id');
        const readAt = new Date();
        await Message.updateMany(
          {
            conversation: conversation._id,
            sender: otherParticipant,
            readAt: null,
          },
          {
            $set: { isRead: true, readAt },
            $addToSet: { readBy: userId },
          }
        );
        await Conversation.updateOne(
          { _id: conversation._id },
          { $set: { [`unreadCounts.${userId}`]: 0 } }
        );

        const receipt = {
          conversationId: conversation._id,
          readerId: userId,
          messageIds: unreadMessages.map((message) => message._id),
          readAt,
        };
        io.to(personalRoom(otherParticipant.toString())).emit('messages_read', receipt);
        if (typeof acknowledge === 'function') {
          acknowledge({ status: 'success', ...receipt });
        }
      } catch (error) {
        sendEventError(socket, 'mark_read', error, acknowledge);
      }
    });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size > 0) return;

      onlineUsers.delete(userId);
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (onlineUsers.has(userId)) return;

      try {
        const lastSeen = new Date();
        await User.updateOne({ _id: userId }, { $set: { lastSeen } });
        io.except(userRoom).emit('presence_update', {
          userId,
          online: false,
          lastSeen,
        });
      } catch (error) {
        console.error(`Unable to update lastSeen for user ${userId}: ${error.message}`);
        socket.emit('chat_error', {
          event: 'disconnect',
          message: 'Unable to update your last-seen time',
        });
      }
    });
  });

  io.onlineUsers = onlineUsers;
  return onlineUsers;
};
