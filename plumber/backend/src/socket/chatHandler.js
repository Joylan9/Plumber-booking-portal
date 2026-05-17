const Message = require('../models/Message');
const Booking = require('../models/Booking');
const ChatClear = require('../models/ChatClear');

/**
 * Validates that the user is either the customer or plumber on the booking.
 */
const validateBookingAccess = async (userId, bookingId) => {
  const booking = await Booking.findById(bookingId)
    .select('customerId plumberId status')
    .lean();

  if (!booking) return null;

  const isCustomer = booking.customerId.toString() === userId.toString();
  const isPlumber = booking.plumberId.toString() === userId.toString();

  if (!isCustomer && !isPlumber) return null;

  return booking;
};

/**
 * Sanitizes a message for a specific user.
 * - Replaces content of deleted-for-everyone messages with null + placeholder flag.
 * - Excludes messages deleted-for-me by this user (returns null to signal filtering).
 */
const sanitizeMessage = (msg, userId) => {
  const uid = userId.toString();

  // If the user individually deleted this message, exclude it
  if (msg.deletedForUsers && msg.deletedForUsers.some((id) => id.toString() === uid)) {
    return null;
  }

  // If deleted for everyone, replace content with placeholder
  if (msg.isDeletedForEveryone) {
    return {
      ...msg,
      content: null,
      _isDeletedPlaceholder: true,
    };
  }

  return msg;
};

/**
 * Registers chat event handlers on a socket connection.
 */
const registerChatHandlers = (io, socket) => {
  // ── Join a booking chat room ──────────────────────────
  socket.on('chat:join', async ({ bookingId }) => {
    try {
      if (!bookingId) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied to this chat' });
      }

      const roomName = `booking:${bookingId}`;
      socket.join(roomName);

      const userId = socket.user._id;

      // Check if the user has a "clear chat" timestamp
      const clearRecord = await ChatClear.findOne({ bookingId, userId }).lean();

      // Build query: exclude messages deleted for this user
      const query = {
        bookingId,
        deletedForUsers: { $nin: [userId] },
      };

      // Only show messages after clearedAt if applicable
      if (clearRecord?.clearedAt) {
        query.createdAt = { $gt: clearRecord.clearedAt };
      }

      // Send chat history (last 50 messages)
      const rawMessages = await Message.find(query)
        .sort({ createdAt: 1 })
        .limit(50)
        .select('senderId senderRole content status readAt deliveredAt createdAt isDeletedForEveryone deletedForUsers deletedAt')
        .lean();

      // Sanitize: replace deleted-for-everyone content with placeholder
      const messages = rawMessages
        .map((msg) => sanitizeMessage(msg, userId))
        .filter(Boolean);

      socket.emit('chat:history', { bookingId, messages });
    } catch (error) {
      console.error('[Chat] Join error:', error.message);
      socket.emit('chat:error', { message: 'Failed to join chat' });
    }
  });

  // ── Leave a booking chat room ─────────────────────────
  socket.on('chat:leave', ({ bookingId }) => {
    if (bookingId) {
      socket.leave(`booking:${bookingId}`);
    }
  });

  // ── Send a message ────────────────────────────────────
  socket.on('chat:send', async ({ bookingId, message }) => {
    try {
      if (!bookingId || !message || !message.trim()) return;

      const content = message.trim().substring(0, 2000);

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied' });
      }

      // Persist the message
      const newMessage = await Message.create({
        bookingId,
        senderId: socket.user._id,
        senderRole: socket.user.role,
        content,
      });

      const messagePayload = {
        _id: newMessage._id,
        bookingId,
        senderId: socket.user._id,
        senderName: socket.user.name,
        senderRole: socket.user.role,
        content,
        status: 'sent',
        createdAt: newMessage.createdAt,
      };

      // Emit to all users in the booking room (including sender for confirmation)
      io.to(`booking:${bookingId}`).emit('chat:receive', messagePayload);
    } catch (error) {
      console.error('[Chat] Send error:', error.message);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // ── Typing indicator ──────────────────────────────────
  socket.on('chat:typing', ({ bookingId }) => {
    if (bookingId) {
      socket.to(`booking:${bookingId}`).emit('chat:typing', {
        bookingId,
        userName: socket.user.name,
        userId: socket.user._id,
      });
    }
  });

  // ── Read receipts ─────────────────────────────────────
  socket.on('chat:read', async ({ bookingId, messageIds }) => {
    try {
      if (!bookingId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) return;

      const readTime = new Date();

      // Only update messages where:
      // 1. _id is in messageIds
      // 2. status is not already 'read'
      // 3. sender is not the current user (you can't mark your own messages as read)
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          bookingId,
          status: { $ne: 'read' },
          senderId: { $ne: socket.user._id }
        },
        {
          $set: {
            status: 'read',
            readAt: readTime
          }
        }
      );

      if (result.modifiedCount > 0) {
        // Find the sender of one of the messages to know who to notify
        const msg = await Message.findOne({ _id: messageIds[0] }).select('senderId');
        if (msg) {
          // Emit only to the original sender's personal room
          io.to(`user:${msg.senderId.toString()}`).emit('chat:messageStatus', {
            bookingId,
            messageIds,
            status: 'read',
            readAt: readTime
          });
        }
      }
    } catch (error) {
      console.error('[Chat] Read receipt error:', error.message);
    }
  });

  // ── Delete for Me (socket-based, local-only) ─────────
  socket.on('chat:deleteForMe', async ({ bookingId, messageId }) => {
    try {
      if (!bookingId || !messageId) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied' });
      }

      const userId = socket.user._id;
      const message = await Message.findOne({ _id: messageId, bookingId });

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Idempotent: skip if already deleted for this user
      if (!message.deletedForUsers.some((id) => id.toString() === userId.toString())) {
        message.deletedForUsers.push(userId);
        message.deletedAt = new Date();
        await message.save();
      }

      // Confirm back to the sender only (no broadcast to others)
      socket.emit('chat:messageDeletedForMe', {
        bookingId,
        messageId,
      });
    } catch (error) {
      console.error('[Chat] Delete for me error:', error.message);
      socket.emit('chat:error', { message: 'Failed to delete message' });
    }
  });

  // ── Delete for Everyone (broadcast to entire room) ────
  socket.on('chat:deleteForEveryone', async ({ bookingId, messageId }) => {
    try {
      if (!bookingId || !messageId) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied' });
      }

      const userId = socket.user._id;
      const message = await Message.findOne({ _id: messageId, bookingId });

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Authorization: only the sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return socket.emit('chat:error', { message: 'You can only delete your own messages for everyone' });
      }

      // Idempotent
      if (!message.isDeletedForEveryone) {
        message.isDeletedForEveryone = true;
        message.deletedAt = new Date();
        await message.save();
      }

      // Broadcast to the entire booking room (both participants)
      io.to(`booking:${bookingId}`).emit('chat:messageDeletedForEveryone', {
        bookingId,
        messageId,
      });
    } catch (error) {
      console.error('[Chat] Delete for everyone error:', error.message);
      socket.emit('chat:error', { message: 'Failed to delete message' });
    }
  });

  // ── Clear Chat (local-only, persisted via ChatClear) ──
  socket.on('chat:clearChat', async ({ bookingId }) => {
    try {
      if (!bookingId) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied' });
      }

      const userId = socket.user._id;
      const clearedAt = new Date();

      await ChatClear.findOneAndUpdate(
        { bookingId, userId },
        { clearedAt },
        { upsert: true, new: true }
      );

      // Confirm back to the sender only
      socket.emit('chat:chatCleared', {
        bookingId,
        clearedAt,
      });
    } catch (error) {
      console.error('[Chat] Clear chat error:', error.message);
      socket.emit('chat:error', { message: 'Failed to clear chat' });
    }
  });
};

module.exports = registerChatHandlers;
