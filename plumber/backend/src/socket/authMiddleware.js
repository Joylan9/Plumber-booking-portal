const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SOCKET_USER_SELECT = '_id name email role';

/**
 * Socket.io authentication middleware.
 * Validates JWT from the handshake auth object and attaches the user to the socket.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(SOCKET_USER_SELECT).lean();

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket for downstream handlers
    socket.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    return next(new Error('Authentication error'));
  }
};

module.exports = socketAuthMiddleware;
