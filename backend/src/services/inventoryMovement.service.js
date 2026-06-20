'use strict';

const InventoryMovement = require('../models/InventoryMovement.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Logs a new inventory movement.
 */
const createMovement = async (movementData) => {
  const movement = new InventoryMovement(movementData);
  await movement.save();
  return movement;
};

/**
 * Fetches all inventory movements (paginated, sorted, filterable).
 */
const getAllMovements = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.productId) filter.productId = query.productId;
  if (query.movementType) filter.movementType = query.movementType;
  if (query.referenceModel) filter.referenceModel = query.referenceModel;

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'productName sku')
      .populate('performedBy', 'name role'),
    InventoryMovement.countDocuments(filter)
  ]);

  return {
    movements,
    meta: buildPaginationMeta(total, page, limit)
  };
};

module.exports = {
  createMovement,
  getAllMovements
};
