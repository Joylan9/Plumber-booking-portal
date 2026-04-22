const createHttpError = (statusCode, message, field) => {
  const error = new Error(message);
  error.statusCode = statusCode;

  if (field) {
    error.field = field;
  }

  return error;
};

const hasMessageFragment = (error, fragment) => (
  typeof error?.message === 'string'
  && error.message.toLowerCase().includes(fragment)
);

const isDatabaseUnavailableError = (error) => {
  const transientDatabaseErrors = new Set([
    'MongooseServerSelectionError',
    'MongoServerSelectionError',
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoTimeoutError',
  ]);

  return transientDatabaseErrors.has(error?.name)
    || hasMessageFragment(error, 'econnrefused')
    || hasMessageFragment(error, 'server selection timed out')
    || hasMessageFragment(error, 'buffering timed out')
    || hasMessageFragment(error, 'topology was destroyed')
    || hasMessageFragment(error, 'connection closed unexpectedly');
};

const isEmailTransportError = (error) => (
  hasMessageFragment(error, 'econnrefused')
  || hasMessageFragment(error, 'enotfound')
  || hasMessageFragment(error, 'connection timeout')
  || hasMessageFragment(error, 'greeting never received')
);

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

  if (isDatabaseUnavailableError(error)) {
    return createHttpError(503, 'Database service is temporarily unavailable. Please try again in a moment.');
  }

  if (error.customContext === 'email' && isEmailTransportError(error)) {
    return createHttpError(503, 'Email service is temporarily unavailable. Please try again later.');
  }

  if (error.customContext === 'email') {
    return createHttpError(500, 'Email could not be dispatched. Please contact support.');
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
