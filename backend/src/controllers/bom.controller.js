const { BoMService } = require('../services/manufacturing');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getBOMs = async (req, res) => {
  try {
    const result = await BoMService.getAllBOMs(req.query);
    sendSuccess(res, 'Bill of Materials retrieved', result);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getBOMById = async (req, res) => {
  try {
    const bom = await BoMService.getBOMById(req.params.id);
    sendSuccess(res, 'Bill of Materials retrieved', { bom });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const createBOM = async (req, res) => {
  try {
    const bom = await BoMService.createBOM(req.body, req.user.userId);
    sendSuccess(res, 'Bill of Materials created', { bom }, 201);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const updateBOM = async (req, res) => {
  try {
    const bom = await BoMService.updateBOM(req.params.id, req.body);
    sendSuccess(res, 'Bill of Materials updated', { bom });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const cloneBOM = async (req, res) => {
  try {
    const bom = await BoMService.cloneBOM(req.params.id, req.user.userId);
    sendSuccess(res, 'Bill of Materials cloned', { bom }, 201);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const activateBOM = async (req, res) => {
  try {
    const bom = await BoMService.activateBOM(req.params.id);
    sendSuccess(res, 'Bill of Materials activated', { bom });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const archiveBOM = async (req, res) => {
  try {
    const bom = await BoMService.archiveBOM(req.params.id);
    sendSuccess(res, 'Bill of Materials archived', { bom });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  cloneBOM,
  activateBOM,
  archiveBOM,
};
