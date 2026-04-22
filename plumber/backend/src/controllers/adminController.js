const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');
const { createHttpError } = require('../utils/httpError');

// Helper to validate Mongo ID
const isValidId = (id) => mongoose.isValidObjectId(id);

// ==========================================
// USERS MANAGEMENT
// ==========================================

const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await User.countDocuments(filter);
    
    // Do not return password or tokens
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      success: true, 
      data: users,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid User ID'));
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) return next(createHttpError(404, 'User not found'));
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid User ID'));
    
    // Destructure ONLY allowed fields. DO NOT allow role or password changes here.
    const { name, phone, area, bio, experience, hourlyRate, services } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return next(createHttpError(404, 'User not found'));
    
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (area !== undefined) user.area = area;
    if (bio !== undefined) user.bio = bio;
    if (experience !== undefined) user.experience = experience;
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (services !== undefined) user.services = services;
    
    await user.save({ validateBeforeSave: false }); // Skip strict validation for admin edits
    
    const updatedUser = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
    res.status(200).json({ success: true, data: updatedUser, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid User ID'));
    
    const user = await User.findById(req.params.id);
    if (!user) return next(createHttpError(404, 'User not found'));

    await User.findByIdAndDelete(req.params.id);
    
    // Cascade delete associated bookings and reviews
    await Booking.deleteMany({ 
      $or: [{ customerId: req.params.id }, { plumberId: req.params.id }] 
    });
    await Review.deleteMany({ 
      $or: [{ customerId: req.params.id }, { plumberId: req.params.id }] 
    });

    res.status(200).json({ success: true, message: 'User and associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BOOKINGS MANAGEMENT
// ==========================================

const getAllBookings = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Booking.countDocuments();
    
    const bookings = await Booking.find()
      .populate('customerId', 'name email')
      .populate('plumberId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Safely map responses to avoid null populated reference crashes
    const safeBookings = bookings.map(b => ({
      ...b.toObject(),
      customerId: b.customerId || { _id: null, name: 'Deleted User', email: '' },
      plumberId: b.plumberId || { _id: null, name: 'Deleted User', email: '' }
    }));
      
    res.status(200).json({ 
      success: true, 
      data: safeBookings,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid Booking ID'));
    
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('plumberId', 'name email phone');
      
    if (!booking) return next(createHttpError(404, 'Booking not found'));
    
    const safeBooking = {
      ...booking.toObject(),
      customerId: booking.customerId || { _id: null, name: 'Deleted User', email: '', phone: '' },
      plumberId: booking.plumberId || { _id: null, name: 'Deleted User', email: '', phone: '' }
    };
    
    res.status(200).json({ success: true, data: safeBooking });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid Booking ID'));
    
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Review.countDocuments();
    
    const reviews = await Review.find()
      .populate('customerId', 'name')
      .populate('plumberId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const safeReviews = reviews.map(r => ({
      ...r.toObject(),
      customerId: r.customerId || { _id: null, name: 'Deleted User' },
      plumberId: r.plumberId || { _id: null, name: 'Deleted User' }
    }));
      
    res.status(200).json({ 
      success: true, 
      data: safeReviews,
      pagination: { page, limit, total }
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid Review ID'));
    
    const review = await Review.findById(req.params.id);
    if (!review) return next(createHttpError(404, 'Review not found'));
    
    const plumberId = review.plumberId;
    
    await Review.findByIdAndDelete(req.params.id);
    
    // Update plumber stats after deletion, if plumber still exists
    if (plumberId) {
      const plumberExists = await User.findById(plumberId);
      if (plumberExists) {
        const { averageRating, totalReviews } = await User.getAverageRating(plumberId);
        await User.findByIdAndUpdate(plumberId, { rating: averageRating, totalReviews });
      }
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
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid Category ID'));
    
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
    if (!isValidId(req.params.id)) return next(createHttpError(400, 'Invalid Category ID'));
    
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
