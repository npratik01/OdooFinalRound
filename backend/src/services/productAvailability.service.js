'use strict';

const Inventory = require('../models/Inventory.model');
const Product = require('../models/Product.model');

/**
 * Calculates available stock (freeToUseQty = onHandQty - reservedQty).
 * Used to fetch exact free quantities.
 */
const calculateAvailableStock = async (productId) => {
  const inventory = await Inventory.findOne({ productId });
  if (!inventory) return 0;
  return Math.max(0, inventory.onHandQty - inventory.reservedQty);
};

/**
 * Checks if the requested quantity is available in stock.
 * Identifies shortages and provides suggestions for MTS/MTO procurement strategies.
 */
const checkAvailability = async (productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw { statusCode: 404, message: 'Product not found' };
  }

  const freeQty = await calculateAvailableStock(productId);
  const isAvailable = freeQty >= quantity;

  let actionRequired = 'NONE';
  let procurementType = null;
  let missingQty = 0;

  if (!isAvailable) {
    missingQty = quantity - freeQty;
    procurementType = product.procurementType; // PURCHASE or MANUFACTURING

    if (product.procurementStrategy === 'MTO') {
      actionRequired = 'TRIGGER_PROCUREMENT';
    } else if (product.procurementStrategy === 'MTS') {
      actionRequired = 'REPLENISHMENT_ALERT';
    }
  }

  return {
    productId: product._id,
    productName: product.productName,
    sku: product.sku,
    procurementStrategy: product.procurementStrategy,
    requestedQty: quantity,
    availableQty: freeQty,
    isAvailable,
    missingQty,
    actionRequired,
    procurementType
  };
};

/**
 * Validates a list of items for availability in an order.
 * Returns overall validation status and details for each item.
 */
const validateOrder = async (items) => {
  const results = [];
  let isValid = true;

  for (const item of items) {
    const check = await checkAvailability(item.productId, item.quantity);
    // If strategy is MTS and we don't have enough, order is invalid.
    // If strategy is MTO, we can trigger procurement, but we still report details.
    if (!check.isAvailable && check.procurementStrategy === 'MTS') {
      isValid = false;
    }
    results.push(check);
  }

  return {
    isValid,
    items: results
  };
};

/**
 * Reserve stock wrapping inventory service.
 */
const reserveStock = async (productId, quantity) => {
  const inventoryService = require('./inventory.service');
  return inventoryService.reserveStock(productId, quantity);
};

/**
 * Release reserved stock wrapping inventory service.
 */
const releaseStock = async (productId, quantity) => {
  const inventoryService = require('./inventory.service');
  return inventoryService.releaseStock(productId, quantity);
};

module.exports = {
  calculateAvailableStock,
  checkAvailability,
  validateOrder,
  reserveStock,
  releaseStock
};
