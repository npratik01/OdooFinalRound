'use strict';

const Joi = require('joi');

const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Must be a valid 24-character hexadecimal ID',
});

const poItemSchema = Joi.object({
  productId: objectIdSchema.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'number.integer': 'Quantity must be a whole number',
    'any.required': 'Quantity is required',
  }),
  unitCost: Joi.number().min(0).required().messages({
    'number.min': 'Unit cost cannot be negative',
    'any.required': 'Unit cost is required',
  }),
});

const createPurchaseOrderSchema = Joi.object({
  vendorId: objectIdSchema.required().messages({
    'any.required': 'Vendor ID is required',
  }),
  orderDate: Joi.date().iso().optional(),
  expectedDeliveryDate: Joi.date().iso().allow(null).optional(),
  items: Joi.array()
    .items(poItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Purchase Order must contain at least one item',
      'any.required': 'Items list is required',
    }),
  remarks: Joi.string().trim().max(1000).allow('').optional(),
});

const updatePurchaseOrderSchema = Joi.object({
  vendorId: objectIdSchema.optional(),
  orderDate: Joi.date().iso().optional(),
  expectedDeliveryDate: Joi.date().iso().allow(null).optional(),
  items: Joi.array().items(poItemSchema).min(1).optional(),
  remarks: Joi.string().trim().max(1000).allow('').optional(),
}).min(1);

const goodsReceiptItemSchema = Joi.object({
  productId: objectIdSchema.required().messages({
    'any.required': 'Product ID is required',
  }),
  quantityReceived: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity received must be at least 1',
    'number.integer': 'Quantity received must be a whole number',
    'any.required': 'Quantity received is required',
  }),
  remarks: Joi.string().trim().allow('').optional(),
});

const goodsReceiptSchema = Joi.object({
  items: Joi.array()
    .items(goodsReceiptItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Goods Receipt must contain at least one item',
      'any.required': 'Items are required',
    }),
  receiptDate: Joi.date().iso().optional(),
  remarks: Joi.string().trim().max(1000).allow('').optional(),
});

module.exports = {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  goodsReceiptSchema,
};
