const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const sanitizeUser = require('../utils/sanitizeUser');
const { createHttpError } = require('../utils/httpError');

const GENERIC_RESET_MESSAGE = 'If an account matches that email, reset instructions have been sent.';

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeOptionalString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeServices = (services) => {
  if (!Array.isArray(services)) {
    return [];
  }

  return [...new Set(
    services
      .map((service) => normalizeOptionalString(service))
      .filter(Boolean)
  )];
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getAuthResponse = (user) => sanitizeUser(user, generateToken(user._id, user.role));
const canSendResetEmail = () => (
  Boolean(process.env.SMTP_HOST)
  && Boolean(process.env.SMTP_EMAIL)
  && Boolean(process.env.SMTP_PASSWORD)
  && Boolean(process.env.FROM_EMAIL)
);
const shouldLogResetDetails = () => (
  process.env.NODE_ENV !== 'production'
  && process.env.NODE_ENV !== 'test'
  && process.env.ENABLE_DEV_EMAIL_LOGS === 'true'
);

const validatePassword = (password) => {
  if (typeof password !== 'string' || !password) {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
};

const resetPasswordEmailTemplate = ({ name, otp, resetUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background-color: #0A2540; padding: 24px; text-align: center;">
      <h2 style="color: #ffffff; margin: 0;">FlowMatch Password Reset</h2>
    </div>
    <div style="padding: 28px; background-color: #f8fafc;">
      <p style="color: #1f2937; line-height: 1.6; margin-top: 0;">Hello ${name},</p>
      <p style="color: #4b5563; line-height: 1.6;">
        Use the verification code below or open the reset link to set a new password. Both options expire in 10 minutes.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <div style="background-color: #fff7e6; border: 1px dashed #F0A500; color: #0A2540; padding: 16px 24px; border-radius: 10px; font-size: 30px; font-weight: 700; letter-spacing: 6px; display: inline-block;">
          ${otp}
        </div>
      </div>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #F0A500; color: #0A2540; text-decoration: none; font-weight: 700; padding: 14px 24px; border-radius: 10px;">
          Reset Password
        </a>
      </div>
      <p style="color: #6b7280; line-height: 1.6; font-size: 14px; word-break: break-word;">
        If the button does not open, copy this link into your browser:<br />
        <a href="${resetUrl}" style="color: #0A2540;">${resetUrl}</a>
      </p>
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
        If you did not request this change, you can ignore this email.
      </p>
    </div>
  </div>
`;

const finishPasswordReset = async (user) => {
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return {
    success: true,
    data: getAuthResponse(user),
    message: 'Password reset successful',
  };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      area,
      bio,
      experience,
      hourlyRate,
      services,
      availability,
      profileImage,
    } = req.body;

    const trimmedName = normalizeOptionalString(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = normalizeOptionalString(role);

    if (!trimmedName || !normalizedEmail || typeof password !== 'string' || !password) {
      return next(createHttpError(400, 'Name, email, and password are required'));
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return next(createHttpError(400, passwordError, 'password'));
    }

    if (normalizedRole === 'admin') {
      return next(createHttpError(403, 'Admin registration is not allowed'));
    }

    if (normalizedRole && !['customer', 'plumber'].includes(normalizedRole)) {
      return next(createHttpError(400, 'Invalid role supplied', 'role'));
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return next(createHttpError(409, 'Email already exists', 'email'));
    }

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      role: normalizedRole === 'plumber' ? 'plumber' : 'customer',
      phone: normalizeOptionalString(phone),
      area: normalizeOptionalString(area),
      bio: normalizeOptionalString(bio),
      experience: experience === undefined || experience === null || experience === '' ? undefined : Number(experience),
      hourlyRate: hourlyRate === undefined || hourlyRate === null || hourlyRate === '' ? undefined : Number(hourlyRate),
      services: normalizeServices(services),
      availability: normalizeOptionalString(availability),
      profileImage: normalizeOptionalString(profileImage),
    });

    return res.status(201).json({
      success: true,
      data: getAuthResponse(user),
      message: 'User registered successfully',
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return next(createHttpError(400, 'Email and password are required'));
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return next(createHttpError(401, 'Invalid email or password'));
    }

    return res.status(200).json({
      success: true,
      data: getAuthResponse(user),
      message: 'Login successful',
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
      return next(createHttpError(400, 'Email is required', 'email'));
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: null,
        message: GENERIC_RESET_MESSAGE,
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getFrontendUrl()}/reset-password/${resetToken}`;

    try {
      if (canSendResetEmail()) {
        await sendEmail({
          email: user.email,
          subject: 'Reset your FlowMatch password',
          html: resetPasswordEmailTemplate({
            name: user.name,
            otp: resetToken,
            resetUrl,
          }),
        });
      } else if (process.env.NODE_ENV === 'production') {
        throw createHttpError(500, 'Password reset email service is not configured');
      } else if (shouldLogResetDetails()) {
        console.warn('⚠️ SMTP credentials not found in .env! Email dispatch bypassed.');
        console.log(`[SIMULATED EMAIL] OTP: ${resetToken}`);
        console.log(`[SIMULATED EMAIL] URL: ${resetUrl}`);
      }

      return res.status(200).json({
        success: true,
        data: null,
        message: GENERIC_RESET_MESSAGE,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      if (!error.statusCode) {
        error.customContext = 'email';
      }

      return next(error);
    }

  } catch (error) {
    return next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return next(createHttpError(400, 'Email, verification code, and new password are required'));
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return next(createHttpError(400, passwordError, 'password'));
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
      resetPasswordToken: hashResetToken(otp),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(createHttpError(401, 'Invalid or expired reset token'));
    }

    user.password = password;

    const response = await finishPasswordReset(user);

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

const resetPasswordByToken = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!token || !password) {
      return next(createHttpError(400, 'Reset token and new password are required'));
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return next(createHttpError(400, passwordError, 'password'));
    }

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(createHttpError(401, 'Invalid or expired reset token'));
    }

    user.password = password;

    const response = await finishPasswordReset(user);

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  resetPasswordByToken,
};
