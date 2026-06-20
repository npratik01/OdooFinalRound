'use strict';

const bomService = require('../services/bom.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Create BoM ───────────────────────────────────────────────────────────────
const createBom = async (req, res) => {
  try {
    const bom = await bomService.createBom(req.body, req.user.userId);
    return sendCreated(res, { data: bom, message: `Bill of Materials created: ${bom.bomCode}` });
  } catch (err) {
    logger.error('createBom error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to create Bill of Materials' });
  }
};

// ─── Get All BoMs ─────────────────────────────────────────────────────────────
const getBoms = async (req, res) => {
  try {
    const result = await bomService.getAllBoms(req.query);
    return sendSuccess(res, { data: result, message: 'Bills of Materials retrieved successfully' });
  } catch (err) {
    logger.error('getBoms error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Bills of Materials' });
  }
};

// ─── Get BoM By ID ────────────────────────────────────────────────────────────
const getBomById = async (req, res) => {
  try {
    const bom = await bomService.getBomById(req.params.id);
    return sendSuccess(res, { data: bom, message: 'Bill of Materials retrieved successfully' });
  } catch (err) {
    logger.error('getBomById error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Bill of Materials' });
  }
};

// ─── Get BoM By Product ───────────────────────────────────────────────────────
const getBomByProduct = async (req, res) => {
  try {
    const bom = await bomService.getBomByProduct(req.params.productId);
    return sendSuccess(res, { data: bom, message: 'Bill of Materials for product retrieved successfully' });
  } catch (err) {
    logger.error('getBomByProduct error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Bill of Materials for product' });
  }
};

// ─── Update BoM ───────────────────────────────────────────────────────────────
const updateBom = async (req, res) => {
  try {
    const bom = await bomService.updateBom(req.params.id, req.body);
    return sendSuccess(res, { data: bom, message: 'Bill of Materials updated successfully' });
  } catch (err) {
    logger.error('updateBom error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update Bill of Materials' });
  }
};

// ─── Deactivate BoM ───────────────────────────────────────────────────────────
const deactivateBom = async (req, res) => {
  try {
    const bom = await bomService.deactivateBom(req.params.id);
    return sendSuccess(res, { data: bom, message: 'Bill of Materials deactivated successfully' });
  } catch (err) {
    logger.error('deactivateBom error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to deactivate Bill of Materials' });
  }
};

module.exports = {
  createBom,
  getBoms,
  getBomById,
  getBomByProduct,
  updateBom,
  deactivateBom,
};
