'use strict';

/**
 * ProcurementAutomationService
 * ─────────────────────────────────────────────────────────────────────────────
 * Central engine for handling component shortages during manufacturing.
 *
 * Methods:
 *   checkComponentAvailability(moId)
 *     → Checks each MO component against live inventory free qty.
 *     → Returns { allAvailable, shortages[] }
 *
 *   createShortagePurchaseOrders(moId, shortages, userId)
 *     → Creates and confirms a PO per shortage component.
 *     → Links POs to the MO via Traceability + componentPOs field.
 *     → Transitions MO to WAITING_FOR_COMPONENTS.
 *
 *   resumeManufacturingAfterReceipt(poId, userId)
 *     → Called after each GRN receipt.
 *     → Finds any WAITING_FOR_COMPONENTS MO linked to this PO.
 *     → If all components are now available, auto-starts production.
 */

const { ManufacturingOrder, MO_STATUS } = require('../models/ManufacturingOrder.model');
const Inventory = require('../models/Inventory.model');
const Product = require('../models/Product.model');
const Vendor = require('../models/Vendor.model');
const Traceability = require('../models/Traceability.model');
const AuditLog = require('../models/AuditLog.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

const purchaseService = require('./purchase.service');
const logger = require('../utils/logger');
const { ROLES } = require('../constants/roles');

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether all components for an MO are available in free inventory.
 * @param {ObjectId|string} moId
 * @returns {{ allAvailable: boolean, shortages: Array }}
 */
const checkComponentAvailability = async (moId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  const shortages = [];

  for (const comp of mo.components) {
    const inv = await Inventory.findOne({ productId: comp.productId });
    const product = await Product.findById(comp.productId);
    const productName = product ? product.productName : comp.productId.toString();

    if (!inv) {
      shortages.push({
        productId: comp.productId,
        productName,
        required: comp.requiredQty,
        available: 0,
        shortage: comp.requiredQty,
        vendorId: product ? product.vendorId : null,
        unitCost: product ? product.costPrice : 1,
      });
      continue;
    }

    const freeQty = Math.max(0, inv.onHandQty - inv.reservedQty);
    if (comp.requiredQty > freeQty) {
      shortages.push({
        productId: comp.productId,
        productName,
        required: comp.requiredQty,
        available: freeQty,
        shortage: comp.requiredQty - freeQty,
        vendorId: product ? product.vendorId : null,
        unitCost: product ? (product.costPrice || 1) : 1,
      });
    }
  }

  return { allAvailable: shortages.length === 0, shortages };
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create confirmed Purchase Orders for each shortage component.
 * Transitions MO → WAITING_FOR_COMPONENTS.
 * @param {ObjectId|string} moId
 * @param {Array} shortages   — from checkComponentAvailability()
 * @param {ObjectId} userId
 * @returns {Array} created PO documents
 */
const createShortagePurchaseOrders = async (moId, shortages, userId) => {
  const mo = await ManufacturingOrder.findById(moId);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  const createdPOs = [];

  for (const shortage of shortages) {
    // Resolve vendor: product.vendorId first, then first active vendor
    let vendorId = shortage.vendorId;
    if (!vendorId) {
      const fallback = await Vendor.findOne({ isActive: true });
      if (!fallback) {
        logger.warn(`[PROCUREMENT] No vendor found for component ${shortage.productName}. Skipping PO.`);
        continue;
      }
      vendorId = fallback._id;
    }

    // Verify vendor is active
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isActive) {
      const fallback = await Vendor.findOne({ isActive: true });
      if (!fallback) {
        logger.warn(`[PROCUREMENT] Vendor inactive for ${shortage.productName}. Skipping PO.`);
        continue;
      }
      vendorId = fallback._id;
    }

    logger.info(
      `[PROCUREMENT] Creating PO for component shortage: ${shortage.productName} ` +
      `(shortage: ${shortage.shortage} units)`
    );

    // Create draft PO
    const po = await purchaseService.createPurchaseOrder({
      vendorId,
      items: [{
        productId: shortage.productId,
        quantity: shortage.shortage,
        unitCost: shortage.unitCost || 1,
      }],
      remarks: `Auto-created by Procurement Engine for MO ${mo.moNumber} — component shortage of ${shortage.shortage} × ${shortage.productName}`,
    }, userId);

    // Confirm the PO so it is ready for receipt
    await purchaseService.confirmPurchaseOrder(po._id);
    logger.info(`[PROCUREMENT] PO ${po.poNumber} confirmed for ${shortage.productName} (qty: ${shortage.shortage})`);

    // Traceability: MO → PO
    await Traceability.create({
      sourceDocId: mo._id,
      sourceDocType: 'ManufacturingOrder',
      sourceDocNumber: mo.moNumber,
      targetDocId: po._id,
      targetDocType: 'PurchaseOrder',
      targetDocNumber: po.poNumber,
      relationType: 'TRIGGERED',
      remarks: `Auto PO for shortage component: ${shortage.productName}`,
    });

    createdPOs.push(po);
    mo.componentPOs.push(po._id);
  }

  // Block the MO until components arrive
  mo.status = MO_STATUS.WAITING_FOR_COMPONENTS;
  await mo.save();
  logger.info(`[PROCUREMENT] MO ${mo.moNumber} status → WAITING_FOR_COMPONENTS (${createdPOs.length} shortage POs created)`);

  // Audit log
  await AuditLog.create({
    userId,
    action: 'MO_BLOCKED_FOR_COMPONENTS',
    module: 'MANUFACTURING',
    details: {
      moId: mo._id,
      moNumber: mo.moNumber,
      shortages: shortages.map(s => ({
        product: s.productName,
        required: s.required,
        available: s.available,
        shortage: s.shortage,
      })),
      createdPOs: createdPOs.map(p => p.poNumber),
    },
  });

  // Notify purchase team
  await _notifyRole(
    ROLES.PURCHASE_USER || 'PURCHASE_USER',
    `Component Shortage: MO ${mo.moNumber} blocked`,
    `Manufacturing Order ${mo.moNumber} is waiting for ${shortages.length} component(s). ` +
    `${createdPOs.length} Purchase Order(s) auto-created: ${createdPOs.map(p => p.poNumber).join(', ')}`
  );

  return createdPOs;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called after every GRN is processed.
 * If the received PO is linked to a WAITING_FOR_COMPONENTS MO and
 * all components are now available, auto-starts production.
 * @param {ObjectId|string} poId
 * @param {ObjectId} userId
 */
const resumeManufacturingAfterReceipt = async (poId, userId) => {
  try {
    // Find any blocked MO that references this PO
    const blockedMOs = await ManufacturingOrder.find({
      status: MO_STATUS.WAITING_FOR_COMPONENTS,
      componentPOs: poId,
    });

    if (blockedMOs.length === 0) {
      logger.info(`[PROCUREMENT] GRN for PO ${poId}: no blocked MOs waiting on this PO.`);
      return;
    }

    for (const mo of blockedMOs) {
      logger.info(`[PROCUREMENT] Checking if MO ${mo.moNumber} can resume after GRN receipt...`);

      const { allAvailable, shortages } = await checkComponentAvailability(mo._id);

      if (!allAvailable) {
        logger.info(
          `[PROCUREMENT] MO ${mo.moNumber} still waiting — remaining shortages: ` +
          shortages.map(s => `${s.productName} (need ${s.shortage} more)`).join(', ')
        );
        continue;
      }

      // All components available — start production
      logger.info(`[PROCUREMENT] All components available for MO ${mo.moNumber}. Auto-resuming production...`);

      // Lazy-require to avoid circular dependency
      const manufacturingService = require('./manufacturing.service');
      await manufacturingService.startProduction(mo._id, userId);

      logger.info(`[PROCUREMENT] MO ${mo.moNumber} auto-resumed → IN_PROGRESS`);

      // Audit log
      await AuditLog.create({
        userId,
        action: 'MO_RESUMED_AFTER_COMPONENTS_RECEIVED',
        module: 'MANUFACTURING',
        details: {
          moId: mo._id,
          moNumber: mo.moNumber,
          triggeredByPoId: poId,
        },
      });

      // Notify manufacturing team
      await _notifyRole(
        ROLES.MANUFACTURING_USER || 'MANUFACTURING_USER',
        `Production Resumed: MO ${mo.moNumber}`,
        `All components have been received. Manufacturing Order ${mo.moNumber} has automatically resumed and is now IN PROGRESS.`
      );
    }
  } catch (err) {
    logger.error(`[PROCUREMENT] Error in resumeManufacturingAfterReceipt for PO ${poId}:`, err);
    // Non-fatal — GRN should still succeed
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

const _notifyRole = async (role, title, message) => {
  try {
    const users = await User.find({ role, isActive: true });
    if (users.length > 0) {
      await Notification.insertMany(
        users.map(u => ({ userId: u._id, title, message, type: 'INFO' }))
      );
    }
  } catch (err) {
    logger.error(`[PROCUREMENT] Failed to send role notification:`, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  checkComponentAvailability,
  createShortagePurchaseOrders,
  resumeManufacturingAfterReceipt,
};
