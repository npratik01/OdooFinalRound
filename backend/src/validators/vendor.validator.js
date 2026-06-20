'use strict';

const Joi = require('joi');

const createVendorSchema = Joi.object({
  vendorName: Joi.string().trim().min(2).max(200).required().messages({
    'string.min': 'Vendor name must be at least 2 characters',
    'string.max': 'Vendor name cannot exceed 200 characters',
    'any.required': 'Vendor name is required',
  }),
  contactPerson: Joi.string().trim().max(100).allow('').optional(),
  email: Joi.string().trim().email().allow('').optional().messages({
    'string.email': 'Please provide a valid email address',
  }),
  phone: Joi.string().trim().max(20).allow('').optional(),
  gstNumber: Joi.string().trim().max(20).allow('').optional(),
  address: Joi.string().trim().max(500).allow('').optional(),
  city: Joi.string().trim().max(100).allow('').optional(),
  state: Joi.string().trim().max(100).allow('').optional(),
  country: Joi.string().trim().max(100).allow('').optional().default('India'),
  pincode: Joi.string().trim().max(10).allow('').optional(),
  paymentTerms: Joi.string().trim().max(100).allow('').optional().default('Net 30'),
  leadTimeDays: Joi.number().integer().min(0).optional().default(7).messages({
    'number.min': 'Lead time cannot be negative',
  }),
  rating: Joi.number().min(1).max(5).optional().default(3).messages({
    'number.min': 'Rating must be between 1 and 5',
    'number.max': 'Rating must be between 1 and 5',
  }),
});

const updateVendorSchema = Joi.object({
  vendorName:    Joi.string().trim().min(2).max(200).optional(),
  contactPerson: Joi.string().trim().max(100).allow('').optional(),
  email:         Joi.string().trim().email().allow('').optional(),
  phone:         Joi.string().trim().max(20).allow('').optional(),
  gstNumber:     Joi.string().trim().max(20).allow('').optional(),
  address:       Joi.string().trim().max(500).allow('').optional(),
  city:          Joi.string().trim().max(100).allow('').optional(),
  state:         Joi.string().trim().max(100).allow('').optional(),
  country:       Joi.string().trim().max(100).allow('').optional(),
  pincode:       Joi.string().trim().max(10).allow('').optional(),
  paymentTerms:  Joi.string().trim().max(100).allow('').optional(),
  leadTimeDays:  Joi.number().integer().min(0).optional(),
  rating:        Joi.number().min(1).max(5).optional(),
}).min(1);

module.exports = { createVendorSchema, updateVendorSchema };
