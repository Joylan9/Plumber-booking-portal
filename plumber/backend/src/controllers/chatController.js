const Message = require('../models/Message');
const Booking = require('../models/Booking');
const ChatClear = require('../models/ChatClear');
const { createHttpError } = require('../utils/httpError');

// ── Helpers ──────────────────────────────────────────────

/**
 * Validates that the requesting user is a participant on the booking.
 * Returns { booking, isCustomer, isPlumber, isAdmin }.
 */
const validateParticipant = async (req, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .select('customerId plumberId')
    .lean();

  if (!booking) return null;

  const userId = req.user._id.toString();
  const isCustomer = booking.customerId.toString() === userId;
  const isPlumber = booking.plumberId.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isPlumber && !isAdmin) return null;

  return { booking, isCustomer, isPlumber, isAdmin };
};

// ── GET /api/chat/:bookingId ─────────────────────────────

/**
 * Returns the last 100 messages for a booking.
 * Filters out: messages deleted-for-me by the requesting user,
 * messages before the user's clearedAt timestamp.
 * Replaces content of deleted-for-everyone messages with placeholder.
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const participant = await validateParticipant(req, bookingId);
    if (!participant) {
      return next(createHttpError(403, 'Not authorized to view this chat'));
    }

    const userId = req.user._id;

    // Check if the user has a "clear chat" timestamp
    const clearRecord = await ChatClear.findOne({
      bookingId,
      userId,
    }).lean();

    // Build query: exclude messages deleted for this user
    const query = {
      bookingId,
      deletedForUsers: { $nin: [userId] },
    };

    // If user cleared the chat, only show messages after clearedAt
    if (clearRecord?.clearedAt) {
      query.createdAt = { $gt: clearRecord.clearedAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(100)
      .select('senderId senderRole content status readAt deliveredAt createdAt isDeletedForEveryone deletedAt')
      .lean();

    // Replace content of deleted-for-everyone messages with placeholder
    const sanitized = messages.map((msg) => {
      if (msg.isDeletedForEveryone) {
        return {
          ...msg,
          content: null,
          _isDeletedPlaceholder: true,
        };
      }
      return msg;
    });

    return res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error) {
    return next(error);
  }
};

// ── DELETE /api/chat/:bookingId/messages/:messageId ──────

/**
 * "Delete for Me" — hides the message from the requesting user only.
 * Any participant can delete any message for themselves.
 */
const deleteMessageForMe = async (req, res, next) => {
  try {
    const { bookingId, messageId } = req.params;

    const participant = await validateParticipant(req, bookingId);
    if (!participant) {
      return next(createHttpError(403, 'Not authorized to access this chat'));
    }

    const userId = req.user._id;

    // Ensure the message exists and belongs to this booking
    const message = await Message.findOne({ _id: messageId, bookingId });
    if (!message) {
      return next(createHttpError(404, 'Message not found'));
    }

    // Idempotent: skip if already deleted for this user
    if (message.deletedForUsers.some((id) => id.toString() === userId.toString())) {
      return res.status(200).json({ success: true, message: 'Already deleted' });
    }

    message.deletedForUsers.push(userId);
    message.deletedAt = new Date();
    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Message deleted for you',
      data: { messageId },
    });
  } catch (error) {
    return next(error);
  }
};

// ── DELETE /api/chat/:bookingId/messages/:messageId/everyone ──

/**
 * "Delete for Everyone" — marks the message as deleted for all participants.
 * Only the original sender can perform this action.
 */
const deleteMessageForEveryone = async (req, res, next) => {
  try {
    const { bookingId, messageId } = req.params;

    const participant = await validateParticipant(req, bookingId);
    if (!participant) {
      return next(createHttpError(403, 'Not authorized to access this chat'));
    }

    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, bookingId });
    if (!message) {
      return next(createHttpError(404, 'Message not found'));
    }

    // Authorization: only the sender can delete for everyone
    if (message.senderId.toString() !== userId.toString()) {
      return next(createHttpError(403, 'You can only delete your own messages for everyone'));
    }

    // Idempotent: skip if already deleted for everyone
    if (message.isDeletedForEveryone) {
      return res.status(200).json({ success: true, message: 'Already deleted for everyone' });
    }

    message.isDeletedForEveryone = true;
    message.deletedAt = new Date();
    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Message deleted for everyone',
      data: { messageId, bookingId },
    });
  } catch (error) {
    return next(error);
  }
};

// ── POST /api/chat/:bookingId/clear ─────────────────────

/**
 * "Clear Chat" — hides all messages before now for the requesting user.
 * Does not modify any Message documents — only creates/updates a ChatClear record.
 */
const clearChat = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const participant = await validateParticipant(req, bookingId);
    if (!participant) {
      return next(createHttpError(403, 'Not authorized to access this chat'));
    }

    const userId = req.user._id;
    const clearedAt = new Date();

    await ChatClear.findOneAndUpdate(
      { bookingId, userId },
      { clearedAt },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Chat cleared',
      data: { bookingId, clearedAt },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getChatHistory,
  deleteMessageForMe,
  deleteMessageForEveryone,
  clearChat,
};
