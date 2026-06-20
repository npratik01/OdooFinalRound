'use strict';

const Joi = require('joi');

const createBOMSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'string.empty': 'Product is required',
  }),
  version:     Joi.string().max(20).optional(),
  description: Joi.string().max(500).optional().allow(''),
  components: Joi.array().items(
    Joi.object({
      productId:        Joi.string().hex().length(24).required(),
      quantityRequired: Joi.number().positive().required(),
      unit:             Joi.string().max(30).optional(),
    })
  ).optional(),
  operations: Joi.array().items(
    Joi.object({
      operationId: Joi.string().hex().length(24).required(),
      sequence:    Joi.number().integer().min(1).required(),
    })
  ).optional(),
});

const updateBOMSchema = Joi.object({
  productId:   Joi.string().hex().length(24).optional(),
  version:     Joi.string().max(20).optional(),
  description: Joi.string().max(500).optional().allow(''),
  components: Joi.array().items(
    Joi.object({
      productId:        Joi.string().hex().length(24).required(),
      quantityRequired: Joi.number().positive().required(),
      unit:             Joi.string().max(30).optional(),
    })
  ).optional(),
  operations: Joi.array().items(
    Joi.object({
      operationId: Joi.string().hex().length(24).required(),
      sequence:    Joi.number().integer().min(1).required(),
    })
  ).optional(),
}).min(1);

module.exports = { createBOMSchema, updateBOMSchema };
