'use strict';

const opService = require('../services/operation.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getOperations = async (req, res) => {
  try {
    const result = await opService.getAllOperations(req.query);
    sendSuccess(res, 'Operations retrieved', result);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getOperationById = async (req, res) => {
  try {
    const operation = await opService.getOperationById(req.params.id);
    sendSuccess(res, 'Operation retrieved', { operation });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const createOperation = async (req, res) => {
  try {
    const operation = await opService.createOperation(req.body);
    sendSuccess(res, 'Operation created', { operation }, 201);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const updateOperation = async (req, res) => {
  try {
    const operation = await opService.updateOperation(req.params.id, req.body);
    sendSuccess(res, 'Operation updated', { operation });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getOperations,
  getOperationById,
  createOperation,
  updateOperation,
};
