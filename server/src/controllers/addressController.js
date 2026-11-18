import Address from '../models/Address.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Get all saved addresses for the authenticated user
 * GET /api/addresses
 * Access: Private
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      status: 'success',
      results: addresses.length,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new address
 * POST /api/addresses
 * Access: Private
 */
export const createAddress = async (req, res, next) => {
  try {
    const existingCount = await Address.countDocuments({ user: req.user._id });

    let isDefault = Boolean(req.body.isDefault);
    // If it's the user's first address, make it default automatically
    if (existingCount === 0) {
      isDefault = true;
    }

    // If new address is default, unset default on other addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      ...req.body,
      user: req.user._id,
      isDefault,
    });

    res.status(201).json({
      status: 'success',
      message: 'Address added successfully',
      address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing address
 * PUT /api/addresses/:id
 * Access: Private
 */
export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );
    }

    const allowedFields = [
      'fullName',
      'phone',
      'pincode',
      'houseNo',
      'area',
      'landmark',
      'city',
      'state',
      'addressType',
      'isDefault',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });

    await address.save();

    res.status(200).json({
      status: 'success',
      message: 'Address updated successfully',
      address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an address
 * DELETE /api/addresses/:id
 * Access: Private
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // If the deleted address was default, promote the newest remaining address to default
    if (wasDefault) {
      const remaining = await Address.findOne({ user: req.user._id }).sort({
        createdAt: -1,
      });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
