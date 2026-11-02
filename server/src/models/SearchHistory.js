import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    searches: {
      type: [
        {
          term: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
          },
          searchedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
