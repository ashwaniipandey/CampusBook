import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      minlength: [2, 'Author must be at least 2 characters long'],
      maxlength: [120, 'Author cannot exceed 120 characters'],
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    edition: {
      type: String,
      trim: true,
      default: '1st Edition',
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publicationYear: {
      type: Number,
      min: [1800, 'Year must be valid'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the distant future'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subject: {
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
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'University',
      required: [true, 'University campus is required'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller/lister user is required'],
    },
    condition: {
      type: String,
      required: [true, 'Book condition is required'],
      enum: {
        values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
        message: '{VALUE} is not a valid condition',
      },
      default: 'Good',
    },
    listingType: {
      type: String,
      required: [true, 'Listing type is required'],
      enum: {
        values: ['sell', 'sale', 'exchange', 'donate', 'donation'],
        message: '{VALUE} is not a valid listing type',
      },
      default: 'sell',
    },
    sellingPrice: {
      type: Number,
      min: [0, 'Selling price cannot be negative'],
      default: 0,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (val) {
          if (['sale', 'sell'].includes(this.listingType)) {
            return typeof val === 'number' && val >= 0;
          }
          return true;
        },
        message: 'Price is required for sale listings',
      },
      default: 0,
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Book description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2500, 'Description cannot exceed 2500 characters'],
    },
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    exchangePreferences: {
      type: String,
      trim: true,
      maxlength: [500, 'Exchange preference notes cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      required: [true, 'Listing status is required'],
      enum: {
        values: [
          'pending',
          'available',
          'approved',
          'reserved',
          'sold',
          'exchanged',
          'donated',
          'rejected',
        ],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to synchronize price and sellingPrice, set isApproved
bookSchema.pre('save', function (next) {
  // Sync price and sellingPrice
  if (this.sellingPrice !== undefined && (!this.price || this.price === 0)) {
    this.price = this.sellingPrice;
  } else if (this.price !== undefined && (!this.sellingPrice || this.sellingPrice === 0)) {
    this.sellingPrice = this.price;
  }

  // If donation, price is 0
  if (['donate', 'donation'].includes(this.listingType)) {
    this.price = 0;
    this.sellingPrice = 0;
  }

  // Update isApproved flag based on status
  if (this.status === 'approved' || this.status === 'available') {
    this.isApproved = true;
  } else if (this.status === 'pending' || this.status === 'rejected') {
    this.isApproved = false;
  }

  next();
});

// Indexes
bookSchema.index({ title: 'text', author: 'text', description: 'text', subject: 'text' });
bookSchema.index({ university: 1, status: 1 });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ listingType: 1, status: 1 });
bookSchema.index({ seller: 1, status: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ sellingPrice: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ status: 1, createdAt: -1 });
bookSchema.index({ status: 1, sellingPrice: 1 });
bookSchema.index({ status: 1, price: 1 });
bookSchema.index({ status: 1, viewsCount: -1 });
bookSchema.index({ status: 1, condition: 1 });
bookSchema.index({ status: 1, listingType: 1 });
bookSchema.index({ status: 1, category: 1 });
bookSchema.index({ status: 1, university: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;
