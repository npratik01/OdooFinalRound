'use strict';

const responseHelper = require('./responseHelper');

module.exports = {
  sendSuccess: (res, payload = {}) => {
    // Adapter to match previous call signatures while conforming to Step 12 contract.
    const data = payload.data !== undefined ? payload.data : payload;
    const message = payload.message || 'Operation successful';
    const statusCode = payload.statusCode || 200;
    // Special handle if data is just the wrapper
    const actualData = (data && data.data !== undefined && data.meta === undefined) ? data.data : data;
    return responseHelper.sendSuccess(res, actualData, message, statusCode);
  },
  sendCreated: (res, payload = {}) => {
    const data = payload.data !== undefined ? payload.data : payload;
    const message = payload.message || 'Resource created successfully';
    return responseHelper.sendCreated(res, data, message);
  },
  sendError: (res, payload = {}) => {
    const errors = payload.errors !== undefined ? payload.errors : [];
    const message = payload.message || 'Operation failed';
    const statusCode = payload.statusCode || 500;
    return responseHelper.sendError(res, errors, message, statusCode);
  },
  sendNotFound: (res, message = 'Resource not found') => {
    return responseHelper.sendNotFound(res, message);
  },
  sendUnauthorized: (res, message = 'Unauthorized') => {
    return responseHelper.sendUnauthorized(res, message);
  },
  sendForbidden: (res, message = 'Access denied. Insufficient permissions.') => {
    return responseHelper.sendForbidden(res, message);
  },
  sendBadRequest: (res, message = 'Bad request', errors = []) => {
    return responseHelper.sendBadRequest(res, message, errors);
  }
};
