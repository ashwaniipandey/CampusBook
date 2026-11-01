import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      trim: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Purchased book is required'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    amount: {
      type: Number,
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['placed', 'confirmed', 'completed', 'cancelled', 'ready_for_pickup'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['placed', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash_on_delivery', 'upi', 'card', 'campus_wallet', 'handover'],
        message: '{VALUE} is not a supported payment method',
      },
      default: 'handover',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    deliveryMethod: {
      type: String,
      enum: {
        values: ['campus_pickup', 'handover', 'shipping'],
        message: '{VALUE} is not a valid delivery method',
      },
      default: 'handover',
    },
    meetingLocation: {
      type: String,
      trim: true,
      default: '',
    },
    pickupLocation: {
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
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization hook
orderSchema.pre('save', function (next) {
  // Generate orderNumber if missing
  if (!this.orderNumber) {
    this.orderNumber = `CB-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  // Sync price and amount
  if (this.price !== undefined && this.amount === undefined) {
    this.amount = this.price;
  } else if (this.amount !== undefined && this.price === undefined) {
    this.price = this.amount;
  }

  // Sync status and orderStatus
  if (this.status && !this.orderStatus) {
    this.orderStatus = this.status;
  } else if (this.orderStatus && !this.status) {
    this.status = this.orderStatus;
  } else if (this.isModified('status')) {
    this.orderStatus = this.status;
  } else if (this.isModified('orderStatus')) {
    this.status = this.orderStatus;
  }

  // Sync meetingLocation and pickupLocation
  if (this.meetingLocation && !this.pickupLocation) {
    this.pickupLocation = this.meetingLocation;
  } else if (this.pickupLocation && !this.meetingLocation) {
    this.meetingLocation = this.pickupLocation;
  }

  next();
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ book: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ buyer: 1, book: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
