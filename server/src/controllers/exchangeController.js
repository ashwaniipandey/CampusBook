import mongoose from 'mongoose';
import Book from '../models/Book.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';
import { isApprovedBook } from '../utils/bookRequestHelpers.js';

const populateExchange = (query) =>
  query
    .populate({
      path: 'requestedBook',
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'university', select: 'name code domain city state' },
      ],
    })
    .populate({
      path: 'offeredBook',
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'university', select: 'name code domain city state' },
      ],
    })
    .populate('requester', 'name email avatar isVerified')
    .populate('bookOwner', 'name email avatar isVerified');

const notifyParty = ({ recipient, sender, status, exchangeRequest }) => {
  const statusMessages = {
    pending: {
      title: 'New Exchange Request',
      message: `${sender.name} requested to exchange "${exchangeRequest.requestedBook.title}" for "${exchangeRequest.offeredBook.title}".`,
    },
    accepted: {
      title: 'Exchange Request Accepted',
      message: `${sender.name} accepted your exchange request for "${exchangeRequest.requestedBook.title}".`,
    },
    rejected: {
      title: 'Exchange Request Rejected',
      message: `${sender.name} rejected your exchange request for "${exchangeRequest.requestedBook.title}".`,
    },
    cancelled: {
      title: 'Exchange Request Cancelled',
      message: `${sender.name} cancelled the exchange request for "${exchangeRequest.requestedBook.title}".`,
    },
    completed: {
      title: 'Exchange Completed',
      message: `${sender.name} marked the exchange for "${exchangeRequest.requestedBook.title}" as completed.`,
    },
  };
  const notification = statusMessages[status];

  return Notification.create({
    recipient,
    sender: sender._id,
    type: 'exchange_request',
    title: notification.title,
    message: notification.message,
    link: '/exchanges',
    data: {
      exchangeRequestId: exchangeRequest._id,
      requestedBookId: exchangeRequest.requestedBook._id,
      offeredBookId: exchangeRequest.offeredBook._id,
      status,
    },
  });
};

export const createExchangeRequest = async (req, res, next) => {
  try {
    const { requestedBookId, offeredBookId, message = '' } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(requestedBookId) ||
      !mongoose.Types.ObjectId.isValid(offeredBookId)
    ) {
      return next(new AppError('Valid requestedBookId and offeredBookId are required', 400));
    }
    if (typeof message !== 'string' || message.length > 1000) {
      return next(new AppError('Message must be a string of 1000 characters or fewer', 400));
    }
    const [requestedBook, offeredBook] = await Promise.all([
      Book.findById(requestedBookId),
      Book.findById(offeredBookId),
    ]);

    if (!requestedBook || !offeredBook) {
      return next(new AppError('Requested or offered book not found', 404));
    }
    if (requestedBook._id.equals(offeredBook._id)) {
      return next(new AppError('You must offer a different book', 400));
    }
    if (!isApprovedBook(requestedBook) || requestedBook.listingType !== 'exchange') {
      return next(new AppError('The requested book must be an approved exchange listing', 400));
    }
    if (requestedBook.seller.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot request an exchange for your own book', 400));
    }
    if (offeredBook.seller.toString() !== req.user._id.toString()) {
      return next(new AppError('The offered book must belong to you', 400));
    }
    if (!isApprovedBook(offeredBook)) {
      return next(new AppError('The offered book must be approved and not sold', 400));
    }

    const existingActiveRequest = await ExchangeRequest.findOne({
      status: { $in: ['pending', 'accepted'] },
      $or: [
        { requestedBook: requestedBook._id, offeredBook: offeredBook._id },
        { requestedBook: offeredBook._id, offeredBook: requestedBook._id },
      ],
    });
    if (existingActiveRequest) {
      return next(new AppError('An active exchange request already exists for this book pair', 400));
    }

    const exchangeRequest = await ExchangeRequest.create({
      requester: req.user._id,
      bookOwner: requestedBook.seller,
      requestedBook: requestedBook._id,
      offeredBook: offeredBook._id,
      message: message.trim(),
    });

    await notifyParty({
      recipient: requestedBook.seller,
      sender: req.user,
      status: 'pending',
      exchangeRequest: {
        ...exchangeRequest.toObject(),
        requestedBook,
        offeredBook,
      },
    });

    const populatedExchange = await populateExchange(
      ExchangeRequest.findById(exchangeRequest._id)
    );
    res.status(201).json({
      status: 'success',
      message: 'Exchange request created successfully',
      exchangeRequest: populatedExchange,
    });
  } catch (error) {
    next(error);
  }
};

export const getExchangeRequests = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (role && !['received', 'sent'].includes(role)) {
      return next(new AppError('Role must be received or sent', 400));
    }

    const filter = role === 'received'
      ? { bookOwner: req.user._id }
      : role === 'sent'
        ? { requester: req.user._id }
        : { $or: [{ requester: req.user._id }, { bookOwner: req.user._id }] };

    const exchangeRequests = await populateExchange(
      ExchangeRequest.find(filter).sort({ createdAt: -1 })
    );

    res.status(200).json({
      status: 'success',
      results: exchangeRequests.length,
      exchangeRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const updateExchangeRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const validStatuses = ['accepted', 'rejected', 'cancelled', 'completed'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid exchange request ID format', 400));
    }
    if (!validStatuses.includes(newStatus)) {
      return next(new AppError('Status must be accepted, rejected, cancelled, or completed', 400));
    }

    const exchangeRequest = await ExchangeRequest.findById(id)
      .populate('requester', 'name')
      .populate('bookOwner', 'name')
      .populate('requestedBook', 'title')
      .populate('offeredBook', 'title');
    if (!exchangeRequest) {
      return next(new AppError('Exchange request not found', 404));
    }

    const userId = req.user._id.toString();
    const isRequester = exchangeRequest.requester._id.toString() === userId;
    const isOwner = exchangeRequest.bookOwner._id.toString() === userId;
    if (!isRequester && !isOwner) {
      return next(new AppError('You are not a participant in this exchange request', 403));
    }

    const currentStatus = exchangeRequest.status;
    if (
      currentStatus === 'pending' &&
      isOwner &&
      ['accepted', 'rejected'].includes(newStatus)
    ) {
      exchangeRequest.status = newStatus;
    } else if (currentStatus === 'pending' && isRequester && newStatus === 'cancelled') {
      exchangeRequest.status = newStatus;
    } else if (currentStatus === 'accepted' && newStatus === 'completed') {
      const [requestedBook, offeredBook] = await Promise.all([
        Book.findById(exchangeRequest.requestedBook._id),
        Book.findById(exchangeRequest.offeredBook._id),
      ]);
      if (!requestedBook || !offeredBook) {
        return next(new AppError('One or both books in this exchange no longer exist', 400));
      }

      requestedBook.status = 'sold';
      offeredBook.status = 'sold';
      await requestedBook.save();
      await offeredBook.save();
      exchangeRequest.status = newStatus;
    } else {
      return next(
        new AppError(
          `Cannot change an exchange request from '${currentStatus}' to '${newStatus}'`,
          400
        )
      );
    }

    await exchangeRequest.save();
    const notifyRecipient = isRequester
      ? exchangeRequest.bookOwner._id
      : exchangeRequest.requester._id;
    await notifyParty({
      recipient: notifyRecipient,
      sender: req.user,
      status: newStatus,
      exchangeRequest,
    });

    const populatedExchange = await populateExchange(
      ExchangeRequest.findById(exchangeRequest._id)
    );
    res.status(200).json({
      status: 'success',
      message: `Exchange request ${newStatus}`,
      exchangeRequest: populatedExchange,
    });
  } catch (error) {
    next(error);
  }
};
