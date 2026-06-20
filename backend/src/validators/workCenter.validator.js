'use strict';

const Joi = require('joi');

const createWorkCenterSchema = Joi.object({
  workCenterName:       Joi.string().min(2).max(100).required(),
  description:          Joi.string().max(500).optional().allow(''),
  capacityPerDay:       Joi.number().positive().optional(),
  efficiencyPercentage: Joi.number().min(1).max(100).optional(),
});

const updateWorkCenterSchema = Joi.object({
  workCenterName:       Joi.string().min(2).max(100).optional(),
  description:          Joi.string().max(500).optional().allow(''),
  capacityPerDay:       Joi.number().positive().optional(),
  efficiencyPercentage: Joi.number().min(1).max(100).optional(),
}).min(1);

const createOperationSchema = Joi.object({
  operationName:          Joi.string().min(2).max(100).required(),
  description:            Joi.string().max(500).optional().allow(''),
  standardDurationMinutes:Joi.number().integer().positive().optional(),
  workCenterId:           Joi.string().hex().length(24).required(),
  sequence:               Joi.number().integer().min(1).optional(),
});

const updateOperationSchema = Joi.object({
  operationName:          Joi.string().min(2).max(100).optional(),
  description:            Joi.string().max(500).optional().allow(''),
  standardDurationMinutes:Joi.number().integer().positive().optional(),
  workCenterId:           Joi.string().hex().length(24).optional(),
  sequence:               Joi.number().integer().min(1).optional(),
  isActive:               Joi.boolean().optional(),
}).min(1);

module.exports = {
  createWorkCenterSchema,
  updateWorkCenterSchema,
  createOperationSchema,
  updateOperationSchema,
};
