const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: [true, 'Booking date is required'],
    validate: {
      validator: function(v) {
        // Must be today or future date
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        return v >= today;
      },
      message: 'Booking date cannot be in the past'
    }
  },
  time: {
    type: String,
    required: [true, 'Booking time is required'],
  },
  address: {
    type: String,
    required: [true, 'Service address is required'],
  },
  issueDescription: {
    type: String,
    required: [true, 'Issue description is required'],
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
