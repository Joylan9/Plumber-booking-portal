const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, area, ...rest } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Checking if user exists is standard practice before save, though Mongoose throws 11000
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Role defaults to customer. Only allow valid roles directly.
    const userRole = ['customer', 'plumber', 'admin'].includes(role) ? role : 'customer';

    const userFields = {
      name,
      email,
      password,
      role: userRole,
      phone,
      area,
      ...rest // Captures plumber specific fields like bio, experience, etc.
    };

    const user = await User.create(userFields);

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        },
        message: 'User registered successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data received',
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // We explicitly requested to not select password by default in model, so we must add +password
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id, user.role)
        },
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Enterprise security: Don't leak whether an email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account matches that email, a reset token has been processed.',
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // ENTERPRISE EMAIL TRANSPORT
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #2E7D32; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Plumber Booking Portal</h2>
        </div>
        <div style="padding: 30px; background-color: #f9fdfa;">
          <h3 style="color: #333333; margin-top: 0;">Password Reset Request</h3>
          <p style="color: #555555; line-height: 1.6;">
            Hello ${user.name},
          </p>
          <p style="color: #555555; line-height: 1.6;">
            We received a request to securely reset your password. Please use the verification code below to authorize this change. This code is valid for 10 minutes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f1f8f5; border: 2px dashed #4CAF50; color: #2E7D32; padding: 16px 32px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 6px; display: inline-block;">${resetToken}</div>
          </div>
          <p style="color: #888888; font-size: 0.9em; line-height: 1.5;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #eeeeee; padding: 15px; text-align: center;">
          <p style="color: #999999; font-size: 0.85em; margin: 0;">&copy; 2026 Plumber Booking Express. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        // Only attempt to send if credentials exist, otherwise log error but don't crash route
        await require('../utils/sendEmail')({
          email: user.email,
          subject: 'Your Password Reset Link',
          html: messageHtml
        });
      } else {
        console.warn('⚠️ SMTP credentials not found in .env! Email dispatch bypassed.');
        console.log(`[SIMULATED EMAIL] OTP: ${resetToken}`);
      }

      res.status(200).json({
        success: true,
        message: 'If an account matches that email, a reset link has been dispatched to your inbox.',
      });
    } catch (err) {
      console.error('Email dispatch failed:', err);
      // Reset user token so they can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be dispatched. Please contact support.',
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error processing forgot password request'
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, Verification Code, and New Password are required' });
    }

    // Reconstruct token hash to compare to DB mapping
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      },
      message: 'Password reset completely successful. Please proceed to login.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error dynamically resetting password constraints'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};
