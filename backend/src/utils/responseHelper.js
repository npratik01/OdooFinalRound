'use strict';

/**
 * Standardized API response helper as per Step 12.
 */
const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data || {}
  });
};

const sendCreated = (res, data = {}, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, errors = [], message = 'Operation failed', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

const sendBadRequest = (res, message = 'Bad request', errors = []) => {
  return sendError(res, errors, message, 400);
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, [], message, 401);
};

const sendForbidden = (res, message = 'Access denied. Insufficient privileges.') => {
  return sendError(res, [], message, 403);
};

const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, [], message, 404);
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
