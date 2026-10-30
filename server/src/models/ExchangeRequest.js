import mongoose from 'mongoose';

const exchangeRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },
    bookOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Book owner is required'],
    },
    requestedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Requested book is required'],
    },
    offeredBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Offered book for exchange is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid exchange request status',
      },
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Response note cannot exceed 1000 characters'],
      default: '',
    },
    meetingLocation: {
      type: String,
      trim: true,
      default: '',
    },
    meetingTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
exchangeRequestSchema.index({ requester: 1, status: 1 });
exchangeRequestSchema.index({ bookOwner: 1, status: 1 });
exchangeRequestSchema.index({ requestedBook: 1 });
exchangeRequestSchema.index({ offeredBook: 1 });
exchangeRequestSchema.index({ createdAt: -1 });

const ExchangeRequest = mongoose.model('ExchangeRequest', exchangeRequestSchema);

export default ExchangeRequest;

