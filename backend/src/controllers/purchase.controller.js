'use strict';

const purchaseService = require('../services/purchase.service');
const { sendSuccess, sendCreated, sendError, sendNotFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ── Purchase Orders ──────────────────────────────────────────────────────────

const getPurchaseOrders = async (req, res) => {
  try {
    const result = await purchaseService.getAllPurchaseOrders(req.query);
    return sendSuccess(res, { data: result, message: 'Purchase Orders retrieved successfully' });
  } catch (err) {
    logger.error('getPurchaseOrders error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Purchase Orders' });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await purchaseService.getPurchaseOrderById(req.params.id);
    return sendSuccess(res, { data: po, message: 'Purchase Order retrieved successfully' });
  } catch (err) {
    logger.error('getPurchaseOrderById error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve Purchase Order' });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const po = await purchaseService.createPurchaseOrder(req.body, req.user.userId);
    return sendCreated(res, { data: po, message: `Purchase Order created: ${po.poNumber}` });
  } catch (err) {
    logger.error('createPurchaseOrder error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to create Purchase Order' });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await purchaseService.updatePurchaseOrder(req.params.id, req.body);
    return sendSuccess(res, { data: po, message: 'Purchase Order updated successfully' });
  } catch (err) {
    logger.error('updatePurchaseOrder error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to update Purchase Order' });
  }
};

const confirmPurchaseOrder = async (req, res) => {
  try {
    const po = await purchaseService.confirmPurchaseOrder(req.params.id);
    return sendSuccess(res, { data: po, message: `Purchase Order confirmed: ${po.poNumber}` });
  } catch (err) {
    logger.error('confirmPurchaseOrder error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to confirm Purchase Order' });
  }
};

const cancelPurchaseOrder = async (req, res) => {
  try {
    const po = await purchaseService.cancelPurchaseOrder(req.params.id);
    return sendSuccess(res, { data: po, message: `Purchase Order cancelled: ${po.poNumber}` });
  } catch (err) {
    logger.error('cancelPurchaseOrder error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to cancel Purchase Order' });
  }
};

// ── Goods Receipt ────────────────────────────────────────────────────────────

const receiveGoods = async (req, res) => {
  try {
    const result = await purchaseService.receiveGoods(req.params.id, req.body, req.user.userId);
    return sendCreated(res, {
      data: result,
      message: `Goods Receipt created: ${result.goodsReceipt.grNumber}. PO Status: ${result.purchaseOrder.status}`,
    });
  } catch (err) {
    logger.error('receiveGoods error:', err);
    if (err.statusCode === 404) return sendNotFound(res, err.message);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to process Goods Receipt' });
  }
};

const getReceiptsByPO = async (req, res) => {
  try {
    const receipts = await purchaseService.getReceiptsByPO(req.params.id);
    return sendSuccess(res, { data: receipts, message: 'Receipts retrieved successfully' });
  } catch (err) {
    logger.error('getReceiptsByPO error:', err);
    if (err.statusCode) return sendError(res, { message: err.message, statusCode: err.statusCode });
    return sendError(res, { message: 'Failed to retrieve receipts' });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  receiveGoods,
  getReceiptsByPO,
};
