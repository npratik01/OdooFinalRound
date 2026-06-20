'use strict';

const { sendBadRequest } = require('../utils/apiResponse');

/**
 * Middleware factory for Joi schema validation.
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} target - Which part of the request to validate
 */
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const data = req[target];

    const { error, value } = schema.validate(data, {
      abortEarly: false,     // Return all errors at once
      allowUnknown: false,   // Reject unknown fields
      stripUnknown: true,    // Remove unknown fields from output
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return sendBadRequest(res, 'Validation failed', errors);
    }

    // Replace request data with sanitized/coerced value
    req[target] = value;
    next();
  };
};

module.exports = { validate };
