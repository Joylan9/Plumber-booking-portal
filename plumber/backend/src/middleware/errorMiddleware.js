const { normalizeError } = require('../utils/httpError');

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
};

const errorHandler = (error, req, res, next) => {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || res.statusCode || 500;

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error(normalizedError);
  }

  res.status(statusCode).json({
    success: false,
    message: normalizedError.message,
    ...(normalizedError.field ? { field: normalizedError.field } : {}),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
