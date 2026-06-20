'use strict';

const workCenterService = require('../services/workCenter.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Create Work Center ───────────────────────────────────────────────────────
const createWorkCenter = async (req, res) => {
  try {
    const wc = await workCenterService.createWorkCenter(req.body, req.user._id);
    return sendCreated(res, { data: wc, message: `Work Center created: ${wc.code}` });
  } catch (err) {
    logger.error('createWorkCenter error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to create Work Center' });
  }
};

// ─── Get All Work Centers ─────────────────────────────────────────────────────
const getWorkCenters = async (req, res) => {
  try {
    const result = await workCenterService.getAllWorkCenters(req.query);
    return sendSuccess(res, { data: result, message: 'Work Centers retrieved successfully' });
  } catch (err) {
    logger.error('getWorkCenters error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Work Centers' });
  }
};

// ─── Get Work Center By ID ────────────────────────────────────────────────────
const getWorkCenterById = async (req, res) => {
  try {
    const wc = await workCenterService.getWorkCenterById(req.params.id);
    return sendSuccess(res, { data: wc, message: 'Work Center retrieved successfully' });
  } catch (err) {
    logger.error('getWorkCenterById error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Work Center' });
  }
};

// ─── Update Work Center ───────────────────────────────────────────────────────
const updateWorkCenter = async (req, res) => {
  try {
    const wc = await workCenterService.updateWorkCenter(req.params.id, req.body);
    return sendSuccess(res, { data: wc, message: 'Work Center updated successfully' });
  } catch (err) {
    logger.error('updateWorkCenter error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update Work Center' });
  }
};

// ─── Toggle Work Center Active Status ──────────────────────────────────────────
const toggleWorkCenterActive = async (req, res) => {
  try {
    const wc = await workCenterService.toggleWorkCenterActive(req.params.id);
    return sendSuccess(res, { data: wc, message: `Work Center status updated: ${wc.isActive ? 'Active' : 'Inactive'}` });
  } catch (err) {
    logger.error('toggleWorkCenterActive error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update Work Center status' });
  }
};

module.exports = {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterActive,
};
