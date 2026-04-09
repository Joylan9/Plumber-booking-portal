const User = require('../models/User');

// @desc    Get all plumbers
// @route   GET /api/plumbers
// @access  Public
const getPlumbers = async (req, res) => {
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

    res.status(200).json({
      success: true,
      count: plumbers.length,
      data: plumbers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error retrieving plumbers',
    });
  }
};

// @desc    Get a single plumber
// @route   GET /api/plumbers/:id
// @access  Public
const getPlumberById = async (req, res) => {
  try {
    const plumber = await User.findOne({ _id: req.params.id, role: 'plumber' }).select('-password');

    if (!plumber) {
      return res.status(404).json({
        success: false,
        message: 'Plumber not found',
      });
    }

    res.status(200).json({
      success: true,
      data: plumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error retrieving plumber profile',
    });
  }
};

module.exports = {
  getPlumbers,
  getPlumberById
};
