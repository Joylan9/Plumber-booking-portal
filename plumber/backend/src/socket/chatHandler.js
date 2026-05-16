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
        .select('senderId senderRole content readAt createdAt')
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
};

module.exports = registerChatHandlers;
