import mongoose from 'mongoose';
import User from '../models/User.js';
import University from '../models/University.js';
import { AppError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const publicUserFields =
  '_id name email role university studentId department course semester yearOfStudy phone avatar bio rating totalRatings isVerified lastSeen status createdAt updatedAt';

const getSafeUser = (userId) =>
  User.findById(userId).select(publicUserFields).populate('university');

export const updateCurrentUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.university) {
      if (!mongoose.Types.ObjectId.isValid(updates.university)) {
        return next(new AppError('Invalid university ID', 400));
      }
      const university = await University.findById(updates.university).select('_id');
      if (!university) return next(new AppError('University not found', 404));
      updates.university = university._id;
    }

    await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
      new: true,
      runValidators: true,
      context: 'query',
    });
    const user = await getSafeUser(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please attach an image in the image field', 400));
    }
    const uploadedImage = await uploadToCloudinary(req.file.buffer, 'campusbook/avatars');
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: uploadedImage.url } },
      { runValidators: true }
    );
    const user = await getSafeUser(req.user._id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      message: 'Profile photo updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};
