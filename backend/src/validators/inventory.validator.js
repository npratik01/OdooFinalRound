'use strict';

const Joi = require('joi');

const adjustInventorySchema = Joi.object({
  onHandQty: Joi.number().integer().min(0).optional().messages({
    'number.min': 'On-hand quantity cannot be negative',
    'number.integer': 'Quantity must be a whole number',
  }),
  reservedQty: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Reserved quantity cannot be negative',
    'number.integer': 'Quantity must be a whole number',
  }),
  minimumStockLevel: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Minimum stock level cannot be negative',
    'number.integer': 'Stock level must be a whole number',
  }),
}).min(1).messages({
  'object.min': 'At least one field (onHandQty, reservedQty, or minimumStockLevel) must be provided',
});

module.exports = { adjustInventorySchema };
