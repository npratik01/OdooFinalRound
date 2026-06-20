'use strict';

const Joi = require('joi');
const { sendBadRequest } = require('../utils/apiResponse');

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(1).required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
  role: Joi.string().valid(
    'admin',
    'business_owner',
    'sales_user',
    'purchase_user',
    'manufacturing_user',
    'inventory_manager'
  ).required().messages({
    'any.required': 'Role is required',
    'any.only': 'Invalid role',
  }),
});

/**
 * Middleware: validate login request body against loginSchema
 */
function loginValidation(req, res, next) {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
    return sendBadRequest(res, 'Validation failed', errors);
  }
  req.body = value;
  next();
}

/**
 * Middleware: validate register request body against registerSchema
 */
function registerValidation(req, res, next) {
  const { error, value } = registerSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
    return sendBadRequest(res, 'Validation failed', errors);
  }
  req.body = value;
  next();
}

module.exports = { loginValidation, registerValidation, loginSchema, registerSchema };
