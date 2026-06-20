'use strict';

const manufacturingService = require('../services/manufacturing.service');
const manufacturingDashboardService = require('../services/manufacturingDashboard.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Create Manufacturing Order ───────────────────────────────────────────────
const createManufacturingOrder = async (req, res) => {
  try {
    const mo = await manufacturingService.createManufacturingOrder(req.body, req.user.userId);
    return sendCreated(res, { data: mo, message: `Manufacturing Order created: ${mo.moNumber}` });
  } catch (err) {
    logger.error('createManufacturingOrder error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to create Manufacturing Order' });
  }
};

// ─── Get All Manufacturing Orders ─────────────────────────────────────────────
const getManufacturingOrders = async (req, res) => {
  try {
    const result = await manufacturingService.getAllManufacturingOrders(req.query);
    return sendSuccess(res, { data: result, message: 'Manufacturing Orders retrieved successfully' });
  } catch (err) {
    logger.error('getManufacturingOrders error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Manufacturing Orders' });
  }
};

// ─── Get Manufacturing Order By ID ────────────────────────────────────────────
const getManufacturingOrderById = async (req, res) => {
  try {
    const mo = await manufacturingService.getManufacturingOrderById(req.params.id);
    return sendSuccess(res, { data: mo, message: 'Manufacturing Order retrieved successfully' });
  } catch (err) {
    logger.error('getManufacturingOrderById error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Manufacturing Order' });
  }
};

// ─── Confirm Manufacturing Order ──────────────────────────────────────────────
const confirmManufacturingOrder = async (req, res) => {
  try {
    const mo = await manufacturingService.confirmManufacturingOrder(req.params.id);
    return sendSuccess(res, { data: mo, message: `Manufacturing Order confirmed: ${mo.moNumber}` });
  } catch (err) {
    logger.error('confirmManufacturingOrder error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to confirm Manufacturing Order' });
  }
};

// ─── Start Production ─────────────────────────────────────────────────────────
const startProduction = async (req, res) => {
  try {
    const mo = await manufacturingService.startProduction(req.params.id, req.user.userId);
    return sendSuccess(res, { data: mo, message: `Production started for Manufacturing Order: ${mo.moNumber}` });
  } catch (err) {
    logger.error('startProduction error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to start production' });
  }
};

// ─── Produce Output ───────────────────────────────────────────────────────────
const produceOutput = async (req, res) => {
  try {
    const mo = await manufacturingService.produceOutput(req.params.id, req.body, req.user.userId);
    return sendSuccess(res, { data: mo, message: `Production output recorded for Manufacturing Order: ${mo.moNumber}` });
  } catch (err) {
    logger.error('produceOutput error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to record production output' });
  }
};

// ─── Cancel Manufacturing Order ───────────────────────────────────────────────
const cancelManufacturingOrder = async (req, res) => {
  try {
    const mo = await manufacturingService.cancelManufacturingOrder(req.params.id, req.user.userId);
    return sendSuccess(res, { data: mo, message: `Manufacturing Order cancelled: ${mo.moNumber}` });
  } catch (err) {
    logger.error('cancelManufacturingOrder error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to cancel Manufacturing Order' });
  }
};

// ─── Get Manufacturing Dashboard Stats ────────────────────────────────────────
const getManufacturingDashboard = async (req, res) => {
  try {
    const stats = await manufacturingDashboardService.getDashboardStats();
    return sendSuccess(res, { data: stats, message: 'Manufacturing dashboard stats retrieved successfully' });
  } catch (err) {
    logger.error('getManufacturingDashboard error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve manufacturing dashboard stats' });
  }
};

module.exports = {
  createManufacturingOrder,
  getManufacturingOrders,
  getManufacturingOrderById,
  confirmManufacturingOrder,
  startProduction,
  produceOutput,
  cancelManufacturingOrder,
  getManufacturingDashboard,
};
