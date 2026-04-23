const Booking = require('../models/Booking');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');
const sendEmail = require('../utils/sendEmail');
const { generateEmailTemplate } = require('../utils/emailTemplates');

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
const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const parseBookingDate = (value) => {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};
const resolveServiceType = (serviceType, plumber) => {
  const explicitServiceType = normalizeString(serviceType);

  if (explicitServiceType) {
    return explicitServiceType;
  }

  if (Array.isArray(plumber.services)) {
    const primaryService = plumber.services
      .map((service) => normalizeString(service))
      .find(Boolean);

    if (primaryService) {
      return primaryService;
    }
  }

  return 'General Plumbing';
};

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
    const normalizedPlumberId = normalizeString(plumberId);
    const normalizedTime = normalizeString(time);
    const normalizedAddress = normalizeString(address);
    const normalizedIssueDescription = normalizeString(issueDescription);
    const normalizedNotes = normalizeString(notes);
    const bookingDate = parseBookingDate(date);

    if (req.user.role !== 'customer') {
      return next(createHttpError(403, 'Only customers can create bookings'));
    }

    if (!normalizedPlumberId) {
      return next(createHttpError(400, 'Plumber is required', 'plumberId'));
    }

    if (!date) {
      return next(createHttpError(400, 'Booking date is required', 'date'));
    }

    if (!bookingDate) {
      return next(createHttpError(400, 'Booking date is invalid', 'date'));
    }

    if (!normalizedTime) {
      return next(createHttpError(400, 'Booking time is required', 'time'));
    }

    if (!normalizedAddress) {
      return next(createHttpError(400, 'Service address is required', 'address'));
    }

    if (!normalizedIssueDescription) {
      return next(createHttpError(400, 'Issue description is required', 'issueDescription'));
    }

    const plumber = await User.findById(normalizedPlumberId).select('_id role services');

    if (!plumber || plumber.role !== 'plumber') {
      return next(createHttpError(400, 'Invalid plumber requested', 'plumberId'));
    }

    if (normalizedPlumberId === req.user._id.toString()) {
      return next(createHttpError(400, 'Customers cannot create bookings for themselves', 'plumberId'));
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      plumberId: normalizedPlumberId,
      serviceType: resolveServiceType(serviceType, plumber),
      date: bookingDate,
      time: normalizedTime,
      address: normalizedAddress,
      issueDescription: normalizedIssueDescription,
      notes: normalizedNotes || undefined,
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
    const nextStatus = normalizeString(req.body.status).toLowerCase();

    if (!nextStatus || !VALID_STATUSES.includes(nextStatus)) {
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

    if (!VALID_STATUS_TRANSITIONS[booking.status].includes(nextStatus)) {
      return next(createHttpError(
        400,
        `Cannot change booking status from ${booking.status} to ${nextStatus}`,
        'status'
      ));
    }

    booking.status = nextStatus;
    booking.completedAt = nextStatus === 'completed' ? new Date() : undefined;
    booking.cancelledAt = nextStatus === 'cancelled' ? new Date() : undefined;

    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    // Send email notification to customer
    if (['accepted', 'completed', 'cancelled'].includes(nextStatus)) {
      const customer = populatedBooking.customerId;
      const plumber = populatedBooking.plumberId;
      
      if (customer && customer.email) {
        let subject = '';
        let statusMessage = '';
        
        if (nextStatus === 'accepted') {
          subject = 'Your Booking has been Accepted';
          statusMessage = 'has accepted your booking and will arrive at the scheduled time.';
        } else if (nextStatus === 'completed') {
          subject = 'Your Service is Completed';
          statusMessage = 'has marked your service as completed. Thank you for using our platform!';
        } else if (nextStatus === 'cancelled') {
          subject = 'Your Booking has been Declined';
          statusMessage = 'is unfortunately unable to fulfill your booking request at this time.';
        }

        const html = generateEmailTemplate({
          title: subject,
          message: `Hello ${customer.name}, your professional ${plumber.name} ${statusMessage}`,
          status: nextStatus,
          details: {
            'Service Type': populatedBooking.serviceType,
            'Scheduled Date': new Date(populatedBooking.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            'Time Slot': populatedBooking.time,
            'Job Status': nextStatus.toUpperCase(),
          },
        });

        sendEmail({ email: customer.email, subject, html }).catch(err => console.error("Email send failed:", err));
      }
    }

    return res.status(200).json({
      success: true,
      data: populatedBooking,
      message: `Booking updated to ${nextStatus}`,
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
