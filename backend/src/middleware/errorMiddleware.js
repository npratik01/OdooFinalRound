'use strict';

const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHelper');

/**
 * Global error handler middleware conforming to Step 12.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errors = [{ field: err.path, message: `Invalid value: ${err.value}` }];
  }
  // Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'value';
    message = `A record with ${field} '${value}' already exists`;
    errors = [{ field, message: `Value '${value}' is already in use` }];
  }
  // Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Joi error handling if thrown directly
  if (err.isJoi) {
    statusCode = 400;
    message = err.message || 'Validation failed';
    errors = (err.details || []).map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
    }));
  }

  // Secure error message in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  return sendError(res, errors, message, statusCode);
};

/**
 * 404 Not Found handler for unmatched routes.
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, [], `Cannot ${req.method} ${req.originalUrl}`, 404);
};

module.exports = { errorHandler, notFoundHandler };
