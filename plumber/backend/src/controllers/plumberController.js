const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

// @desc    Get all plumbers
// @route   GET /api/plumbers
// @access  Public
const getPlumbers = async (req, res, next) => {
  try {
    const filter = { role: 'plumber' };

    // Optional query parameter filtering
    if (req.query.area) {
      // Basic exact string match or regex match depending on complexity needed
      filter.area = { $regex: req.query.area, $options: 'i' }; 
    }
    if (req.query.service) {
      filter.services = { $in: [req.query.service] };
    }

    const plumbers = await User.find(filter).select('-password');

    return res.status(200).json({
      success: true,
      count: plumbers.length,
      data: plumbers,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get a single plumber
// @route   GET /api/plumbers/:id
// @access  Public
const getPlumberById = async (req, res, next) => {
  try {
    const plumber = await User.findOne({ _id: req.params.id, role: 'plumber' }).select('-password');

    if (!plumber) {
      return next(createHttpError(404, 'Plumber not found'));
    }

    return res.status(200).json({
      success: true,
      data: plumber,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPlumbers,
  getPlumberById
};
