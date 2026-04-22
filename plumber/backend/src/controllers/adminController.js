const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');
const { createHttpError } = require('../utils/httpError');

// ==========================================
// USERS MANAGEMENT
// ==========================================

const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    // Do not return password or tokens
    const users = await User.find(filter).select('-password -resetPasswordToken -resetPasswordExpire').sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return next(createHttpError(404, 'User not found'));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, phone, area, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return next(createHttpError(404, 'User not found'));
    
    // Prevent admin from removing their own admin status accidentally
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
      return next(createHttpError(403, 'Cannot demote yourself'));
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (area !== undefined) user.area = area;
    if (role && ['customer', 'plumber', 'admin'].includes(role)) user.role = role;
    
    await user.save({ validateBeforeSave: false }); // Skip strict validation for admin edits
    
    res.status(200).json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createHttpError(404, 'User not found'));
    
    if (user._id.toString() === req.user._id.toString()) {
      return next(createHttpError(403, 'Cannot delete yourself'));
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name email')
      .populate('plumberId', 'name email')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('plumberId', 'name email phone');
      
    if (!booking) return next(createHttpError(404, 'Booking not found'));
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return next(createHttpError(404, 'Booking not found'));
    
    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REVIEWS MANAGEMENT
// ==========================================

const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customerId', 'name')
      .populate('plumberId', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(createHttpError(404, 'Review not found'));
    
    const plumberId = review.plumberId;
    
    await Review.findByIdAndDelete(req.params.id);
    
    // Update plumber stats after deletion
    if (plumberId) {
      const { averageRating, totalReviews } = await User.getAverageRating(plumberId);
      await User.findByIdAndUpdate(plumberId, { rating: averageRating, totalReviews });
    }
    
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CATEGORIES MANAGEMENT
// ==========================================

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name) return next(createHttpError(400, 'Category name is required'));
    
    const category = await Category.create({ name, description, isActive });
    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) return next(createHttpError(404, 'Category not found'));
    
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    res.status(200).json({ success: true, data: category, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(createHttpError(404, 'Category not found'));
    
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  getBookingById,
  deleteBooking,
  getAllReviews,
  deleteReview,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
