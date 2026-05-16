const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender reference is required'],
  },
  senderRole: {
    type: String,
    enum: ['customer', 'plumber'],
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['sent', 'read'],
    default: 'sent',
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for fast history queries and unread message updates
messageSchema.index({ bookingId: 1, createdAt: -1 });
messageSchema.index({ bookingId: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
