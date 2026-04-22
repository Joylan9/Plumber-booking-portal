const Booking = require('../models/Booking');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const BOOKING_POPULATE = [
  { path: 'customerId', select: 'name email phone area' },
  { path: 'plumberId', select: 'name email phone area services hourlyRate rating totalReviews experience' },
];

const VALID_STATUSES = ['pending', 'accepted', 'completed', 'cancelled'];

const VALID_STATUS_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const populateBooking = (query) => BOOKING_POPULATE.reduce(
  (currentQuery, populateConfig) => currentQuery.populate(populateConfig),
  query
);

const getBookingAccessFilter = (user) => {
  if (user.role === 'customer') {
    return { customerId: user._id };
  }

  if (user.role === 'plumber') {
    return { plumberId: user._id };
  }

  if (user.role === 'admin') {
    return {};
  }

  throw createHttpError(403, 'Unauthorized profile access');
};

const createBooking = async (req, res, next) => {
  try {
    const { plumberId, serviceType, date, time, address, issueDescription, notes } = req.body;

    if (!plumberId || !serviceType || !date || !time || !address || !issueDescription) {
      return next(createHttpError(400, 'Plumber, service type, date, time, address, and issue description are required'));
    }

    const plumber = await User.findById(plumberId);

    if (!plumber || plumber.role !== 'plumber') {
      return next(createHttpError(400, 'Invalid plumber requested', 'plumberId'));
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      plumberId,
      serviceType,
      date,
      time,
      address,
      issueDescription,
      notes,
    });

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    return res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const filter = getBookingAccessFilter(req.user);
    const bookings = await populateBooking(Booking.find(filter))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await populateBooking(Booking.findById(req.params.id));

    if (!booking) {
      return next(createHttpError(404, 'Booking not found'));
    }

    const canAccess = req.user.role === 'admin'
      || booking.customerId?._id?.toString() === req.user._id.toString()
      || booking.plumberId?._id?.toString() === req.user._id.toString();

    if (!canAccess) {
      return next(createHttpError(403, 'Not authorized'));
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    return next(error);
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createHttpError(400, 'Invalid status update command', 'status'));
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(createHttpError(404, 'Booking not found'));
    }

    const isAssignedPlumber = booking.plumberId.toString() === req.user._id.toString();
    if (!isAssignedPlumber && req.user.role !== 'admin') {
      return next(createHttpError(403, 'Not authorized to update this booking status'));
    }

    if (!VALID_STATUS_TRANSITIONS[booking.status].includes(status)) {
      return next(createHttpError(
        400,
        `Cannot change booking status from ${booking.status} to ${status}`,
        'status'
      ));
    }

    booking.status = status;

    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
    }

    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    return res.status(200).json({
      success: true,
      data: populatedBooking,
      message: `Booking updated to ${status}`,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
};
