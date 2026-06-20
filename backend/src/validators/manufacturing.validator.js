'use strict';

const Joi = require('joi');

const createMOSchema = Joi.object({
  productId:        Joi.string().hex().length(24).required(),
  bomId:            Joi.string().hex().length(24).required(),
  quantityToProduce:Joi.number().integer().min(1).required(),
  plannedStartDate: Joi.date().optional().allow(null),
  plannedEndDate:   Joi.date().optional().allow(null),
  assignedTo:       Joi.string().hex().length(24).optional().allow(null),
  remarks:          Joi.string().max(500).optional().allow(''),
});

const updateMOSchema = Joi.object({
  quantityToProduce:Joi.number().integer().min(1).optional(),
  plannedStartDate: Joi.date().optional().allow(null),
  plannedEndDate:   Joi.date().optional().allow(null),
  assignedTo:       Joi.string().hex().length(24).optional().allow(null),
  remarks:          Joi.string().max(500).optional().allow(''),
}).min(1);

const completeMOSchema = Joi.object({
  quantityProduced: Joi.number().integer().min(1).optional(),
  remarks:          Joi.string().max(500).optional().allow(''),
});

const completeWOSchema = Joi.object({
  actualDurationMinutes: Joi.number().integer().min(0).optional(),
  remarks:               Joi.string().max(500).optional().allow(''),
});

module.exports = {
  createMOSchema,
  updateMOSchema,
  completeMOSchema,
  completeWOSchema,
};
