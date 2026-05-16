/**
 * Registers booking-related socket event handlers.
 * Each authenticated user auto-joins a personal room `user:{userId}` for targeted notifications.
 */
const registerBookingHandlers = (io, socket) => {
  // Auto-join personal notification room
  const personalRoom = `user:${socket.user._id}`;
  socket.join(personalRoom);
};

/**
 * Emits a booking status update to both the customer and plumber.
 * Called from the REST bookingController after a status change.
 */
const emitBookingStatusUpdate = (io, booking) => {
  if (!io || !booking) return;

  const payload = {
    bookingId: booking._id,
    status: booking.status,
    updatedAt: booking.updatedAt || new Date(),
    customerId: booking.customerId?._id || booking.customerId,
    plumberId: booking.plumberId?._id || booking.plumberId,
  };

  // Emit to both parties' personal rooms
  const customerRoom = `user:${payload.customerId}`;
  const plumberRoom = `user:${payload.plumberId}`;

  io.to(customerRoom).to(plumberRoom).emit('booking:statusUpdate', payload);
};

/**
 * Emits a new booking notification to the assigned plumber.
 * Called from the REST bookingController after booking creation.
 */
const emitNewBooking = (io, booking) => {
  if (!io || !booking) return;

  const plumberId = booking.plumberId?._id || booking.plumberId;
  const plumberRoom = `user:${plumberId}`;

  io.to(plumberRoom).emit('booking:new', {
    bookingId: booking._id,
    customerName: booking.customerId?.name || 'Customer',
    serviceType: booking.serviceType,
    date: booking.date,
    time: booking.time,
    address: booking.address,
    status: booking.status,
    createdAt: booking.createdAt,
  });
};

module.exports = {
  registerBookingHandlers,
  emitBookingStatusUpdate,
  emitNewBooking,
};
