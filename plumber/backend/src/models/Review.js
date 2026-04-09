const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required'],
    unique: true, // Only one review per booking (enforced via unique index)
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
  },
  plumberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Plumber ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Custom async validation to ensure booking status = completed
reviewSchema.path('bookingId').validate(async function (value) {
  try {
    const booking = await mongoose.model('Booking').findById(value);
    if (!booking) return false;
    return booking.status === 'completed';
  } catch (error) {
    return false;
  }
}, 'Review can only be created if the booking is completed.');

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
