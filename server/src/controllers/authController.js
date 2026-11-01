import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import University from '../models/University.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendOtpEmail } from '../utils/emailService.js';

/**
 * Generate JWT and send response with httpOnly cookie
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const jwtSecret = process.env.JWT_SECRET || 'campusbook_jwt_secret_dev_key_2026_xyz';
  const token = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    user,
  });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      universityId,
      department,
      yearOfStudy,
      studentId,
      phone,
    } = req.body;

    // 1. Validation
    if (!name || !email || !password || !universityId) {
      return next(
        new AppError('Please provide name, email, password, and university', 400)
      );
    }

    if (password.length < 6) {
      return next(
        new AppError('Password must be at least 6 characters long', 400)
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(
        new AppError('An account with this email address already exists', 409)
      );
    }

    // 3. Find and validate university
    const university = await University.findById(universityId);
    if (!university) {
      return next(new AppError('Selected university does not exist', 404));
    }

    // Verify email belongs to the selected university domain
    const emailDomain = normalizedEmail.split('@')[1] || '';
    const expectedDomain = university.domain ? university.domain.toLowerCase() : '';
    const isDomainMatch =
      expectedDomain &&
      (emailDomain === expectedDomain || emailDomain.endsWith('.' + expectedDomain));

    if (!isDomainMatch) {
      return next(
        new AppError(
          `Please use your official university email ending in @${university.domain} to register for ${university.name}`,
          400
        )
      );
    }

    // 4. Generate 6-digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 5. Create user (isVerified stays false until OTP verification)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      university: university._id,
      department: department ? department.trim() : '',
      yearOfStudy: yearOfStudy ? Number(yearOfStudy) : 1,
      studentId: studentId ? studentId.trim() : '',
      phone: phone ? phone.trim() : '',
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
    });

    // Populate university reference for response
    await user.populate('university');

    // 6. Log/send verification OTP
    await sendOtpEmail({
      to: user.email,
      otp,
      type: 'verification',
      userName: user.name,
    });

    sendTokenResponse(
      user,
      201,
      res,
      'Registration successful. Please verify the OTP sent to your email.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Student Email via OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const userEmail = email || (req.user && req.user.email);
    if (!userEmail || !otp) {
      return next(new AppError('Please provide your email and OTP code', 400));
    }

    // Find user with secret OTP fields
    const user = await User.findOne({
      email: userEmail.toLowerCase().trim(),
    })
      .select('+verificationOtp +verificationOtpExpires')
      .populate('university');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Your account is already verified as a student!',
        user,
      });
    }

    if (!user.verificationOtp || !user.verificationOtpExpires) {
      return next(
        new AppError('No verification code found. Please request a new one.', 400)
      );
    }

    if (Date.now() > user.verificationOtpExpires.getTime()) {
      return next(
        new AppError('Verification code has expired. Please request a new code.', 400)
      );
    }

    if (user.verificationOtp !== otp.trim()) {
      return next(new AppError('Invalid verification code. Please check and try again.', 400));
    }

    // Mark student as verified
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully! You have unlocked the Verified Student badge.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Verification OTP
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userEmail = email || (req.user && req.user.email);

    if (!userEmail) {
      return next(new AppError('Email address is required', 400));
    }

    const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!user) {
      return next(new AppError('User with this email not found', 404));
    }

    if (user.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Account is already verified.',
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = newOtp;
    user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail({
      to: user.email,
      otp: newOtp,
      type: 'verification',
      userName: user.name,
    });

    res.status(200).json({
      status: 'success',
      message: 'New verification OTP generated. Please check server console.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide an email and password', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password')
      .populate('university');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (user.isBlocked) {
      return next(
        new AppError('Your account has been blocked by an administrator. Please contact campus support.', 403)
      );
    }

    if (user.status === 'suspended') {
      return next(
        new AppError('Your account has been suspended. Please contact campus admin.', 403)
      );
    }

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user / Clear cookie
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Get current logged in user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id).populate('university');
    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, department, yearOfStudy, phone, bio, avatar } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (department !== undefined) updates.department = department.trim();
    if (yearOfStudy !== undefined) updates.yearOfStudy = Number(yearOfStudy);
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('university');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new AppError('Please provide your current password and new password', 400)
      );
    }

    if (newPassword.length < 6) {
      return next(
        new AppError('New password must be at least 6 characters long', 400)
      );
    }

    // Fetch user with password
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    await user.populate('university');
    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password (sends OTP)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide your account email address', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Do not disclose user non-existence for security, still return success
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset code was sent.',
      });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail({
      to: user.email,
      otp: resetOtp,
      type: 'password_reset',
      userName: user.name,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset code dispatched. Please check your console/inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return next(
        new AppError('Please provide email, reset code (OTP), and new password', 400)
      );
    }

    if (newPassword.length < 6) {
      return next(
        new AppError('New password must be at least 6 characters long', 400)
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select('+resetPasswordOtp +resetPasswordExpires')
      .populate('university');

    if (!user) {
      return next(new AppError('Invalid or expired reset request', 400));
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      return next(new AppError('No reset request found for this account', 400));
    }

    if (Date.now() > user.resetPasswordExpires.getTime()) {
      return next(new AppError('Reset code has expired. Please request a new one', 400));
    }

    if (user.resetPasswordOtp !== otp.trim()) {
      return next(new AppError('Invalid reset code. Please check and try again.', 400));
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password has been reset successfully!');
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
