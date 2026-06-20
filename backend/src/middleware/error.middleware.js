'use strict';

const errorMiddleware = require('./errorMiddleware');

module.exports = {
  errorHandler: errorMiddleware.errorHandler,
  notFoundHandler: errorMiddleware.notFoundHandler,
};
