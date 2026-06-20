'use strict';

const customerService = require('../services/customer.service');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');

const getAllCustomers = async (req, res, next) => {
  try {
    const { customers, meta } = await customerService.getAllCustomers(req.query);
    return res.status(200).json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers,
      meta
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return sendSuccess(res, customer, 'Customer fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return sendCreated(res, customer, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return sendSuccess(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const customer = await customerService.toggleCustomerStatus(req.params.id, isActive);
    const stateStr = isActive ? 'activated' : 'deactivated';
    return sendSuccess(res, customer, `Customer ${stateStr} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus
};
