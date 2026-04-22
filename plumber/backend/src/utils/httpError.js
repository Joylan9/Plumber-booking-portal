const createHttpError = (statusCode, message, field) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (field) {
    error.field = field;
  }

  return error;
};

const normalizeError = (error) => {
  if (!error) {
    return createHttpError(500, 'Server Error');
  }

  if (error.type === 'entity.parse.failed') {
    return createHttpError(400, 'Invalid JSON payload');
  }

  if (error.name === 'TokenExpiredError') {
    return createHttpError(401, 'Not authorized, token expired');
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
    return createHttpError(401, 'Not authorized, token invalid');
  }

  if (error.name === 'ValidationError') {
    const firstField = Object.keys(error.errors || {})[0];
    const firstMessage = firstField
      ? error.errors[firstField].message
      : 'Validation failed';

    return createHttpError(400, firstMessage, firstField);
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
    let duplicateMessage = 'Duplicate value';

    if (duplicateField === 'bookingId') {
      duplicateMessage = 'You already reviewed this booking';
    } else if (duplicateField) {
      duplicateMessage = `${duplicateField.charAt(0).toUpperCase()}${duplicateField.slice(1)} already exists`;
    }

    return createHttpError(409, duplicateMessage, duplicateField);
  }

  if (error.name === 'CastError') {
    return createHttpError(400, `Invalid ${error.path}`, error.path);
  }

  if (typeof error.statusCode !== 'number') {
    error.statusCode = 500;
  }

  if (!error.message) {
    error.message = 'Server Error';
  }

  return error;
};

module.exports = {
  createHttpError,
  normalizeError,
};
