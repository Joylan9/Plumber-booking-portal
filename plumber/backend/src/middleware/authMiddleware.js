const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createHttpError } = require('../utils/httpError');

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return next(createHttpError(401, 'Not authorized, no token'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return next(createHttpError(401, 'Not authorized, user not found'));
    }

    return next();
  } catch (error) {
    return next(createHttpError(401, 'Not authorized, token failed'));
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

module.exports = { protectRoute, authorizeRoles };
