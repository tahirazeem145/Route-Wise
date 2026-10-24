/**
 * Consistent API JSON response builders
 */
function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
    timestamp: new Date().toISOString()
  });
}

function errorResponse(res, code, message, statusCode = 400, details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV !== 'production') {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
