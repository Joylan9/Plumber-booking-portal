import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000;

/**
 * Singleton Socket.io client manager.
 * Lazy-connects on first authenticated access.
 */
const socketService = {
  /**
   * Connect to the Socket.io server with JWT auth.
   */
  connect(token) {
    if (socket?.connected) return socket;

    // Disconnect any stale instance
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socket.on('connect', () => {
      reconnectAttempts = 0;
      if (import.meta.env.DEV) {
        console.log('[Socket] Connected:', socket.id);
      }
    });

    socket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        console.log('[Socket] Disconnected:', reason);
      }
    });

    socket.on('connect_error', (err) => {
      reconnectAttempts++;
      if (import.meta.env.DEV) {
        console.warn(`[Socket] Connection error (attempt ${reconnectAttempts}):`, err.message);
      }
    });

    return socket;
  },

  /**
   * Disconnect and clean up.
   */
  disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      reconnectAttempts = 0;
    }
  },

  /**
   * Get the current socket instance (may be null).
   */
  getSocket() {
    return socket;
  },

  /**
   * Check if connected.
   */
  isConnected() {
    return socket?.connected ?? false;
  },

  /**
   * Emit an event.
   */
  emit(event, data) {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  },

  /**
   * Listen for an event.
   */
  on(event, callback) {
    if (socket) {
      socket.on(event, callback);
    }
  },

  /**
   * Remove a specific event listener.
   */
  off(event, callback) {
    if (socket) {
      socket.off(event, callback);
    }
  },
};

export default socketService;
