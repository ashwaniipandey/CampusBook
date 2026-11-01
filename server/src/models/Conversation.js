import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    participantPair: {
      type: String,
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    relatedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
    },
    lastMessage: {
      type: String,
      trim: true,
      default: '',
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ relatedBook: 1 });
conversationSchema.index(
  { participantPair: 1, book: 1 },
  {
    unique: true,
    partialFilterExpression: { participantPair: { $type: 'string' } },
  }
);

conversationSchema.pre('validate', function (next) {
  if (this.participants?.length !== 2) {
    this.invalidate('participants', 'A conversation must have exactly two participants');
  }
  if (this.participants?.length === 2) {
    this.participantPair = this.participants
      .map((participant) => participant.toString())
      .sort()
      .join(':');
  }
  if (this.book) this.relatedBook = this.book;
  else if (this.relatedBook) this.book = this.relatedBook;
  if (this.lastMessage) this.lastMessageText = this.lastMessage;
  else if (this.lastMessageText) this.lastMessage = this.lastMessageText;
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
