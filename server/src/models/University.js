import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'University name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'University name must be at least 2 characters'],
      maxlength: [150, 'University name cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'University short code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'University code cannot exceed 20 characters'],
    },
    domain: {
      type: String,
      required: [true, 'University email domain is required'],
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'United States',
    },
    campuses: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
universitySchema.index({ domain: 1 });
universitySchema.index({ name: 'text' });

const University = mongoose.model('University', universitySchema);

export default University;
