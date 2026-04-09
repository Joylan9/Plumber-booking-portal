const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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

module.exports = {
  registerUser,
  loginUser,
};
