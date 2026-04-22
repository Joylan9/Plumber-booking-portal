const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const AUTH_USER_SELECT = '_id name email role phone area profileImage bio experience hourlyRate services availability rating totalReviews';

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return next(createHttpError(401, 'Not authorized, no token'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select(AUTH_USER_SELECT);

    if (!req.user) {
      return next(createHttpError(401, 'Not authorized, user not found'));
    }

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Not authorized, token expired'));
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return next(createHttpError(401, 'Not authorized, token invalid'));
    }

    return next(error);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createHttpError(
        403,
        `Role (${req.user ? req.user.role : 'unknown'}) is not authorized to access this route`
      ));
    }
    return next();
  };
};

module.exports = {
  protectRoute,
  protect: protectRoute,
  authorizeRoles,
};
