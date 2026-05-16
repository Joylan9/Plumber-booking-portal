const { Server } = require('socket.io');
const socketAuthMiddleware = require('./authMiddleware');
const registerChatHandlers = require('./chatHandler');
const { registerBookingHandlers } = require('./bookingHandler');
const { registerPresenceHandlers } = require('./presenceHandler');

let io = null;

/**
 * Initializes the Socket.io server attached to the existing HTTP server.
 * Configures CORS, auth middleware, and mounts all event handlers.
 */
const initializeSocket = (httpServer, allowedOrigins = []) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // Apply JWT authentication middleware
  io.use(socketAuthMiddleware);

  // Handle new connections
  io.on('connection', (socket) => {
    const { _id, name, role } = socket.user;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Socket.io] Connected: ${name} (${role}) — ${socket.id}`);
    }

    // Register all event handler groups
    registerChatHandlers(io, socket);
    registerBookingHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    // Handle disconnection logging
    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Socket.io] Disconnected: ${name} (${role}) — ${reason}`);
      }
    });
  });

  console.log('[Socket.io] Server initialized');
  return io;
};

/**
 * Returns the active Socket.io instance.
 * Used by REST controllers to emit events.
 */
const getIO = () => {
  if (!io) {
    console.warn('[Socket.io] getIO called before initialization');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
