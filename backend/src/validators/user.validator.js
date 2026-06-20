'use strict';

const Joi = require('joi');
const { ROLE_LIST } = require('../constants/roles');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
      'any.required': 'Password is required',
    }),
  role: Joi.string()
    .valid(...ROLE_LIST)
    .required()
    .messages({
      'any.only': `Role must be one of: ${ROLE_LIST.join(', ')}`,
      'any.required': 'Role is required',
    }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
  }),
  role: Joi.string()
    .valid(...ROLE_LIST)
    .messages({
      'any.only': `Role must be one of: ${ROLE_LIST.join(', ')}`,
    }),
  isActive: Joi.boolean(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .optional()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain uppercase, lowercase, digit, and special character',
    }),
}).min(1);

module.exports = { createUserSchema, updateUserSchema };
