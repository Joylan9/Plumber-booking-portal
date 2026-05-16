const Message = require('../models/Message');
const Booking = require('../models/Booking');

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
 * Registers chat event handlers on a socket connection.
 */
const registerChatHandlers = (io, socket) => {
  // Join a booking chat room
  socket.on('chat:join', async ({ bookingId }) => {
    try {
      if (!bookingId) return;

      const booking = await validateBookingAccess(socket.user._id, bookingId);
      if (!booking) {
        return socket.emit('chat:error', { message: 'Access denied to this chat' });
      }

      const roomName = `booking:${bookingId}`;
      socket.join(roomName);

      // Send chat history (last 50 messages)
      const messages = await Message.find({ bookingId })
        .sort({ createdAt: 1 })
        .limit(50)
        .select('senderId senderRole content status readAt deliveredAt createdAt')
        .lean();

      socket.emit('chat:history', { bookingId, messages });
    } catch (error) {
      console.error('[Chat] Join error:', error.message);
      socket.emit('chat:error', { message: 'Failed to join chat' });
    }
  });

  // Leave a booking chat room
  socket.on('chat:leave', ({ bookingId }) => {
    if (bookingId) {
      socket.leave(`booking:${bookingId}`);
    }
  });

  // Send a message
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

  // Typing indicator
  socket.on('chat:typing', ({ bookingId }) => {
    if (bookingId) {
      socket.to(`booking:${bookingId}`).emit('chat:typing', {
        bookingId,
        userName: socket.user.name,
        userId: socket.user._id,
      });
    }
  });

  // Read receipts
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
        // Assuming all messages in a batch from chat:read come from the other user
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
};

module.exports = registerChatHandlers;
