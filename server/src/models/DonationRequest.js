import mongoose from 'mongoose';

const donationRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester student is required'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Book donor is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Donated book is required'],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
      default: '',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      default: '',
    },
    studentProof: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      required: [true, 'Donation request status is required'],
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    handoverLocation: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
donationRequestSchema.index({ requester: 1, status: 1 });
donationRequestSchema.index({ donor: 1, status: 1 });
donationRequestSchema.index({ book: 1 });
donationRequestSchema.index({ createdAt: -1 });

const DonationRequest = mongoose.model('DonationRequest', donationRequestSchema);

export default DonationRequest;
