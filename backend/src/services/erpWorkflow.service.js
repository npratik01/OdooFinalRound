'use strict';

const SalesOrder = require('../models/SalesOrder.model');
const Inventory = require('../models/Inventory.model');
const Product = require('../models/Product.model');
const BillOfMaterials = require('../models/BillOfMaterials.model');
const WorkCenter = require('../models/WorkCenter.model');
const Vendor = require('../models/Vendor.model');
const Notification = require('../models/Notification.model');
const AuditLog = require('../models/AuditLog.model');
const Traceability = require('../models/Traceability.model');
const User = require('../models/User.model');

const inventoryService = require('./inventory.service');
const manufacturingService = require('./manufacturing.service');
const purchaseService = require('./purchase.service');
const logger = require('../utils/logger');
const { ROLES } = require('../constants/roles');

/**
 * ERP Workflow Orchestrator Service
 * Coordinates processes across modules (Sales, Inventory, Manufacturing, Procurement).
 */
const handleSalesOrderConfirmed = async (salesOrderId, userId) => {
  logger.info(`[ORCHESTRATOR] Starting Sales Order Confirmation Workflow for SO ID: ${salesOrderId}`);
  
  // 1. Fetch sales order
  const order = await SalesOrder.findById(salesOrderId);
  if (!order) {
    throw new Error(`Sales Order with ID ${salesOrderId} not found.`);
  }

  const triggeredActions = [];

  try {
    // 2. Iterate through items to check stock and reserve / trigger procurement
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        logger.error(`[ORCHESTRATOR] Product ${item.productId} not found during SO workflow.`);
        continue;
      }

      // Check current inventory
      const inventory = await Inventory.findOne({ productId: item.productId });
      if (!inventory) {
        logger.error(`[ORCHESTRATOR] No inventory record for product ${product.productName}.`);
        continue;
      }

      const availableQty = Math.max(0, inventory.onHandQty - inventory.reservedQty);
      const requestedQty = item.quantity;

      // Calculate quantity to reserve and deficit
      const qtyToReserve = Math.min(requestedQty, availableQty);
      const deficit = requestedQty - qtyToReserve;

      // Perform reservation for available amount
      if (qtyToReserve > 0) {
        logger.info(`[ORCHESTRATOR] Reserving ${qtyToReserve} units of ${product.productName} for SO ${order.soNumber}`);
        await inventoryService.reserveStock(
          item.productId,
          qtyToReserve,
          userId,
          'SalesOrder',
          order._id,
          `Auto-reserved via ERP Orchestrator for Sales Order ${order.soNumber}`
        );
        triggeredActions.push({
          type: 'STOCK_RESERVATION',
          productId: item.productId,
          productName: product.productName,
          quantity: qtyToReserve,
          status: 'SUCCESS',
        });
      }

      // Handle deficit via Procurement Automation
      if (deficit > 0) {
        logger.info(`[ORCHESTRATOR] Deficit of ${deficit} units detected for ${product.productName}. Triggering replenishment...`);

        const strategy = product.procurementStrategy; // MTS or MTO
        const type = product.procurementType; // MANUFACTURING or PURCHASE

        // For this automation brain, any deficit on confirmation is auto-replenished
        if (type === 'MANUFACTURING') {
          // Find Bill of Materials (BOM)
          const bom = await BillOfMaterials.findOne({ productId: product._id, isActive: true });
          if (!bom) {
            logger.warn(`[ORCHESTRATOR] No active BoM found for product ${product.productName}. Cannot auto-generate Manufacturing Order.`);
            triggeredActions.push({
              type: 'MANUFACTURING_ORDER_FAILED',
              productId: item.productId,
              productName: product.productName,
              quantity: deficit,
              reason: 'No active BoM found',
              status: 'FAILED',
            });
            continue;
          }

          // Find default active Work Center
          const workCenter = await WorkCenter.findOne({ isActive: true });

          // Call manufacturing service to create MO
          logger.info(`[ORCHESTRATOR] Auto-generating Manufacturing Order for ${product.productName} (Qty: ${deficit})`);
          const mo = await manufacturingService.createManufacturingOrder({
            bomId: bom._id,
            plannedQty: deficit,
            workCenterId: workCenter ? workCenter._id : undefined,
            remarks: `Auto-generated via ERP Orchestrator to fulfill deficit of SO ${order.soNumber}`,
          }, userId);

          triggeredActions.push({
            type: 'MANUFACTURING_ORDER',
            documentId: mo._id,
            documentNumber: mo.moNumber,
            productId: item.productId,
            productName: product.productName,
            quantity: deficit,
            status: 'SUCCESS',
          });

          // Create document Traceability link
          await Traceability.create({
            sourceDocId: order._id,
            sourceDocType: 'SalesOrder',
            sourceDocNumber: order.soNumber,
            targetDocId: mo._id,
            targetDocType: 'ManufacturingOrder',
            targetDocNumber: mo.moNumber,
            relationType: 'TRIGGERED',
            remarks: `Triggered by stock deficit of ${deficit} units upon SO confirmation.`,
          });

          // Log Audit Log & Notifications for MO
          await createNotificationForRole(
            ROLES.MANUFACTURING_USER,
            `Auto-MO Generated: ${mo.moNumber}`,
            `Manufacturing Order ${mo.moNumber} was automatically created for ${product.productName} (Qty: ${deficit}) to fulfill Sales Order ${order.soNumber}.`
          );

        } else if (type === 'PURCHASE') {
          // Find supplier/vendor
          let vendorDoc = null;
          const directVendorId = product.vendorId || (product.get && product.get('vendorId'));
          if (directVendorId) {
            vendorDoc = await Vendor.findOne({ _id: directVendorId, isActive: true });
          }
          if (!vendorDoc && product.vendor) {
            vendorDoc = await Vendor.findOne({
              vendorName: new RegExp('^' + product.vendor.trim() + '$', 'i'),
              isActive: true,
            });
          }
          if (!vendorDoc) {
            vendorDoc = await Vendor.findOne({ isActive: true });
          }

          if (!vendorDoc) {
            logger.warn(`[ORCHESTRATOR] No active Vendor found in system. Cannot auto-generate Purchase Order.`);
            triggeredActions.push({
              type: 'PURCHASE_ORDER_FAILED',
              productId: item.productId,
              productName: product.productName,
              quantity: deficit,
              reason: 'No active Vendor found',
              status: 'FAILED',
            });
            continue;
          }

          // Call purchase service to create PO
          logger.info(`[ORCHESTRATOR] Auto-generating Purchase Order from vendor ${vendorDoc.vendorName} for ${product.productName} (Qty: ${deficit})`);
          const po = await purchaseService.createPurchaseOrder({
            vendorId: vendorDoc._id,
            items: [
              {
                productId: product._id,
                quantity: deficit,
                unitCost: product.costPrice || 1,
              },
            ],
            remarks: `Auto-generated via ERP Orchestrator to fulfill deficit of SO ${order.soNumber}`,
          }, userId);

          triggeredActions.push({
            type: 'PURCHASE_ORDER',
            documentId: po._id,
            documentNumber: po.poNumber,
            productId: item.productId,
            productName: product.productName,
            quantity: deficit,
            status: 'SUCCESS',
          });

          // Create document Traceability link
          await Traceability.create({
            sourceDocId: order._id,
            sourceDocType: 'SalesOrder',
            sourceDocNumber: order.soNumber,
            targetDocId: po._id,
            targetDocType: 'PurchaseOrder',
            targetDocNumber: po.poNumber,
            relationType: 'TRIGGERED',
            remarks: `Triggered by stock deficit of ${deficit} units upon SO confirmation.`,
          });

          // Log Audit Log & Notifications for PO
          await createNotificationForRole(
            ROLES.PURCHASE_USER,
            `Auto-PO Generated: ${po.poNumber}`,
            `Purchase Order ${po.poNumber} was automatically created with Vendor ${vendorDoc.vendorName} for ${product.productName} (Qty: ${deficit}) to fulfill Sales Order ${order.soNumber}.`
          );
        }
      }
    }

    // 3. Create General Audit Log for SO confirm action
    await AuditLog.create({
      userId,
      action: 'SALES_ORDER_CONFIRM_ORCHESTRATED',
      module: 'SALES',
      details: {
        salesOrderId: order._id,
        soNumber: order.soNumber,
        triggeredActions,
      },
    });

    // 4. Create Notification for the user who triggered the confirmation
    await Notification.create({
      userId,
      title: `Sales Order ${order.soNumber} Orchestrated`,
      message: `Sales Order ${order.soNumber} has been successfully confirmed. Triggered stock reservations and automatic procurement workflows.`,
      type: 'SUCCESS',
    });

    logger.info(`[ORCHESTRATOR] Sales Order Confirmation Workflow completed successfully for SO: ${order.soNumber}`);
  } catch (error) {
    logger.error(`[ORCHESTRATOR] Error during Sales Order Workflow orchestration:`, error);
    // Log failure audit log
    await AuditLog.create({
      userId,
      action: 'SALES_ORDER_CONFIRM_ORCHESTRATION_FAILED',
      module: 'SALES',
      details: {
        salesOrderId: order._id,
        soNumber: order.soNumber,
        error: error.message,
      },
    });

    // Notify user of failure
    await Notification.create({
      userId,
      title: `Workflow Orchestration Failed`,
      message: `Orchestration workflow for Sales Order ${order?.soNumber || salesOrderId} failed: ${error.message}`,
      type: 'ERROR',
    });
    
    throw error;
  }
};

/**
 * Helper to dispatch notification to all users matching a certain role
 */
const createNotificationForRole = async (role, title, message) => {
  try {
    const users = await User.find({ role, isActive: true });
    const notifications = users.map((user) => ({
      userId: user._id,
      title,
      message,
      type: 'INFO',
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    logger.error(`[ORCHESTRATOR] Failed to dispatch role notification:`, err);
  }
};

module.exports = {
  handleSalesOrderConfirmed,
};
