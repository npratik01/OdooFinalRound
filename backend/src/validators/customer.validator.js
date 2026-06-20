'use strict';

const Joi = require('joi');

const createCustomerSchema = Joi.object({
  customerName: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Customer name cannot be empty',
    'string.min': 'Customer name must be at least 2 characters',
    'any.required': 'Customer name is required'
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  phone: Joi.string().trim().min(7).max(15).required().messages({
    'string.empty': 'Phone number cannot be empty',
    'string.min': 'Phone number must be at least 7 digits',
    'any.required': 'Phone number is required'
  }),
  gstNumber: Joi.string().trim().allow('').optional().messages({
    'string.max': 'GST number cannot exceed 15 characters'
  }),
  address: Joi.string().trim().required().messages({
    'any.required': 'Address is required'
  }),
  city: Joi.string().trim().required().messages({
    'any.required': 'City is required'
  }),
  state: Joi.string().trim().required().messages({
    'any.required': 'State is required'
  }),
  country: Joi.string().trim().required().messages({
    'any.required': 'Country is required'
  }),
  pincode: Joi.string().trim().min(4).max(10).required().messages({
    'any.required': 'Pincode is required'
  })
});

const updateCustomerSchema = Joi.object({
  customerName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().optional(),
  phone: Joi.string().trim().min(7).max(15).optional(),
  gstNumber: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().optional(),
  city: Joi.string().trim().optional(),
  state: Joi.string().trim().optional(),
  country: Joi.string().trim().optional(),
  pincode: Joi.string().trim().min(4).max(10).optional(),
  isActive: Joi.boolean().optional()
}).min(1);

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};
