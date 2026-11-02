import mongoose from 'mongoose';

const userBookViewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userBookViewSchema.index({ user: 1, book: 1 }, { unique: true });
userBookViewSchema.index({ user: 1, lastViewedAt: -1 });

const UserBookView = mongoose.model('UserBookView', userBookViewSchema);

export default UserBookView;
