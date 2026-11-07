import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import University from '../models/University.js';
import { AppError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { sendOtpEmail } from '../utils/emailService.js';
import { createNotification } from '../utils/notifications.js';

const blockedEmailDomains = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'yahoo.ca',
  'outlook.com',
  'outlook.in',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'live.co.uk',
  'icloud.com',
  'protonmail.com',
  'aol.com',
]);

const getDomainCandidates = (domain) =>
  domain.split('.').map((_, index, parts) => parts.slice(index).join('.'));

const hasAllowedDomain = async (domain, userUniversity) => {
  if (blockedEmailDomains.has(domain)) return false;

  // If user has a selected university, check its domains
  if (userUniversity) {
    const uni = await University.findById(userUniversity._id || userUniversity);
    if (uni) {
      const uniDomains = [
        uni.domain,
        ...(Array.isArray(uni.emailDomains) ? uni.emailDomains : []),
      ]
        .filter(Boolean)
        .map((d) => d.toLowerCase());

      if (uniDomains.length > 0) {
        return uniDomains.some((d) => domain === d || domain.endsWith('.' + d));
      }
    }
  }

  // Fallback to checking any active university
  const university = await University.findOne({
    isActive: true,
    $or: [
      { domain: { $in: getDomainCandidates(domain) } },
      { emailDomains: { $in: getDomainCandidates(domain) } },
    ],
  }).select('_id');

  return Boolean(university) || /\.(edu|ac\.in|edu\.in)$/i.test(domain);
};

export const sendCollegeEmailOtp = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const domain = email.split('@')[1];

    if (blockedEmailDomains.has(domain)) {
      return next(new AppError('Personal email providers (Gmail, Yahoo, Outlook, etc.) are not accepted. Please use your official college email.', 400));
    }

    if (!(await hasAllowedDomain(domain, req.user.university))) {
      return next(new AppError('The email domain does not match an eligible college or your selected university.', 400));
    }
    if (req.user.isVerified || req.user.verificationStatus === 'verified') {
      return next(new AppError('Your student status is already verified.', 409));
    }

    const otp = String(randomInt(100000, 1000000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await sendOtpEmail({ to: email, otp, type: 'verification', userName: req.user.name });
    const user = await User.findById(req.user._id).select('+collegeVerificationOtp +collegeVerificationOtpExpires');
    user.collegeEmail = email;
    user.verificationMethod = 'college_email';
    user.verificationStatus = 'pending';
    user.verificationNote = '';
    user.collegeVerificationOtp = otp;
    user.collegeVerificationOtpExpires = expires;
    await user.save();

    res.status(200).json({ status: 'success', message: 'A verification code was sent to your college email.' });
  } catch (error) {
    next(error);
  }
};

export const verifyCollegeEmailOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+collegeVerificationOtp +collegeVerificationOtpExpires');
    if (
      !user.collegeEmail ||
      user.verificationMethod !== 'college_email' ||
      !user.collegeVerificationOtp ||
      !user.collegeVerificationOtpExpires ||
      user.collegeVerificationOtpExpires.getTime() < Date.now() ||
      user.collegeVerificationOtp !== req.body.otp
    ) {
      return next(new AppError('Invalid or expired college verification code.', 400));
    }
    user.verificationStatus = 'verified';
    user.verificationNote = '';
    user.collegeVerificationOtp = undefined;
    user.collegeVerificationOtpExpires = undefined;
    await user.save();
    res.status(200).json({
      status: 'success',
      message: 'Your student status is verified.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const submitIdCard = async (req, res, next) => {
  try {
    if (req.user.isVerified || req.user.verificationStatus === 'verified') {
      return next(new AppError('Your student status is already verified.', 409));
    }
    const image = await uploadToCloudinary(req.file.buffer, 'campusbook/verification', {
      disableFallback: true,
    });
    const user = await User.findById(req.user._id);
    user.idCardImage = image.url;
    user.verificationMethod = 'id_card';
    user.verificationStatus = 'pending';
    user.verificationNote = '';
    await user.save();
    res.status(200).json({
      status: 'success',
      message: 'Your ID card is submitted for review.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = (req, res) => {
  res.status(200).json({
    status: 'success',
    verification: {
      status: req.user.verificationStatus || (req.user.isVerified ? 'verified' : 'unverified'),
      method: req.user.verificationMethod,
      collegeEmail: req.user.collegeEmail,
      idCardImage: req.user.idCardImage,
      note: req.user.verificationNote,
      isVerified: req.user.verificationStatus === 'verified',
    },
  });
};

export const listPendingVerifications = async (req, res, next) => {
  try {
    const users = await User.find({
      role: 'student',
      verificationStatus: 'pending',
      verificationMethod: 'id_card',
    })
      .select('name email university verificationStatus verificationMethod collegeEmail idCardImage createdAt')
      .populate('university', 'name code')
      .sort({ updatedAt: 1 })
      .limit(100)
      .lean();
    res.status(200).json({ status: 'success', results: users.length, users });
  } catch (error) {
    next(error);
  }
};

const setIdCardDecision = async (req, res, next, approved) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('A valid user ID is required.', 400));
    }
    if (typeof req.body.reason !== 'undefined' && (typeof req.body.reason !== 'string' || req.body.reason.length > 500)) {
      return next(new AppError('reason must be a string of 500 characters or fewer.', 400));
    }
    const user = await User.findOne({
      _id: id,
      role: 'student',
      verificationStatus: 'pending',
      verificationMethod: 'id_card',
    });
    if (!user) return next(new AppError('Pending ID card verification not found.', 404));

    user.verificationStatus = approved ? 'verified' : 'rejected';
    user.verificationNote = approved ? '' : (req.body.reason || 'Please submit a clearer student ID card.');
    await user.save();
    await createNotification({
      user: user._id,
      type: 'system',
      title: approved ? 'Student status verified' : 'Student verification needs attention',
      message: approved
        ? 'Your student ID was approved. Verified student features are now available.'
        : `Your student ID was not approved. ${user.verificationNote}`,
      data: { verificationStatus: user.verificationStatus },
      io: req.app.get('io'),
    });
    res.status(200).json({
      status: 'success',
      message: approved ? 'Student verification approved.' : 'Student verification rejected.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const approveIdCard = (req, res, next) => setIdCardDecision(req, res, next, true);
export const rejectIdCard = (req, res, next) => setIdCardDecision(req, res, next, false);
