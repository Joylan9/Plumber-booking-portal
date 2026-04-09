const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Customer only)
const createBooking = async (req, res) => {
  try {
    const { plumberId, date, time, address, issueDescription, notes } = req.body;

    // Validate Plumber Existence and Identity
    const plumber = await User.findById(plumberId);
    if (!plumber || plumber.role !== 'plumber') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plumber requested',
      });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      plumberId,
      date,
      time,
      address,
      issueDescription,
      notes,
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error creating booking',
    });
  }
};

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    let filter = {};

    // Differentiate query based on user role natively
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'plumber') {
      filter.plumberId = req.user._id;
    } else {
      // Admin sees all? Let's just catch admin later or default to all.
      if (req.user.role !== 'admin') {
         // Failsafe
         return res.status(403).json({ success: false, message: 'Unauthorized profile access' });
      }
    }

    // Populate the reference user fields securely removing passwords
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone area')
      .populate('plumberId', 'name email phone services hourlyRate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error retrieving bookings',
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Plumber only natively, but can expand to Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ensure the plumber making the request is the assigned plumber
    if (booking.plumberId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(403).json({
         success: false,
         message: 'Not authorized to update this booking status',
       });
    }

    if (!['pending', 'accepted', 'completed', 'cancelled'].includes(status)) {
       return res.status(400).json({
         success: false,
         message: 'Invalid status update command',
       });
    }

    booking.status = status;

    if (status === 'completed') {
      booking.completedAt = Date.now();
    } else if (status === 'cancelled') {
      booking.cancelledAt = Date.now();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: `Booking seamlessly transitioned to ${status}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error updating booking',
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingStatus
};
