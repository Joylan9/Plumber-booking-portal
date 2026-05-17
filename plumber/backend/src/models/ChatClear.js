const mongoose = require('mongoose');

/**
 * Tracks per-user "Clear Chat" timestamps.
 *
 * When a user clears a chat, all messages with `createdAt < clearedAt`
 * are hidden from that user's view — without mutating the Message documents.
 * The other participant's view is completely unaffected.
 */
const chatClearSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clearedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound unique index — one clear record per user per booking
chatClearSchema.index({ bookingId: 1, userId: 1 }, { unique: true });

const ChatClear = mongoose.model('ChatClear', chatClearSchema);

module.exports = ChatClear;
