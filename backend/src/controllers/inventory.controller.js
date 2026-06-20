'use strict';

const inventoryService = require('../services/inventory.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getAllInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventory(req.query);
    return sendSuccess(res, { message: 'Inventory fetched successfully', data: result.inventory, meta: result.meta });
  } catch (err) { next(err); }
};

const getInventoryByProductId = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
    return sendSuccess(res, { message: 'Inventory fetched successfully', data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const adjustInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.adjustInventory(req.params.productId, req.body);
    return sendSuccess(res, { message: 'Inventory adjusted successfully', data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const getLowStockItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getLowStockItems();
    return sendSuccess(res, { message: 'Low stock items fetched', data: items, meta: { total: items.length } });
  } catch (err) { next(err); }
};

// ─── Named Stock Operations ───────────────────────────────────────────────────

const increaseStock = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const inventory = await inventoryService.increaseStock(
      req.params.productId,
      Number(qty),
      req.user.userId,
      'Inventory',
      null,
      `Stock increased by ${qty} units via API`
    );
    return sendSuccess(res, { message: `Stock increased by ${qty} units`, data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const decreaseStock = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const inventory = await inventoryService.decreaseStock(
      req.params.productId,
      Number(qty),
      req.user.userId,
      'Inventory',
      null,
      `Stock decreased by ${qty} units via API`
    );
    return sendSuccess(res, { message: `Stock decreased by ${qty} units`, data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const reserveStock = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const inventory = await inventoryService.reserveStock(
      req.params.productId,
      Number(qty),
      req.user.userId,
      'Inventory',
      null,
      `${qty} units reserved via API`
    );
    return sendSuccess(res, { message: `${qty} units reserved successfully`, data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const releaseStock = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const inventory = await inventoryService.releaseStock(
      req.params.productId,
      Number(qty),
      req.user.userId,
      'Inventory',
      null,
      `${qty} units released via API`
    );
    return sendSuccess(res, { message: `${qty} units released successfully`, data: inventory });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  adjustInventory,
  getLowStockItems,
  increaseStock,
  decreaseStock,
  reserveStock,
  releaseStock,
};
