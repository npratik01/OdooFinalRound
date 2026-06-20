'use strict';

const Joi = require('joi');

// Mongoose ObjectId helper validation
const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
  'string.pattern.base': 'Must be a valid 24-character hexadecimal ID'
});

const createSalesOrderSchema = Joi.object({
  customerId: objectIdSchema.required().messages({
    'any.required': 'Customer ID is required'
  }),
  orderDate: Joi.date().iso().optional(),
  remarks: Joi.string().trim().allow('').optional(),
  items: Joi.array().items(
    Joi.object({
      productId: objectIdSchema.required().messages({
        'any.required': 'Product ID is required'
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity must be at least 1',
        'number.integer': 'Quantity must be a whole number',
        'any.required': 'Quantity is required'
      }),
      unitPrice: Joi.number().min(0).required().messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required'
      })
    })
  ).min(1).required().messages({
    'array.min': 'Sales Order must contain at least one item',
    'any.required': 'Items list is required'
  })
});

const updateSalesOrderSchema = Joi.object({
  customerId: objectIdSchema.optional(),
  orderDate: Joi.date().iso().optional(),
  remarks: Joi.string().trim().allow('').optional(),
  items: Joi.array().items(
    Joi.object({
      productId: objectIdSchema.required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).required()
    })
  ).min(1).optional()
}).min(1);

const processDeliverySchema = Joi.object({
  soId: objectIdSchema.required().messages({
    'any.required': 'Sales Order ID is required'
  }),
  items: Joi.array().items(
    Joi.object({
      productId: objectIdSchema.required().messages({
        'any.required': 'Product ID is required'
      }),
      quantityShipped: Joi.number().integer().min(1).required().messages({
        'number.min': 'Quantity shipped must be at least 1',
        'any.required': 'Quantity shipped is required'
      })
    })
  ).min(1).required().messages({
    'array.min': 'Delivery must contain at least one item',
    'any.required': 'Items are required'
  })
});

module.exports = {
  createSalesOrderSchema,
  updateSalesOrderSchema,
  processDeliverySchema
};
