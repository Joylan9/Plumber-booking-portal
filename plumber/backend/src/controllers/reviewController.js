const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');
const sendEmail = require('../utils/sendEmail');
const { generateEmailTemplate } = require('../utils/emailTemplates');

const REVIEW_POPULATE = [
  { path: 'customerId', select: 'name' },
  { path: 'plumberId', select: 'name rating totalReviews' },
];

const populateReview = (query) => REVIEW_POPULATE.reduce(
  (currentQuery, populateConfig) => currentQuery.populate(populateConfig),
  query
);

const updatePlumberReviewStats = async (plumberId) => {
  const { averageRating, totalReviews } = await User.getAverageRating(plumberId);

  await User.findByIdAndUpdate(plumberId, {
    rating: averageRating,
    totalReviews,
  });
};

const createReview = async (req, res, next) => {
  try {
    const { bookingId, plumberId, rating, comment = '' } = req.body;

    if (!bookingId || !rating) {
      return next(createHttpError(400, 'Booking and rating are required'));
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return next(createHttpError(400, 'Rating must be an integer between 1 and 5', 'rating'));
    }

    if (req.user.role !== 'customer') {
      return next(createHttpError(403, 'Only customers can create reviews'));
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return next(createHttpError(404, 'Booking not found'));
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return next(createHttpError(403, 'You can only review your own bookings'));
    }

    if (booking.status !== 'completed') {
      return next(createHttpError(400, 'Review can only be created for completed bookings'));
    }

    if (plumberId && booking.plumberId.toString() !== plumberId.toString()) {
      return next(createHttpError(400, 'Review plumber does not match the booking', 'plumberId'));
    }

    const existingReview = await Review.findOne({ bookingId });

    if (existingReview) {
      return next(createHttpError(409, 'You already reviewed this booking'));
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
    if (trimmedComment && trimmedComment.length < 10) {
      return next(createHttpError(400, 'Comment must be at least 10 characters', 'comment'));
    }

    const review = await Review.create({
      bookingId,
      customerId: req.user._id,
      plumberId: booking.plumberId,
      rating: numericRating,
      comment: trimmedComment,
    });

    await updatePlumberReviewStats(booking.plumberId);

    const populatedReview = await populateReview(Review.findById(review._id));

    // Send email notification to plumber
    const plumber = await User.findById(booking.plumberId).select('email name');
    if (plumber && plumber.email) {
      const subject = 'New Review Received ⭐';
      const customerName = populatedReview.customerId?.name || 'A customer';
      const html = generateEmailTemplate({
        title: subject,
        message: `Congratulations ${plumber.name}! You have received a new performance rating from ${customerName}.`,
        status: `${numericRating} STARS`,
        details: {
          'Customer': customerName,
          'Rating': '⭐'.repeat(numericRating),
          'Feedback': trimmedComment,
          'Date Received': new Date().toLocaleDateString(),
        },
      });
      sendEmail({ email: plumber.email, subject, html }).catch(err => console.error("Email send failed:", err));
    }

    return res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review created successfully',
    });
  } catch (error) {
    return next(error);
  }
};

const getPlumberReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      populateReview(
        Review.find({ plumberId: req.params.plumberId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Review.countDocuments({ plumberId: req.params.plumberId }),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews || [],
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + (reviews?.length || 0) < total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createReview,
  getPlumberReviews,
};
