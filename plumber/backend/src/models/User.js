const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email format',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'plumber', 'admin'],
    default: 'customer',
  },
  phone: {
    type: String,
  },
  area: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  // --- Plumber-specific fields ---
  bio: {
    type: String,
  },
  experience: {
    type: Number,
  },
  hourlyRate: {
    type: Number,
  },
  services: {
    type: [String],
  },
  availability: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

// Conditional Valdiations for Plumbers
userSchema.pre('validate', function () {
  if (this.role === 'plumber') {
    if (!this.experience) this.invalidate('experience', 'Experience is required for plumbers');
    if (this.hourlyRate === undefined) this.invalidate('hourlyRate', 'Hourly rate is required for plumbers');
    if (!this.services || this.services.length === 0) this.invalidate('services', 'At least one service required for plumbers');
  }
});

// Encrypt password using bcrypt before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash 6-digit OTP securely
userSchema.methods.getResetPasswordToken = function () {
  // Generate 6-digit dynamic OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the payload natively to DB and map to schema
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expiration mapping 10 minutes effectively securely
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return otp;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
