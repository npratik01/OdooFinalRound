'use strict';

const vendorService = require('../services/vendor.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const getVendors = async (req, res) => {
  try {
    const result = await vendorService.getAllVendors(req.query);
    return sendSuccess(res, { data: result, message: 'Vendors retrieved successfully' });
  } catch (err) {
    logger.error('getVendors error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve vendors' });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    return sendSuccess(res, { data: vendor, message: 'Vendor retrieved successfully' });
  } catch (err) {
    logger.error('getVendorById error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve vendor' });
  }
};

const createVendor = async (req, res) => {
  try {
    const vendor = await vendorService.createVendor(req.body);
    return sendCreated(res, { data: vendor, message: `Vendor created successfully: ${vendor.vendorCode}` });
  } catch (err) {
    logger.error('createVendor error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to create vendor' });
  }
};

const updateVendor = async (req, res) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);
    return sendSuccess(res, { data: vendor, message: 'Vendor updated successfully' });
  } catch (err) {
    logger.error('updateVendor error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update vendor' });
  }
};

const toggleVendorStatus = async (req, res) => {
  try {
    const vendor = await vendorService.toggleVendorStatus(req.params.id);
    const msg = vendor.isActive ? 'Vendor activated' : 'Vendor deactivated';
    return sendSuccess(res, { data: vendor, message: msg });
  } catch (err) {
    logger.error('toggleVendorStatus error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update vendor status' });
  }
};

module.exports = { getVendors, getVendorById, createVendor, updateVendor, toggleVendorStatus };
