'use strict';

const wcService = require('../services/workCenter.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getWorkCenters = async (req, res) => {
  try {
    const result = await wcService.getAllWorkCenters(req.query);
    sendSuccess(res, 'Work Centers retrieved', result);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getWorkCenterById = async (req, res) => {
  try {
    const workCenter = await wcService.getWorkCenterById(req.params.id);
    sendSuccess(res, 'Work Center retrieved', { workCenter });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const createWorkCenter = async (req, res) => {
  try {
    const workCenter = await wcService.createWorkCenter(req.body);
    sendSuccess(res, 'Work Center created', { workCenter }, 201);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const updateWorkCenter = async (req, res) => {
  try {
    const workCenter = await wcService.updateWorkCenter(req.params.id, req.body);
    sendSuccess(res, 'Work Center updated', { workCenter });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const toggleWorkCenterStatus = async (req, res) => {
  try {
    const workCenter = await wcService.toggleWorkCenterStatus(req.params.id);
    sendSuccess(res, `Work Center ${workCenter.isActive ? 'activated' : 'deactivated'}`, { workCenter });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getWorkCenters,
  getWorkCenterById,
  createWorkCenter,
  updateWorkCenter,
  toggleWorkCenterStatus,
};
