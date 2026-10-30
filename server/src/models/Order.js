import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
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
    amount: {
      type: Number,
      required: [true, 'Order amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash_on_delivery', 'upi', 'card', 'campus_wallet', 'handover'],
        message: '{VALUE} is not a supported payment method',
      },
      default: 'handover',
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    deliveryMethod: {
      type: String,
      required: [true, 'Delivery method is required'],
      enum: {
        values: ['campus_pickup', 'handover', 'shipping'],
        message: '{VALUE} is not a valid delivery method',
      },
      default: 'handover',
    },
    pickupLocation: {
      type: String,
      trim: true,
      default: '',
    },
    orderStatus: {
      type: String,
      required: [true, 'Order status is required'],
      enum: {
        values: ['placed', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
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

// Indexes (orderNumber is indexed via unique: true)
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ book: 1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
