/**
 * Plumber presence/availability tracking.
 * Maintains an in-memory map of plumber online statuses.
 */

// In-memory presence store: Map<plumberId, { status, socketId, disconnectTimer }>
const presenceStore = new Map();

/**
 * Returns a plain object of all online/busy plumber statuses.
 */
const getOnlinePlumbers = () => {
  const result = {};
  for (const [plumberId, data] of presenceStore.entries()) {
    if (data.status !== 'offline') {
      result[plumberId] = data.status;
    }
  }
  return result;
};

/**
 * Registers presence event handlers on a socket connection.
 */
const registerPresenceHandlers = (io, socket) => {
  const userId = socket.user._id.toString();
  const isPlumber = socket.user.role === 'plumber';

  if (isPlumber) {
    // Clear any pending disconnect timer (reconnection scenario)
    const existing = presenceStore.get(userId);
    if (existing?.disconnectTimer) {
      clearTimeout(existing.disconnectTimer);
    }

    // Set plumber as online
    presenceStore.set(userId, { status: 'online', socketId: socket.id, disconnectTimer: null });

    // Broadcast to all connected clients
    io.emit('presence:update', { plumberId: userId, status: 'online' });
  }

  // Send current presence state to newly connected client
  socket.emit('presence:bulk', { plumbers: getOnlinePlumbers() });

  // Explicit status changes from plumber
  socket.on('presence:online', () => {
    if (!isPlumber) return;
    presenceStore.set(userId, { status: 'online', socketId: socket.id, disconnectTimer: null });
    io.emit('presence:update', { plumberId: userId, status: 'online' });
  });

  socket.on('presence:busy', () => {
    if (!isPlumber) return;
    const entry = presenceStore.get(userId) || {};
    presenceStore.set(userId, { ...entry, status: 'busy', socketId: socket.id });
    io.emit('presence:update', { plumberId: userId, status: 'busy' });
  });

  socket.on('presence:offline', () => {
    if (!isPlumber) return;
    presenceStore.delete(userId);
    io.emit('presence:update', { plumberId: userId, status: 'offline' });
  });

  // Handle disconnect with 30-second grace period for reconnection
  socket.on('disconnect', () => {
    if (!isPlumber) return;

    const entry = presenceStore.get(userId);
    if (!entry || entry.socketId !== socket.id) return;

    // Start grace period timer
    const timer = setTimeout(() => {
      const current = presenceStore.get(userId);
      // Only remove if the socketId hasn't been replaced by a reconnection
      if (current && current.socketId === socket.id) {
        presenceStore.delete(userId);
        io.emit('presence:update', { plumberId: userId, status: 'offline' });
      }
    }, 30000); // 30-second grace period

    presenceStore.set(userId, { ...entry, disconnectTimer: timer });
  });
};

module.exports = {
  registerPresenceHandlers,
  getOnlinePlumbers,
};
