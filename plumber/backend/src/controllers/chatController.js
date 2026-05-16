const Message = require('../models/Message');
const Booking = require('../models/Booking');
const { createHttpError } = require('../utils/httpError');

/**
 * GET /api/chat/:bookingId
 * Returns the last 100 messages for a booking.
 * Only accessible by the customer or plumber on the booking.
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .select('customerId plumberId')
      .lean();

    if (!booking) {
      return next(createHttpError(404, 'Booking not found'));
    }

    const userId = req.user._id.toString();
    const isCustomer = booking.customerId.toString() === userId;
    const isPlumber = booking.plumberId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isPlumber && !isAdmin) {
      return next(createHttpError(403, 'Not authorized to view this chat'));
    }

    const messages = await Message.find({ bookingId })
      .sort({ createdAt: 1 })
      .limit(100)
      .select('senderId senderRole content readAt createdAt')
      .lean();

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getChatHistory,
};
