import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[1-9]\d{5}$/, 'Pincode must be exactly 6 digits and cannot start with 0'],
    },
    houseNo: {
      type: String,
      required: [true, 'Flat, house no., or building is required'],
      trim: true,
      maxlength: [150, 'House details cannot exceed 150 characters'],
    },
    area: {
      type: String,
      required: [true, 'Area, street, or sector is required'],
      trim: true,
      maxlength: [200, 'Area details cannot exceed 200 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Landmark cannot exceed 150 characters'],
    },
    city: {
      type: String,
      required: [true, 'City or district is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    addressType: {
      type: String,
      enum: {
        values: ['Home', 'Work', 'Campus'],
        message: '{VALUE} is not a valid address type',
      },
      default: 'Home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

addressSchema.index({ user: 1, isDefault: -1 });

const Address = mongoose.model('Address', addressSchema);

export default Address;
