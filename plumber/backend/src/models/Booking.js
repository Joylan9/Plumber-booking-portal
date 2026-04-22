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
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
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

bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ plumberId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
