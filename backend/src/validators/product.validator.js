'use strict';

const Joi = require('joi');
const { PRODUCT_TYPES, PROCUREMENT_STRATEGY, PROCUREMENT_TYPE } = require('../constants/stockStatus');

const createProductSchema = Joi.object({
  productName: Joi.string().trim().min(2).max(200).required().messages({
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().trim().max(1000).allow('').optional(),
  salesPrice: Joi.number().min(0).default(0),
  costPrice: Joi.number().min(0).default(0),
  productType: Joi.string().valid(...Object.values(PRODUCT_TYPES)).required().messages({
    'any.only': `Product type must be one of: ${Object.values(PRODUCT_TYPES).join(', ')}`,
    'any.required': 'Product type is required',
  }),
  procurementStrategy: Joi.string().valid(...Object.values(PROCUREMENT_STRATEGY)).required().messages({
    'any.only': `Procurement strategy must be one of: ${Object.values(PROCUREMENT_STRATEGY).join(', ')}`,
    'any.required': 'Procurement strategy is required',
  }),
  procurementType: Joi.string().valid(...Object.values(PROCUREMENT_TYPE)).required().messages({
    'any.only': `Procurement type must be one of: ${Object.values(PROCUREMENT_TYPE).join(', ')}`,
    'any.required': 'Procurement type is required',
  }),
  vendor: Joi.string().trim().max(200).allow('').optional(),
});

const updateProductSchema = Joi.object({
  productName: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().max(1000).allow(''),
  salesPrice: Joi.number().min(0),
  costPrice: Joi.number().min(0),
  productType: Joi.string().valid(...Object.values(PRODUCT_TYPES)),
  procurementStrategy: Joi.string().valid(...Object.values(PROCUREMENT_STRATEGY)),
  procurementType: Joi.string().valid(...Object.values(PROCUREMENT_TYPE)),
  vendor: Joi.string().trim().max(200).allow(''),
  isActive: Joi.boolean(),
}).min(1);

const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(200).allow('').optional(),
  sku: Joi.string().trim().max(50).allow('').optional(),           // NEW: SKU-specific search
  productType: Joi.string().valid(...Object.values(PRODUCT_TYPES)).optional(),
  procurementStrategy: Joi.string().valid(...Object.values(PROCUREMENT_STRATEGY)).optional(),
  procurementType: Joi.string().valid(...Object.values(PROCUREMENT_TYPE)).optional(), // NEW
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid('productName', 'sku', 'createdAt', 'salesPrice', 'costPrice', 'updatedAt')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createProductSchema, updateProductSchema, productQuerySchema };
