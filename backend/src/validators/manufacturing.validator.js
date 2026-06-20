'use strict';

const Joi = require('joi');

// ─── Bill of Materials Validators ─────────────────────────────────────────────

const bomComponentSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Component productId must be a valid MongoDB ObjectId',
    'any.required': 'Component productId is required',
  }),
  quantity: Joi.number().min(0.001).required().messages({
    'number.min': 'Component quantity must be greater than 0',
    'any.required': 'Component quantity is required',
  }),
  uom: Joi.string().max(50).optional().default('units'),
});

const createBomSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    'any.required': 'productId (finished product) is required',
  }),
  quantity: Joi.number().min(1).optional().default(1),
  version: Joi.number().min(1).optional().default(1),
  description: Joi.string().max(500).optional().allow('').default(''),
  components: Joi.array().items(bomComponentSchema).min(1).required().messages({
    'array.min': 'BoM must have at least one component',
    'any.required': 'components are required',
  }),
  isActive: Joi.boolean().optional().default(true),
});

const updateBomSchema = Joi.object({
  quantity: Joi.number().min(1).optional(),
  description: Joi.string().max(500).optional().allow(''),
  components: Joi.array().items(bomComponentSchema).min(1).optional(),
}).min(1);

// ─── Work Center Validators ───────────────────────────────────────────────────

const createWorkCenterSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'any.required': 'Work center name is required',
  }),
  description: Joi.string().max(500).optional().allow('').default(''),
  capacity: Joi.number().min(0).optional().default(0),
  costPerHour: Joi.number().min(0).optional().default(0),
  isActive: Joi.boolean().optional().default(true),
});

const updateWorkCenterSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(500).optional().allow(''),
  capacity: Joi.number().min(0).optional(),
  costPerHour: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

// ─── Manufacturing Order Validators ───────────────────────────────────────────

const createManufacturingOrderSchema = Joi.object({
  bomId: Joi.string().hex().length(24).required().messages({
    'any.required': 'bomId (Bill of Materials) is required',
  }),
  plannedQty: Joi.number().min(1).required().messages({
    'number.min': 'Planned quantity must be at least 1',
    'any.required': 'plannedQty is required',
  }),
  workCenterId: Joi.string().hex().length(24).optional().allow(null, ''),
  scheduledDate: Joi.date().optional().allow(null),
  remarks: Joi.string().max(1000).optional().allow('').default(''),
});

const updateManufacturingOrderSchema = Joi.object({
  plannedQty: Joi.number().min(1).optional(),
  workCenterId: Joi.string().hex().length(24).optional().allow(null, ''),
  scheduledDate: Joi.date().optional().allow(null),
  remarks: Joi.string().max(1000).optional().allow(''),
}).min(1);

const produceOutputSchema = Joi.object({
  producedQty: Joi.number().min(1).required().messages({
    'number.min': 'Produced quantity must be at least 1',
    'any.required': 'producedQty is required',
  }),
  remarks: Joi.string().max(500).optional().allow(''),
});

module.exports = {
  createBomSchema,
  updateBomSchema,
  createWorkCenterSchema,
  updateWorkCenterSchema,
  createManufacturingOrderSchema,
  updateManufacturingOrderSchema,
  produceOutputSchema,
};
