import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import University from '../models/University.js';
import { AppError } from '../middlewares/errorHandler.js';
import { sendOtpEmail } from '../utils/emailService.js';
import { getJwtSecret } from '../config/jwt.js';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';

const googleClient = new OAuth2Client();

const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
});

/**
 * Generate JWT and send response with httpOnly cookie
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    ...authCookieOptions(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    message,
    user: typeof user.toJSON === 'function' ? user.toJSON() : user,
  });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password.', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail }).select('+verificationOtpAttempts +verificationOtpLastSent');
    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Unverified user registering again: check cooldown & resend OTP
        if (existingUser.verificationOtpLastSent && Date.now() - existingUser.verificationOtpLastSent.getTime() < 60 * 1000) {
          return next(new AppError('Please wait at least 60 seconds before requesting another verification code.', 429));
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);
        existingUser.verificationOtp = hashedOtp;
        existingUser.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        existingUser.verificationOtpAttempts = 0;
        existingUser.verificationOtpLastSent = new Date();
        await existingUser.save({ validateBeforeSave: false });

        try {
          await sendOtpEmail({
            to: existingUser.email,
            otp,
            type: 'verification',
            userName: existingUser.name,
          });
        } catch (emailErr) {
          console.error('Failed to send verification email:', emailErr.message);
        }

        return res.status(200).json({
          status: 'success',
          requiresVerification: true,
          email: existingUser.email,
          message: 'An unverified account exists. A new verification code has been sent to your email.',
        });
      }

      return next(new AppError('An account with this email address already exists. Please log in.', 409));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      emailVerified: false,
      isVerified: false,
      isProfileComplete: false,
      verificationOtp: hashedOtp,
      verificationOtpExpires: otpExpires,
      verificationOtpAttempts: 0,
      verificationOtpLastSent: new Date(),
    });

    // Send verification OTP email
    try {
      await sendOtpEmail({
        to: user.email,
        otp,
        type: 'verification',
        userName: user.name,
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr.message);
    }

    res.status(201).json({
      status: 'success',
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful. Please verify the 6-digit OTP sent to your email.',
    });
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
      return next(new AppError('Please provide your email and OTP code.', 400));
    }

    const normalizedEmail = userEmail.toLowerCase().trim();

    // Find user with secret OTP fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+verificationOtp +verificationOtpExpires +verificationOtpAttempts')
      .populate('university');

    if (!user) {
      return next(new AppError('Invalid or expired verification code.', 400));
    }

    if (user.emailVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Email is already verified.',
        user: typeof user.toJSON === 'function' ? user.toJSON() : user,
      });
    }

    if (!user.verificationOtp || !user.verificationOtpExpires) {
      return next(new AppError('Invalid or expired verification code.', 400));
    }

    // Check expiration (10 min)
    if (Date.now() > user.verificationOtpExpires.getTime()) {
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    }

    // Check attempts (max 5)
    if ((user.verificationOtpAttempts || 0) >= 5) {
      return next(new AppError('Maximum verification attempts exceeded. Please request a new code.', 429));
    }

    // Compare hashed OTP (with fallback to plaintext for any legacy unhashed OTPs)
    let isMatch = false;
    if (user.verificationOtp.startsWith('$2a$') || user.verificationOtp.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(otp.trim(), user.verificationOtp);
    } else {
      isMatch = user.verificationOtp === otp.trim();
    }

    if (!isMatch) {
      user.verificationOtpAttempts = (user.verificationOtpAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Invalid or expired verification code.', 400));
    }

    // Mark emailVerified
    user.emailVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.verificationOtpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    // Issue JWT cookie and send response
    sendTokenResponse(
      user,
      200,
      res,
      'Email verified successfully! Please complete your profile.'
    );
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return next(
        new AppError(
          'Google sign-in is not configured on the server. Please add GOOGLE_CLIENT_ID to the environment variables.',
          503
        )
      );
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: req.body?.credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('Google ID token verification failed:', verifyError.message);
      return next(new AppError('The Google credential is invalid or expired.', 401));
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return next(new AppError('Google must provide a verified email address.', 401));
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: payload.sub }).populate('university');
    if (!user) user = await User.findOne({ email }).populate('university');

    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        return next(new AppError('This account is linked to a different Google account.', 409));
      }
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      if (!user.university) {
        const domain = email.split('@')[1];
        if (domain) {
          const domainCandidates = domain.split('.').map((_, index, parts) => parts.slice(index).join('.'));
          const university = await University.findOne({ domain: { $in: domainCandidates } });
          if (university) user.university = university._id;
        }
      }
      await user.save();
      if (user.university) {
        await user.populate('university');
      }
    } else {
      const domain = email.split('@')[1] || '';
      const domainCandidates = domain.split('.').map((_, index, parts) => parts.slice(index).join('.'));
      const university = await University.findOne({
        domain: { $in: domainCandidates },
      });

      const rawName = String(payload.name || email.split('@')[0] || 'Student').trim();
      const safeName = rawName.length < 2 ? `${rawName} Student` : rawName.slice(0, 60);

      user = await User.create({
        name: safeName,
        email,
        password: `${randomUUID()}${randomUUID()}`,
        role: 'student',
        university: university?._id || null,
        avatar: payload.picture || '',
        googleId: payload.sub,
        emailVerified: true,
        isVerified: false,
        verificationStatus: 'unverified',
        isProfileComplete: false,
      });

      if (user.university) {
        await user.populate('university');
      }
    }

    if (user.isBlocked || user.status === 'suspended') {
      return next(new AppError('This account has been suspended. Please contact support.', 403));
    }

    sendTokenResponse(user, 200, res, 'Signed in with Google successfully.');
  } catch (error) {
    console.error('Error in googleLogin:', error);
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
      return next(new AppError('Email address is required.', 400));
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+verificationOtpAttempts +verificationOtpLastSent');

    if (user && !user.emailVerified) {
      // Cooldown check: 60 seconds
      if (user.verificationOtpLastSent && Date.now() - user.verificationOtpLastSent.getTime() < 60 * 1000) {
        return next(new AppError('Please wait at least 60 seconds before requesting another code.', 429));
      }

      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(newOtp, 10);
      user.verificationOtp = hashedOtp;
      user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.verificationOtpAttempts = 0; // reset attempts
      user.verificationOtpLastSent = new Date();
      await user.save({ validateBeforeSave: false });

      try {
        await sendOtpEmail({
          to: user.email,
          otp: newOtp,
          type: 'verification',
          userName: user.name,
        });
      } catch (error) {
        console.error('Verification email delivery failed:', error.message);
      }
    }

    // Always return constant message
    res.status(200).json({
      status: 'success',
      message: 'If an unverified account exists, a verification code will be sent.',
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
      return next(new AppError('Please provide an email and password.', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password and OTP cooldown data
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password +verificationOtpLastSent')
      .populate('university');

    if (!user) {
      return next(
        new AppError('No account found with this email. Please register first.', 404, 'ACCOUNT_NOT_FOUND')
      );
    }

    if (!(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
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

    // Check if email is verified
    if (!user.emailVerified) {
      // Check cooldown (60 seconds)
      const canSend = !user.verificationOtpLastSent || Date.now() - user.verificationOtpLastSent.getTime() >= 60 * 1000;
      if (canSend) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationOtp = await bcrypt.hash(otp, 10);
        user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.verificationOtpAttempts = 0;
        user.verificationOtpLastSent = new Date();
        await user.save({ validateBeforeSave: false });

        try {
          await sendOtpEmail({
            to: user.email,
            otp,
            type: 'verification',
            userName: user.name,
          });
        } catch (emailErr) {
          console.error('Failed to send verification email on login:', emailErr.message);
        }
      }

      return res.status(403).json({
        status: 'fail',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true,
        email: user.email,
        message: 'Your email is not verified yet. We have sent a verification code to your email. Please verify to continue.',
      });
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
    ...authCookieOptions(),
    expires: new Date(Date.now() + 5 * 1000),
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
 * Complete user profile step (after OTP / Google sign-in)
 * POST /api/auth/complete-profile
 */
export const completeProfile = async (req, res, next) => {
  try {
    const { state, phone, city, universityId, department, course, yearOfStudy } = req.body;

    if (!state || !phone) {
      return next(new AppError('State and phone number are required to complete your profile.', 400));
    }

    const updates = {
      state: state.trim(),
      phone: phone.trim(),
      isProfileComplete: true,
    };

    if (city !== undefined) updates.city = city.trim();
    if (department !== undefined) updates.department = department.trim();
    if (course !== undefined) updates.course = course.trim();
    if (yearOfStudy !== undefined && yearOfStudy !== '') updates.yearOfStudy = Number(yearOfStudy);

    if (universityId) {
      const university = await University.findById(universityId);
      if (university) {
        updates.university = university._id;
        if (!updates.city && university.city) updates.city = university.city;
        if (!updates.state && university.state) updates.state = university.state;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate('university');

    res.status(200).json({
      status: 'success',
      message: 'Profile completed successfully!',
      user: typeof user.toJSON === 'function' ? user.toJSON() : user,
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
    const { name, state, city, universityId, department, course, yearOfStudy, phone, bio, avatar } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (state !== undefined) updates.state = state.trim();
    if (city !== undefined) updates.city = city.trim();
    if (department !== undefined) updates.department = department.trim();
    if (course !== undefined) updates.course = course.trim();
    if (yearOfStudy !== undefined) updates.yearOfStudy = Number(yearOfStudy);
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatar !== undefined) updates.avatar = avatar.trim();

    if (universityId) {
      const university = await University.findById(universityId);
      if (university) updates.university = university._id;
    }

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

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+resetPasswordAttempts +resetPasswordLastSent');

    if (user) {
      // Cooldown check (60 seconds)
      if (user.resetPasswordLastSent && Date.now() - user.resetPasswordLastSent.getTime() < 60 * 1000) {
        return next(new AppError('Please wait at least 60 seconds before requesting another reset code.', 429));
      }

      const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(resetOtp, 10);
      user.resetPasswordOtp = hashedOtp;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      user.resetPasswordAttempts = 0;
      user.resetPasswordLastSent = new Date();
      await user.save({ validateBeforeSave: false });

      try {
        await sendOtpEmail({
          to: user.email,
          otp: resetOtp,
          type: 'password_reset',
          userName: user.name,
        });
      } catch (error) {
        console.error('Password reset email delivery failed:', error.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset code was sent.',
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

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail })
      .select('+resetPasswordOtp +resetPasswordExpires +resetPasswordAttempts')
      .populate('university');

    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
      return next(new AppError('Invalid or expired reset request.', 400));
    }

    if (Date.now() > user.resetPasswordExpires.getTime()) {
      return next(new AppError('Reset code has expired. Please request a new one.', 400));
    }

    if ((user.resetPasswordAttempts || 0) >= 5) {
      return next(new AppError('Maximum reset attempts exceeded. Please request a new code.', 429));
    }

    let isMatch = false;
    if (user.resetPasswordOtp.startsWith('$2a$') || user.resetPasswordOtp.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(otp.trim(), user.resetPasswordOtp);
    } else {
      isMatch = user.resetPasswordOtp === otp.trim();
    }

    if (!isMatch) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Invalid or expired reset request.', 400));
    }

    // Set new password and clear reset fields
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    user.resetPasswordLastSent = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password has been reset successfully!');
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  verifyOtp,
  googleLogin,
  resendOtp,
  login,
  logout,
  getMe,
  completeProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
