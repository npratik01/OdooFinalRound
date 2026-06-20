'use strict';

const Inventory = require('../models/Inventory.model');
const Product = require('../models/Product.model');
const { STOCK_STATUS } = require('../constants/stockStatus');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// CORE STOCK OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recalculates freeToUseQty from onHandQty - reservedQty.
 * Pure function — does NOT persist.
 */
const recalculateFreeQty = (inventory) => {
  return Math.max(0, (inventory.onHandQty || 0) - (inventory.reservedQty || 0));
};

/**
 * Checks if inventory is in low stock state.
 * Pure function — does NOT persist.
 */
const checkLowStock = (inventory) => {
  return (inventory.onHandQty || 0) <= (inventory.minimumStockLevel || 0);
};

/**
 * Recomputes and persists stockStatus for a product's inventory record.
 */
const updateStockStatus = async (productId) => {
  const inventory = await Inventory.findOne({ productId });
  if (!inventory) return null;

  const newStatus = checkLowStock(inventory)
    ? STOCK_STATUS.LOW_STOCK
    : STOCK_STATUS.NORMAL;

  if (inventory.stockStatus !== newStatus) {
    inventory.stockStatus = newStatus;
    await inventory.save({ validateBeforeSave: false });
    logger.info(`Stock status updated for product ${productId}: ${newStatus}`);
  }

  return inventory;
};

/**
 * Increases on-hand quantity by a given amount.
 * Used for: goods receipt, production output, manual adjustment (increase).
 */
const increaseStock = async (productId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Quantity to increase must be a positive integer' };
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  inventory.onHandQty += qty;
  inventory.stockStatus = checkLowStock(inventory)
    ? STOCK_STATUS.LOW_STOCK
    : STOCK_STATUS.NORMAL;

  await inventory.save({ validateBeforeSave: false });
  return populatedInventory(productId);
};

/**
 * Decreases on-hand quantity by a given amount.
 * Used for: goods issue, sales dispatch, manual adjustment (decrease).
 * Guards against going below reservedQty.
 */
const decreaseStock = async (productId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Quantity to decrease must be a positive integer' };
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  const freeQty = recalculateFreeQty(inventory);
  if (qty > freeQty) {
    throw {
      statusCode: 400,
      message: `Cannot decrease stock by ${qty}. Only ${freeQty} units are free to use (on-hand: ${inventory.onHandQty}, reserved: ${inventory.reservedQty}).`,
    };
  }

  inventory.onHandQty -= qty;
  inventory.stockStatus = checkLowStock(inventory)
    ? STOCK_STATUS.LOW_STOCK
    : STOCK_STATUS.NORMAL;

  await inventory.save({ validateBeforeSave: false });
  return populatedInventory(productId);
};

/**
 * Reserves a quantity from free-to-use stock.
 * Used for: sales orders, manufacturing reservations.
 */
const reserveStock = async (productId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Quantity to reserve must be a positive integer' };
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  const freeQty = recalculateFreeQty(inventory);
  if (qty > freeQty) {
    throw {
      statusCode: 400,
      message: `Cannot reserve ${qty} units. Only ${freeQty} units are free to use.`,
    };
  }

  inventory.reservedQty += qty;
  // reserving does not change onHandQty or stockStatus
  await inventory.save({ validateBeforeSave: false });
  return populatedInventory(productId);
};

/**
 * Releases previously reserved stock back to free-to-use pool.
 * Used for: cancelled orders, released reservations.
 */
const releaseStock = async (productId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Quantity to release must be a positive integer' };
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  if (qty > inventory.reservedQty) {
    throw {
      statusCode: 400,
      message: `Cannot release ${qty} units. Only ${inventory.reservedQty} units are currently reserved.`,
    };
  }

  inventory.reservedQty -= qty;
  await inventory.save({ validateBeforeSave: false });
  return populatedInventory(productId);
};

/**
 * Deducts stock from on-hand and releases reserved quantity simultaneously.
 * Used for: delivery shipments.
 */
const shipStock = async (productId, qty) => {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw { statusCode: 400, message: 'Quantity to ship must be a positive integer' };
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  if (qty > inventory.onHandQty) {
    throw {
      statusCode: 400,
      message: `Cannot ship ${qty} units. Only ${inventory.onHandQty} units are physically on-hand.`,
    };
  }

  if (qty > inventory.reservedQty) {
    throw {
      statusCode: 400,
      message: `Cannot ship ${qty} units of reserved stock. Only ${inventory.reservedQty} units are currently reserved.`,
    };
  }

  inventory.onHandQty -= qty;
  inventory.reservedQty -= qty;
  inventory.stockStatus = checkLowStock(inventory)
    ? STOCK_STATUS.LOW_STOCK
    : STOCK_STATUS.NORMAL;

  await inventory.save({ validateBeforeSave: false });
  return populatedInventory(productId);
};

// ─────────────────────────────────────────────────────────────────────────────
// QUERY OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all inventory records with product details.
 */
const getAllInventory = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.stockStatus) filter.stockStatus = query.stockStatus;

  const [records, total] = await Promise.all([
    Inventory.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'productId',
        select: 'productName sku productType procurementStrategy isActive',
        match: { isActive: true },
      }),
    Inventory.countDocuments(filter),
  ]);

  // Add virtual freeToUseQty to each record and filter out inactive products
  const enriched = records
    .filter((r) => r.productId !== null)
    .map((r) => {
      const obj = r.toObject({ virtuals: true });
      obj.freeToUseQty = Math.max(0, (obj.onHandQty || 0) - (obj.reservedQty || 0));
      return obj;
    });

  return {
    inventory: enriched,
    meta: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Returns inventory for a specific product.
 */
const getInventoryByProductId = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw { statusCode: 404, message: 'Product not found' };
  }

  const inventory = await Inventory.findOne({ productId }).populate(
    'productId',
    'productName sku productType procurementStrategy vendor costPrice salesPrice'
  );

  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  const obj = inventory.toObject({ virtuals: true });
  obj.freeToUseQty = Math.max(0, (obj.onHandQty || 0) - (obj.reservedQty || 0));
  return obj;
};

/**
 * Adjusts inventory quantities (direct set, used from adjust form).
 */
const adjustInventory = async (productId, adjustmentData) => {
  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw { statusCode: 404, message: 'Inventory record not found for this product' };
  }

  if (adjustmentData.onHandQty !== undefined) inventory.onHandQty = adjustmentData.onHandQty;
  if (adjustmentData.reservedQty !== undefined) inventory.reservedQty = adjustmentData.reservedQty;
  if (adjustmentData.minimumStockLevel !== undefined) inventory.minimumStockLevel = adjustmentData.minimumStockLevel;

  // pre-save hook computes stockStatus
  await inventory.save();

  return populatedInventory(productId);
};

/**
 * Returns all low-stock items.
 */
const getLowStockItems = async () => {
  const items = await Inventory.find({ stockStatus: STOCK_STATUS.LOW_STOCK })
    .populate({
      path: 'productId',
      select: 'productName sku productType vendor costPrice',
      match: { isActive: true },
    })
    .sort({ onHandQty: 1 }); // most critical first

  return items
    .filter((item) => item.productId !== null)
    .map((item) => {
      const obj = item.toObject({ virtuals: true });
      obj.freeToUseQty = Math.max(0, (obj.onHandQty || 0) - (obj.reservedQty || 0));
      return obj;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const populatedInventory = async (productId) => {
  const inv = await Inventory.findOne({ productId }).populate(
    'productId',
    'productName sku productType'
  );
  if (!inv) return null;
  const obj = inv.toObject({ virtuals: true });
  obj.freeToUseQty = Math.max(0, (obj.onHandQty || 0) - (obj.reservedQty || 0));
  return obj;
};

module.exports = {
  // Core ops
  increaseStock,
  decreaseStock,
  reserveStock,
  releaseStock,
  shipStock,
  recalculateFreeQty,
  checkLowStock,
  updateStockStatus,
  // Query ops
  getAllInventory,
  getInventoryByProductId,
  adjustInventory,
  getLowStockItems,
};
