'use strict';

const { ManufacturingOrder, MO_STATUS } = require('../models/ManufacturingOrder.model');
const BillOfMaterials = require('../models/BillOfMaterials.model');
const Inventory = require('../models/Inventory.model');
const inventoryService = require('./inventory.service');
const movementService = require('./inventoryMovement.service');
const { generateMONumber } = require('../utils/moNumberGenerator');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─── Helper ───────────────────────────────────────────────────────────────────

const populateMO = (id) =>
  ManufacturingOrder.findById(id)
    .populate('bomId', 'bomCode quantity version')
    .populate('productId', 'productName sku productType costPrice salesPrice')
    .populate('workCenterId', 'code name capacity costPerHour')
    .populate('components.productId', 'productName sku productType costPrice')
    .populate('createdBy', 'name email role');

// ─── CREATE Manufacturing Order ───────────────────────────────────────────────

const createManufacturingOrder = async (data, userId) => {
  // Validate BoM exists and is active
  const bom = await BillOfMaterials.findById(data.bomId)
    .populate('productId', 'productName sku isActive')
    .populate('components.productId', 'productName sku');
  
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };
  if (!bom.isActive) throw { statusCode: 400, message: 'Cannot create MO from an inactive BoM' };
  if (!bom.productId.isActive) throw { statusCode: 400, message: 'Cannot create MO for an inactive product' };

  const moNumber = await generateMONumber();

  // Explode BoM components proportional to planned qty
  const plannedQty = parseInt(data.plannedQty, 10);
  const bomOutputQty = bom.quantity || 1;
  const multiplier = plannedQty / bomOutputQty;

  const components = bom.components.map((comp) => ({
    productId: comp.productId._id || comp.productId,
    requiredQty: Math.ceil(comp.quantity * multiplier),
    consumedQty: 0,
    reservedQty: 0,
  }));

  const mo = new ManufacturingOrder({
    moNumber,
    bomId: data.bomId,
    productId: bom.productId._id || bom.productId,
    workCenterId: data.workCenterId || null,
    plannedQty,
    producedQty: 0,
    status: MO_STATUS.DRAFT,
    scheduledDate: data.scheduledDate || null,
    components,
    remarks: data.remarks || '',
    createdBy: userId,
    linkedSoId: data.linkedSoId || null,
    // ── Automation tracking fields ──────────────────────────────────────────
    sourceSalesOrderNumber: data.sourceSalesOrderNumber || null,
    createdAutomatically: data.createdAutomatically || false,
    createdByAutomation: data.createdByAutomation || false,
    pendingDemandQty: data.pendingDemandQty != null ? data.pendingDemandQty : null,
  });

  await mo.save();
  logger.info(`Manufacturing Order created: ${moNumber}${data.createdAutomatically ? ` (Auto-created for SO ${data.sourceSalesOrderNumber})` : ''}`);
  return populateMO(mo._id);
};

// ─── GET ALL Manufacturing Orders ─────────────────────────────────────────────

const getAllManufacturingOrders = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.productId) filter.productId = query.productId;
  if (query.search) filter.moNumber = new RegExp(query.search, 'i');
  if (query.from || query.to) {
    filter.scheduledDate = {};
    if (query.from) filter.scheduledDate.$gte = new Date(query.from);
    if (query.to) filter.scheduledDate.$lte = new Date(query.to);
  }

  const [orders, total] = await Promise.all([
    ManufacturingOrder.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'productName sku')
      .populate('workCenterId', 'code name')
      .populate('createdBy', 'name'),
    ManufacturingOrder.countDocuments(filter),
  ]);

  return {
    orders: orders.map((mo) => mo.toObject({ virtuals: true })),
    meta: buildPaginationMeta(total, page, limit),
  };
};

// ─── GET Manufacturing Order BY ID ────────────────────────────────────────────

const getManufacturingOrderById = async (id) => {
  const mo = await populateMO(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  return mo.toObject({ virtuals: true });
};

// ─── CONFIRM Manufacturing Order ──────────────────────────────────────────────

const confirmManufacturingOrder = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  if (mo.status !== MO_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Cannot confirm MO in '${mo.status}' status. Must be DRAFT.` };
  }

  // Explode BoM components onto the MO (if not already loaded)
  if (!mo.components || mo.components.length === 0) {
    const bom = await BillOfMaterials.findById(mo.bomId);
    if (bom) {
      const multiplier = mo.plannedQty / (bom.quantity || 1);
      mo.components = bom.components.map(c => ({
        productId: c.productId,
        requiredQty: Math.ceil(c.quantity * multiplier),
        consumedQty: 0,
        reservedQty: 0,
      }));
    }
  }

  mo.status = MO_STATUS.CONFIRMED;
  await mo.save();
  logger.info(`Manufacturing Order confirmed: ${mo.moNumber}`);

  // ── Procurement Automation: check component availability ─────────────────
  const procurementAutomation = require('./procurementAutomation.service');
  const { allAvailable, shortages } = await procurementAutomation.checkComponentAvailability(mo._id);

  if (!allAvailable) {
    logger.info(
      `[MANUFACTURING] Component shortages detected for MO ${mo.moNumber}: ` +
      shortages.map(s => `${s.productName} (short by ${s.shortage})`).join(', ')
    );
    await procurementAutomation.createShortagePurchaseOrders(mo._id, shortages, userId);
    // MO is now WAITING_FOR_COMPONENTS — return early
    return populateMO(mo._id);
  }

  logger.info(`[MANUFACTURING] All components available for MO ${mo.moNumber}. Ready for production.`);
  return populateMO(mo._id);
};

// ─── START PRODUCTION — Reserve Components ────────────────────────────────────

const startProduction = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  if (![MO_STATUS.CONFIRMED, MO_STATUS.WAITING_FOR_COMPONENTS].includes(mo.status)) {
    throw { statusCode: 400, message: `Cannot start production for MO in '${mo.status}' status. Must be CONFIRMED or WAITING_FOR_COMPONENTS.` };
  }

  // Reserve component stock
  for (const comp of mo.components) {
    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) throw { statusCode: 400, message: `No inventory record for component ${comp.productId}` };

    const freeQty = Math.max(0, inv.onHandQty - inv.reservedQty);
    if (comp.requiredQty > freeQty) {
      throw {
        statusCode: 400,
        message: `Cannot reserve ${comp.requiredQty} units for component ${comp.productId}. Only ${freeQty} free.`,
      };
    }

    // Reserve via inventory service
    const previousReserved = inv.reservedQty;
    inv.reservedQty += comp.requiredQty;
    await inv.save({ validateBeforeSave: false });

    // Create MFG_COMPONENT_CONSUME movement (reservation stage)
    await movementService.createMovement({
      productId: comp.productId,
      movementType: 'MFG_COMPONENT_CONSUME',
      quantity: comp.requiredQty,
      previousQty: previousReserved,
      newQty: inv.reservedQty,
      referenceType: 'ManufacturingOrder',
      referenceId: mo._id,
      remarks: `Component reserved for MO ${mo.moNumber}`,
      createdBy: userId,
    });

    comp.reservedQty = comp.requiredQty;
  }

  mo.status = MO_STATUS.IN_PROGRESS;
  await mo.save();
  logger.info(`Manufacturing Order started: ${mo.moNumber} — components reserved`);

  // Auto-generate Work Orders: Assembly, Painting, Packing
  const WorkOrder = require('../models/WorkOrder.model');
  const count = await WorkOrder.countDocuments();
  let baseNum = count + 1;
  const steps = ['Assembly', 'Painting', 'Packing'];
  for (const stepName of steps) {
    const wo = new WorkOrder({
      woNumber: `WO-${String(baseNum++).padStart(3, '0')}`,
      moId: mo._id,
      name: stepName,
      workCenterId: mo.workCenterId,
      status: 'PENDING',
      createdBy: userId,
    });
    await wo.save();
  }
  logger.info(`Work Orders (Assembly, Painting, Packing) generated for MO ${mo.moNumber}`);

  return populateMO(mo._id);
};

// ─── PRODUCE OUTPUT — Record Production ───────────────────────────────────────

const produceOutput = async (id, data, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  if (mo.status !== MO_STATUS.IN_PROGRESS) {
    throw { statusCode: 400, message: `Cannot record output for MO in '${mo.status}' status. Must be IN_PROGRESS.` };
  }

  const producingQty = parseInt(data.producedQty, 10);
  const remaining = mo.plannedQty - mo.producedQty;

  if (producingQty > remaining) {
    throw {
      statusCode: 400,
      message: `Cannot produce ${producingQty} units. Only ${remaining} units remaining to produce.`,
    };
  }

  // Calculate proportion of components to consume
  const ratio = producingQty / mo.plannedQty;

  // Consume component stock (reduce onHandQty and reservedQty)
  for (const comp of mo.components) {
    const qtyToConsume = Math.ceil(comp.requiredQty * ratio);

    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) throw { statusCode: 400, message: `No inventory for component ${comp.productId}` };

    const actualConsume = Math.min(qtyToConsume, inv.onHandQty, inv.reservedQty);

    if (actualConsume > 0) {
      const prevOnHand = inv.onHandQty;
      inv.onHandQty -= actualConsume;
      inv.reservedQty = Math.max(0, inv.reservedQty - actualConsume);
      const { STOCK_STATUS } = require('../constants/stockStatus');
      inv.stockStatus = inv.onHandQty <= inv.minimumStockLevel ? STOCK_STATUS.LOW_STOCK : STOCK_STATUS.NORMAL;
      await inv.save({ validateBeforeSave: false });

      // Log the consumption movement in the ledger
      await movementService.createMovement({
        productId: comp.productId,
        movementType: 'MFG_COMPONENT_CONSUME',
        quantity: -actualConsume,
        previousQty: prevOnHand,
        newQty: inv.onHandQty,
        referenceType: 'ManufacturingOrder',
        referenceId: mo._id,
        remarks: `Component consumed for MO ${mo.moNumber}`,
        createdBy: userId,
      });

      comp.consumedQty += actualConsume;
      comp.reservedQty = Math.max(0, comp.reservedQty - actualConsume);
    }
  }

  // Increase finished good stock
  const finishedGoodInv = await Inventory.findOne({ productId: mo.productId });
  if (!finishedGoodInv) {
    throw { statusCode: 400, message: 'No inventory record found for finished product' };
  }

  const prevFinished = finishedGoodInv.onHandQty;
  finishedGoodInv.onHandQty += producingQty;
  const { STOCK_STATUS } = require('../constants/stockStatus');
  finishedGoodInv.stockStatus =
    finishedGoodInv.onHandQty <= finishedGoodInv.minimumStockLevel
      ? STOCK_STATUS.LOW_STOCK
      : STOCK_STATUS.NORMAL;
  await finishedGoodInv.save({ validateBeforeSave: false });

  // Create MFG_OUTPUT_PRODUCE movement for finished good
  await movementService.createMovement({
    productId: mo.productId,
    movementType: 'MFG_OUTPUT_PRODUCE',
    quantity: producingQty,
    previousQty: prevFinished,
    newQty: finishedGoodInv.onHandQty,
    referenceType: 'ManufacturingOrder',
    referenceId: mo._id,
    remarks: data.remarks || `Production output — MO ${mo.moNumber}`,
    createdBy: userId,
  });

  // Update MO quantities
  mo.producedQty += producingQty;

  // Check if MO is complete
  if (mo.producedQty >= mo.plannedQty) {
    mo.status = MO_STATUS.DONE;
    mo.completedDate = new Date();
    logger.info(`Manufacturing Order DONE: ${mo.moNumber}`);

    // Update Sales Order status to 'Ready For Delivery' if triggered by a Sales Order
    const Traceability = require('../models/Traceability.model');
    const trace = await Traceability.findOne({
      targetDocId: mo._id,
      sourceDocType: 'SalesOrder',
    });
    if (trace) {
      const SalesOrder = require('../models/SalesOrder.model');
      const so = await SalesOrder.findById(trace.sourceDocId);
      if (so) {
        // ── MTO Reservation: reserve the newly produced qty for the linked SO ──
        // The SO already has some units reserved (from initial available stock).
        // Newly produced units must also be reserved so that shipStock() can
        // release them during delivery. We reserve exactly what we just produced.
        const freshFinInv = await Inventory.findOne({ productId: mo.productId });
        if (freshFinInv) {
          const prevReserved = freshFinInv.reservedQty;
          freshFinInv.reservedQty += producingQty;
          await freshFinInv.save({ validateBeforeSave: false });
          logger.info(
            `[WORKFLOW] Reserved ${producingQty} newly produced units of finished good for SO ${so.soNumber} ` +
            `(reservedQty: ${prevReserved} → ${freshFinInv.reservedQty})`
          );

          // Log the reservation movement in the ledger
          await movementService.createMovement({
            productId: mo.productId,
            movementType: 'MFG_OUTPUT_PRODUCE',
            quantity: producingQty,
            previousQty: prevReserved,
            newQty: freshFinInv.reservedQty,
            referenceType: 'SalesOrder',
            referenceId: so._id,
            remarks: `MTO output reserved for SO ${so.soNumber} upon MO ${mo.moNumber} completion`,
            createdBy: userId,
          });
        }

        so.status = 'Ready For Delivery';
        await so.save();
        logger.info(`[WORKFLOW] Updated Sales Order ${so.soNumber} status to Ready For Delivery`);

        // Log Audit Log & Notification for SO update
        const AuditLog = require('../models/AuditLog.model');
        const Notification = require('../models/Notification.model');
        await AuditLog.create({
          userId,
          action: 'SALES_ORDER_READY_FOR_DELIVERY',
          module: 'SALES',
          details: {
            salesOrderId: so._id,
            soNumber: so.soNumber,
            moNumber: mo.moNumber,
          },
        });

        await Notification.create({
          userId: so.createdBy,
          title: `Sales Order ${so.soNumber} Ready`,
          message: `Manufacturing Order ${mo.moNumber} is complete. Sales Order ${so.soNumber} is now Ready For Delivery.`,
          type: 'SUCCESS',
        });
      }
    }
  }

  await mo.save();
  return populateMO(mo._id);
};

// ─── CANCEL Manufacturing Order ───────────────────────────────────────────────

const cancelManufacturingOrder = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if ([MO_STATUS.DONE, MO_STATUS.CANCELLED].includes(mo.status)) {
    throw { statusCode: 400, message: `Cannot cancel MO in '${mo.status}' status.` };
  }
  if (mo.status === MO_STATUS.IN_PROGRESS) {
    // Release reserved component stock
    for (const comp of mo.components) {
      if (comp.reservedQty > 0) {
        const inv = await Inventory.findOne({ productId: comp.productId });
        if (inv) {
          const prevReserved = inv.reservedQty;
          inv.reservedQty = Math.max(0, inv.reservedQty - comp.reservedQty);
          await inv.save({ validateBeforeSave: false });

          await movementService.createMovement({
            productId: comp.productId,
            movementType: 'MFG_COMPONENT_CONSUME',
            quantity: -comp.reservedQty,
            previousQty: prevReserved,
            newQty: inv.reservedQty,
            referenceType: 'ManufacturingOrder',
            referenceId: mo._id,
            remarks: `Component reservation released — MO ${mo.moNumber} cancelled`,
            createdBy: userId,
          });
        }
      }
    }

    // Cancel pending work orders
    const WorkOrder = require('../models/WorkOrder.model');
    await WorkOrder.deleteMany({ moId: mo._id, status: { $ne: 'COMPLETED' } });
  }

  mo.status = MO_STATUS.CANCELLED;
  await mo.save();
  logger.info(`Manufacturing Order cancelled: ${mo.moNumber}`);
  return populateMO(mo._id);
};

// ─── WORK ORDER OPERATIONS ────────────────────────────────────────────────────

const getWorkOrdersByMO = async (moId) => {
  const WorkOrder = require('../models/WorkOrder.model');
  return WorkOrder.find({ moId }).populate('workCenterId', 'code name');
};

const completeWorkOrder = async (woId, userId) => {
  const WorkOrder = require('../models/WorkOrder.model');
  const wo = await WorkOrder.findById(woId);
  if (!wo) throw { statusCode: 404, message: 'Work Order not found' };
  if (wo.status === 'COMPLETED') {
    throw { statusCode: 400, message: 'Work Order is already completed' };
  }

  wo.status = 'COMPLETED';
  wo.completedBy = userId;
  wo.completedAt = new Date();
  await wo.save();

  // Create audit log for work order completion
  const AuditLog = require('../models/AuditLog.model');
  await AuditLog.create({
    userId,
    action: 'WORK_ORDER_COMPLETED',
    module: 'MANUFACTURING',
    details: {
      workOrderId: wo._id,
      woNumber: wo.woNumber,
      name: wo.name,
      moId: wo.moId,
    },
  });

  // Check if all work orders for this MO are completed
  const total = await WorkOrder.countDocuments({ moId: wo.moId });
  const completed = await WorkOrder.countDocuments({ moId: wo.moId, status: 'COMPLETED' });

  if (total === completed) {
    const mo = await ManufacturingOrder.findById(wo.moId);
    if (mo && mo.status === MO_STATUS.IN_PROGRESS) {
      logger.info(`[MANUFACTURING] All Work Orders completed for MO ${mo.moNumber}. Completing MO...`);
      await produceOutput(mo._id, {
        producedQty: mo.plannedQty - mo.producedQty,
        remarks: 'Automatically completed upon completion of all Work Orders.',
      }, userId);
    }
  }

  return wo;
};

// ─── REJECT Manufacturing Order (auto-created MOs only) ───────────────────────

const rejectManufacturingOrder = async (id, { reason } = {}, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if (mo.status !== MO_STATUS.DRAFT) {
    throw {
      statusCode: 400,
      message: `Cannot reject MO in '${mo.status}' status. Only DRAFT (pending) MOs can be rejected.`,
    };
  }

  mo.status = MO_STATUS.REJECTED;
  mo.rejectionReason = reason || 'Rejected by manager';
  await mo.save();

  // Audit log
  const AuditLog = require('../models/AuditLog.model');
  await AuditLog.create({
    userId,
    action: 'MO_REJECTED',
    module: 'MANUFACTURING',
    details: {
      moId: mo._id,
      moNumber: mo.moNumber,
      sourceSalesOrderNumber: mo.sourceSalesOrderNumber,
      reason: mo.rejectionReason,
    },
  });

  logger.info(`Manufacturing Order rejected: ${mo.moNumber} — Reason: ${mo.rejectionReason}`);
  return populateMO(mo._id);
};

module.exports = {
  createManufacturingOrder,
  getAllManufacturingOrders,
  getManufacturingOrderById,
  confirmManufacturingOrder,
  startProduction,
  produceOutput,
  cancelManufacturingOrder,
  rejectManufacturingOrder,
  getWorkOrdersByMO,
  completeWorkOrder,
};
