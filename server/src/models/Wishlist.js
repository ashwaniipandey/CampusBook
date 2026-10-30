import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: a user can only add a book to their wishlist once
wishlistSchema.index({ user: 1, book: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });
wishlistSchema.index({ book: 1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;

