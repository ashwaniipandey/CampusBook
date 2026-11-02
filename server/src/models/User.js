import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Hidden by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'student',
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      default: null,
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: String,
      trim: true,
      default: '',
    },
    yearOfStudy: {
      type: Number,
      min: [1, 'Year of study must be at least 1'],
      max: [7, 'Year of study cannot exceed 7'],
      default: 1,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: undefined,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    collegeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: '',
    },
    verificationMethod: {
      type: String,
      enum: ['college_email', 'id_card', ''],
      default: '',
    },
    idCardImage: {
      type: String,
      default: '',
    },
    verificationNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'pending'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'active',
    },
    verificationOtp: {
      type: String,
      select: false,
    },
    verificationOtpExpires: {
      type: Date,
      select: false,
    },
    collegeVerificationOtp: {
      type: String,
      select: false,
    },
    collegeVerificationOtpExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (email is indexed via unique: true)
userSchema.index({ university: 1, role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isBlocked: 1, role: 1 });
userSchema.index({ verificationStatus: 1, role: 1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

userSchema.pre('save', function (next) {
  if (this.isModified('verificationStatus')) {
    this.isVerified = this.verificationStatus === 'verified';
  } else if (this.isModified('isVerified')) {
    this.verificationStatus = this.isVerified ? 'verified' : 'unverified';
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform to remove password and secret tokens when serialized
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.googleId;
  delete user.verificationOtp;
  delete user.verificationOtpExpires;
  delete user.collegeVerificationOtp;
  delete user.collegeVerificationOtpExpires;
  delete user.resetPasswordOtp;
  delete user.resetPasswordExpires;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
