const INTERNAL_MESSAGE_FRAGMENTS = [
  'econnrefused',
  'enotfound',
  'buffering timed out',
  'server selection timed out',
  'mongo',
  'stack',
  'unexpected token <',
];

const hasInternalMessage = (message = '') => {
  const normalizedMessage = String(message).toLowerCase();
  return INTERNAL_MESSAGE_FRAGMENTS.some((fragment) => normalizedMessage.includes(fragment));
};

const getFallbackMessage = (statusCode, field) => {
  if (statusCode === 400) return 'Please review the highlighted information and try again.';
  if (statusCode === 401) return 'Invalid email or password.';
  if (statusCode === 403) return 'You do not have permission to perform this action.';
  if (statusCode === 404) return 'The requested resource was not found.';
  if (statusCode === 409 && field === 'email') {
    return 'An account with this email already exists. Try logging in or resetting your password.';
  }
  if (statusCode === 409) return 'This action conflicts with existing data.';
  if (statusCode === 503) return 'The service is temporarily unavailable. Please try again in a moment.';
  if (statusCode >= 500) return 'Something went wrong on the server. Please try again.';
  return 'Something went wrong. Please try again.';
};

export const normalizeApiError = (error) => {
  const statusCode = error?.response?.status || error?.statusCode || null;
  const responseData = error?.response?.data || error?.data || {};
  const field = responseData?.field || error?.field || null;
  const backendMessage = typeof responseData?.message === 'string'
    ? responseData.message.trim()
    : '';

  if (!error?.response) {
    return {
      statusCode: null,
      field: null,
      message: 'Unable to reach the server. Make sure the backend is running on http://localhost:5000.',
      raw: error,
    };
  }

  let message = backendMessage || getFallbackMessage(statusCode, field);

  if (!backendMessage || statusCode >= 500 || hasInternalMessage(backendMessage)) {
    message = getFallbackMessage(statusCode, field);
  }

  return {
    statusCode,
    field,
    message,
    raw: error,
  };
};

