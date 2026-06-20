'use strict';

const { ManufacturingOrderService, WorkOrderService } = require('../services/manufacturing');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Manufacturing Orders ─────────────────────────────────────────────────────

const getManufacturingOrders = async (req, res) => {
  try {
    const result = await ManufacturingOrderService.getAllManufacturingOrders(req.query);
    sendSuccess(res, 'Manufacturing Orders retrieved', result);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getManufacturingOrderById = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.getManufacturingOrderById(req.params.id);
    sendSuccess(res, 'Manufacturing Order retrieved', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const createManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.createManufacturingOrder(req.body, req.user.userId);
    sendSuccess(res, 'Manufacturing Order created', { mo }, 201);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const updateManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.updateManufacturingOrder(req.params.id, req.body);
    sendSuccess(res, 'Manufacturing Order updated', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const confirmManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.confirmManufacturingOrder(req.params.id, req.user.userId);
    sendSuccess(res, 'Manufacturing Order confirmed. Components reserved and Work Orders generated.', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const startManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.startManufacturingOrder(req.params.id);
    sendSuccess(res, 'Manufacturing Order started', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const completeManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.completeManufacturingOrder(req.params.id, req.body, req.user.userId);
    sendSuccess(res, 'Manufacturing Order completed. Components consumed and finished goods produced.', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const cancelManufacturingOrder = async (req, res) => {
  try {
    const mo = await ManufacturingOrderService.cancelManufacturingOrder(req.params.id, req.user.userId);
    sendSuccess(res, 'Manufacturing Order cancelled. Reservations released.', { mo });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getWorkOrdersForMO = async (req, res) => {
  try {
    const workOrders = await WorkOrderService.getWorkOrdersForMO(req.params.id);
    sendSuccess(res, 'Work Orders retrieved', { workOrders });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

// ─── Work Orders ──────────────────────────────────────────────────────────────

const getAllWorkOrders = async (req, res) => {
  try {
    const result = await WorkOrderService.getAllWorkOrders(req.query);
    sendSuccess(res, 'Work Orders retrieved', result);
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const startWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrderService.startWorkOrder(req.params.id, req.user.userId);
    sendSuccess(res, 'Work Order started', { workOrder });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const completeWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrderService.completeWorkOrder(req.params.id, req.body, req.user.userId);
    sendSuccess(res, 'Work Order completed', { workOrder });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const cancelWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrderService.cancelWorkOrder(req.params.id);
    sendSuccess(res, 'Work Order cancelled', { workOrder });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getManufacturingOrders,
  getManufacturingOrderById,
  createManufacturingOrder,
  updateManufacturingOrder,
  confirmManufacturingOrder,
  startManufacturingOrder,
  completeManufacturingOrder,
  cancelManufacturingOrder,
  getWorkOrdersForMO,
  getAllWorkOrders,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
};
