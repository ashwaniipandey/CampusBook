import mongoose from 'mongoose';
import Book from '../models/Book.js';
import DonationRequest from '../models/DonationRequest.js';
import Notification from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';
import { isApprovedBook } from '../utils/bookRequestHelpers.js';

const populateDonation = (query) =>
  query
    .populate({
      path: 'book',
      populate: [
        { path: 'category', select: 'name slug icon' },
        { path: 'university', select: 'name code domain city state' },
      ],
    })
    .populate('requester', 'name email avatar isVerified')
    .populate('donor', 'name email avatar isVerified');

const notificationContent = (status, sender, donationRequest) => {
  const contents = {
    pending: {
      title: 'New Donation Request',
      message: `${sender.name} requested "${donationRequest.book.title}".`,
    },
    accepted: {
      title: 'Donation Request Accepted',
      message: `${sender.name} accepted your request for "${donationRequest.book.title}".`,
    },
    rejected: {
      title: 'Donation Request Rejected',
      message: `${sender.name} rejected your request for "${donationRequest.book.title}".`,
    },
    cancelled: {
      title: 'Donation Request Cancelled',
      message: `${sender.name} cancelled the request for "${donationRequest.book.title}".`,
    },
    completed: {
      title: 'Donation Completed',
      message: `${sender.name} marked the donation of "${donationRequest.book.title}" as completed.`,
    },
  };
  return contents[status];
};

const notifyParty = ({ recipient, sender, status, donationRequest }) => {
  const { title, message } = notificationContent(status, sender, donationRequest);
  return Notification.create({
    recipient,
    sender: sender._id,
    type: 'donation_request',
    title,
    message,
    link: '/donations',
    data: {
      donationRequestId: donationRequest._id,
      bookId: donationRequest.book._id,
      status,
    },
  });
};

export const createDonationRequest = async (req, res, next) => {
  try {
    const { bookId, message = '' } = req.body;
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return next(new AppError('A valid bookId is required', 400));
    }
    if (typeof message !== 'string' || message.length > 1000) {
      return next(new AppError('Message must be a string of 1000 characters or fewer', 400));
    }

    const book = await Book.findById(bookId);
    if (!book) return next(new AppError('Book listing not found', 404));
    if (book.listingType !== 'donate' || !isApprovedBook(book)) {
      return next(new AppError('The requested book must be an approved donation listing', 400));
    }
    if (book.seller.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot request your own donated book', 400));
    }

    const existingActiveRequest = await DonationRequest.findOne({
      requester: req.user._id,
      book: book._id,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existingActiveRequest) {
      return next(new AppError('You already have an active request for this book', 400));
    }

    const donationRequest = await DonationRequest.create({
      requester: req.user._id,
      donor: book.seller,
      book: book._id,
      message: message.trim(),
      reason: message.trim(),
    });

    await notifyParty({
      recipient: book.seller,
      sender: req.user,
      status: 'pending',
      donationRequest: { ...donationRequest.toObject(), book },
    });

    const populatedDonation = await populateDonation(
      DonationRequest.findById(donationRequest._id)
    );
    res.status(201).json({
      status: 'success',
      message: 'Donation request created successfully',
      donationRequest: populatedDonation,
    });
  } catch (error) {
    next(error);
  }
};

export const getDonationRequests = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (role && !['received', 'sent'].includes(role)) {
      return next(new AppError('Role must be received or sent', 400));
    }

    const filter = role === 'received'
      ? { donor: req.user._id }
      : role === 'sent'
        ? { requester: req.user._id }
        : { $or: [{ requester: req.user._id }, { donor: req.user._id }] };

    const donationRequests = await populateDonation(
      DonationRequest.find(filter).sort({ createdAt: -1 })
    );
    res.status(200).json({
      status: 'success',
      results: donationRequests.length,
      donationRequests,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDonationRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    const validStatuses = ['accepted', 'rejected', 'cancelled', 'completed'];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid donation request ID format', 400));
    }
    if (!validStatuses.includes(newStatus)) {
      return next(new AppError('Status must be accepted, rejected, cancelled, or completed', 400));
    }

    const donationRequest = await DonationRequest.findById(id)
      .populate('requester', 'name')
      .populate('donor', 'name')
      .populate('book', 'title');
    if (!donationRequest) {
      return next(new AppError('Donation request not found', 404));
    }

    const userId = req.user._id.toString();
    const isRequester = donationRequest.requester._id.toString() === userId;
    const isDonor = donationRequest.donor._id.toString() === userId;
    if (!isRequester && !isDonor) {
      return next(new AppError('You are not a participant in this donation request', 403));
    }

    const currentStatus = donationRequest.status;
    if (
      currentStatus === 'pending' &&
      isDonor &&
      ['accepted', 'rejected'].includes(newStatus)
    ) {
      donationRequest.status = newStatus;
      await donationRequest.save();

      if (newStatus === 'accepted') {
        const otherPendingRequests = await DonationRequest.find({
          _id: { $ne: donationRequest._id },
          book: donationRequest.book._id,
          status: 'pending',
        })
          .populate('requester', 'name')
          .populate('donor', 'name')
          .populate('book', 'title');

        for (const otherRequest of otherPendingRequests) {
          otherRequest.status = 'rejected';
          await otherRequest.save();
          await notifyParty({
            recipient: otherRequest.requester._id,
            sender: req.user,
            status: 'rejected',
            donationRequest: otherRequest,
          });
        }
      }
    } else if (currentStatus === 'pending' && isRequester && newStatus === 'cancelled') {
      donationRequest.status = newStatus;
      await donationRequest.save();
    } else if (currentStatus === 'accepted' && newStatus === 'completed') {
      const book = await Book.findById(donationRequest.book._id);
      if (!book) return next(new AppError('The donated book no longer exists', 400));
      book.status = 'sold';
      await book.save();
      donationRequest.status = newStatus;
      await donationRequest.save();
    } else {
      return next(
        new AppError(
          `Cannot change a donation request from '${currentStatus}' to '${newStatus}'`,
          400
        )
      );
    }

    const notifyRecipient = isRequester
      ? donationRequest.donor._id
      : donationRequest.requester._id;
    await notifyParty({
      recipient: notifyRecipient,
      sender: req.user,
      status: newStatus,
      donationRequest,
    });

    const populatedDonation = await populateDonation(
      DonationRequest.findById(donationRequest._id)
    );
    res.status(200).json({
      status: 'success',
      message: `Donation request ${newStatus}`,
      donationRequest: populatedDonation,
    });
  } catch (error) {
    next(error);
  }
};
