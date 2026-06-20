'use strict';

/**
 * ProductionExecutionService
 * Single responsibility: All inventory-touching production operations.
 *
 * Three engines:
 *   1. Component Reservation Engine  — locks raw material stock when MO is confirmed.
 *   2. Component Consumption Engine  — physically deducts stock when MO completes.
 *   3. Finished Goods Production Engine — adds produced quantity to finished good stock.
 *
 * This service is the ONLY place that modifies Inventory for manufacturing.
 * It never modifies ManufacturingOrder or WorkOrder documents.
 *
 * Phase 5: Consumption and reservation engines are unchanged for auto-scheduled MOs.
 */

const Inventory               = require('../../models/Inventory.model');
const inventoryMovementService = require('../inventoryMovement.service');
const { STOCK_STATUS }        = require('../../constants/stockStatus');
const logger                  = require('../../utils/logger');

// ─── VALIDATE Component Availability ─────────────────────────────────────────
// Called before reservation to give actionable error messages.

const validateComponentAvailability = async (componentRequirements) => {
  const shortfalls = [];

  for (const comp of componentRequirements) {
    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) {
      shortfalls.push({
        productId: comp.productId,
        reason: 'No inventory record found. Create inventory first.',
      });
      continue;
    }

    const freeQty = Math.max(0, inv.onHandQty - inv.reservedQty);
    if (comp.quantityRequired > freeQty) {
      shortfalls.push({
        productId: comp.productId,
        required:  comp.quantityRequired,
        available: freeQty,
        reason: `Insufficient free stock. Required: ${comp.quantityRequired}, Free: ${freeQty}`,
      });
    }
  }

  if (shortfalls.length > 0) {
    const messages = shortfalls.map((s) => s.reason).join('; ');
    throw {
      statusCode: 400,
      message: `Component availability check failed: ${messages}`,
      shortfalls,
    };
  }

  return true;
};

// ─── ENGINE 1: Reserve Components ────────────────────────────────────────────
// Adds to reservedQty. Does NOT change onHandQty.

const reserveComponents = async (mo, componentRequirements, userId) => {
  for (const comp of componentRequirements) {
    const qty = Math.ceil(comp.quantityRequired);
    if (qty <= 0) continue;

    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) continue;

    const previousQty  = inv.reservedQty;
    inv.reservedQty   += qty;
    await inv.save({ validateBeforeSave: false });

    await inventoryMovementService.createMovement({
      productId:     comp.productId,
      movementType:  'MANUFACTURING_RESERVATION',
      quantity:      qty,
      previousQty,
      newQty:        inv.reservedQty,
      referenceType: 'ManufacturingOrder',
      referenceId:   mo._id,
      remarks:       `Manufacturing Reservation — ${mo.moNumber}`,
      createdBy:     userId,
    });

    logger.info(`ProductionExecutionService: reserved ${qty} units of ${comp.productId} for MO ${mo.moNumber}`);
  }
};

// ─── ENGINE 1b: Release Components (on MO Cancel) ───────────────────────────
// Decrements reservedQty for any component not yet consumed.

const releaseComponents = async (mo, userId) => {
  for (const comp of mo.componentRequirements) {
    const alreadyConsumed = comp.quantityConsumed || 0;
    const qtyToRelease    = Math.ceil(comp.quantityRequired) - alreadyConsumed;
    if (qtyToRelease <= 0) continue;

    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) continue;

    const previousQty  = inv.reservedQty;
    inv.reservedQty    = Math.max(0, inv.reservedQty - qtyToRelease);
    await inv.save({ validateBeforeSave: false });

    await inventoryMovementService.createMovement({
      productId:     comp.productId,
      movementType:  'RESERVATION_RELEASE',
      quantity:      -qtyToRelease,
      previousQty,
      newQty:        inv.reservedQty,
      referenceType: 'ManufacturingOrder',
      referenceId:   mo._id,
      remarks:       `Component reservation released — MO Cancelled: ${mo.moNumber}`,
      createdBy:     userId,
    });

    logger.info(`ProductionExecutionService: released ${qtyToRelease} units of ${comp.productId} for MO ${mo.moNumber}`);
  }
};

// ─── ENGINE 2: Consume Components ────────────────────────────────────────────
// Proportional to qtyProduced / qtyToProduce.
// Decrements both onHandQty and reservedQty; returns updated quantityConsumed per comp.

const consumeComponents = async (mo, qtyProduced, userId) => {
  const ratio = qtyProduced / mo.quantityToProduce;

  for (const comp of mo.componentRequirements) {
    const qtyToConsume = Math.ceil(comp.quantityRequired * ratio);
    if (qtyToConsume <= 0) continue;

    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) continue;

    const prevOnHand = inv.onHandQty;

    inv.onHandQty   = Math.max(0, inv.onHandQty   - qtyToConsume);
    inv.reservedQty = Math.max(0, inv.reservedQty - qtyToConsume);
    inv.stockStatus = inv.onHandQty <= inv.minimumStockLevel ? STOCK_STATUS.LOW_STOCK : STOCK_STATUS.NORMAL;
    await inv.save({ validateBeforeSave: false });

    await inventoryMovementService.createMovement({
      productId:     comp.productId,
      movementType:  'MANUFACTURING_CONSUMPTION',
      quantity:      -qtyToConsume,
      previousQty:   prevOnHand,
      newQty:        inv.onHandQty,
      referenceType: 'ManufacturingOrder',
      referenceId:   mo._id,
      remarks:       `Component consumed — ${mo.moNumber}`,
      createdBy:     userId,
    });

    // Update in-memory snapshot (caller must persist the MO doc)
    comp.quantityConsumed = (comp.quantityConsumed || 0) + qtyToConsume;

    logger.info(`ProductionExecutionService: consumed ${qtyToConsume} units of ${comp.productId} for MO ${mo.moNumber}`);
  }
};

// ─── ENGINE 3: Produce Finished Goods ────────────────────────────────────────
// Increments onHandQty of the target finished product.

const produceFinishedGoods = async (mo, qtyProduced, userId) => {
  const finishedInv = await Inventory.findOne({ productId: mo.productId });
  if (!finishedInv) {
    throw {
      statusCode: 400,
      message: 'No inventory record found for the finished product. Create one in Inventory first.',
    };
  }

  const previousQty       = finishedInv.onHandQty;
  finishedInv.onHandQty  += qtyProduced;
  finishedInv.stockStatus = finishedInv.onHandQty <= finishedInv.minimumStockLevel
    ? STOCK_STATUS.LOW_STOCK
    : STOCK_STATUS.NORMAL;

  await finishedInv.save({ validateBeforeSave: false });

  await inventoryMovementService.createMovement({
    productId:     mo.productId,
    movementType:  'MANUFACTURING_PRODUCTION',
    quantity:      qtyProduced,
    previousQty,
    newQty:        finishedInv.onHandQty,
    referenceType: 'ManufacturingOrder',
    referenceId:   mo._id,
    remarks:       `Finished goods produced — ${mo.moNumber}`,
    createdBy:     userId,
  });

  logger.info(`ProductionExecutionService: produced ${qtyProduced} units of ${mo.productId} for MO ${mo.moNumber}`);
  return finishedInv;
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

module.exports = {
  validateComponentAvailability,
  reserveComponents,
  releaseComponents,
  consumeComponents,
  produceFinishedGoods,
};
