const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const SAFE_PLUMBER_SELECT = '_id name area bio experience hourlyRate services availability rating totalReviews';
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all plumbers
// @route   GET /api/plumbers
// @access  Public
const getPlumbers = async (req, res, next) => {
  try {
    const filter = { role: 'plumber' };

    if (req.query.area && req.query.area.trim()) {
      filter.area = { $regex: escapeRegex(req.query.area.trim()), $options: 'i' };
    }

    if (req.query.service && req.query.service.trim()) {
      filter.services = { $regex: escapeRegex(req.query.service.trim()), $options: 'i' };
    }

    const plumbers = await User.find(filter)
      .select(SAFE_PLUMBER_SELECT)
      .lean();

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
    const plumber = await User.findOne({ _id: req.params.id, role: 'plumber' })
      .select(SAFE_PLUMBER_SELECT)
      .lean();

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
  getPlumberById,
};
