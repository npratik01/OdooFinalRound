'use strict';

/**
 * WorkOrderService
 * Single responsibility: Work Order generation, sequencing, and state machine.
 *
 * The service owns the sequencing rule:
 *   WO[seq=1] → Ready when MO starts.
 *   WO[seq=N+1] → Ready when WO[seq=N] completes.
 *
 * Phase 5: `generateWorkOrdersForMO()` is reused when MOs are auto-scheduled
 * from Sales Order triggers — no changes needed here.
 */

const { WorkOrder, WO_STATUS }         = require('../../models/WorkOrder.model');
const { ManufacturingOrder, MO_STATUS } = require('../../models/ManufacturingOrder.model');
const Operation                         = require('../../models/Operation.model');
const inventoryMovementService          = require('../inventoryMovement.service');
const { generateWONumber }              = require('../../utils/woNumberGenerator');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const logger                            = require('../../utils/logger');

// ─── Populate Helper ──────────────────────────────────────────────────────────

const _populateWO = (id) =>
  WorkOrder.findById(id)
    .populate('operationId',       'operationName operationCode standardDurationMinutes')
    .populate('workCenterId',      'workCenterCode workCenterName efficiencyPercentage')
    .populate('assignedOperator',  'name email');

// ─── GENERATE Work Orders for a newly confirmed MO ────────────────────────────

/**
 * Creates one WorkOrder per BoM operation, ordered by sequence.
 * All start as PENDING. The caller (ManufacturingOrderService) later marks
 * WO[seq=1] as READY when the MO is started.
 *
 * @param {Object} mo  — Mongoose ManufacturingOrder document
 * @param {Object} bom — Populated BOM document (operations.operationId populated)
 * @returns {WorkOrder[]} created work order documents
 */
const generateWorkOrdersForMO = async (mo, bom) => {
  const sortedOps = (bom.operations || []).slice().sort((a, b) => a.sequence - b.sequence);

  const created = [];
  for (const bomOp of sortedOps) {
    const operation = await Operation.findById(bomOp.operationId);
    if (!operation) {
      logger.warn(`WorkOrderService: operation ${bomOp.operationId} not found, skipping`);
      continue;
    }

    const woNumber = await generateWONumber();
    const wo = new WorkOrder({
      workOrderNumber:        woNumber,
      manufacturingOrderId:   mo._id,
      operationId:            operation._id,
      workCenterId:           operation.workCenterId,
      sequence:               bomOp.sequence,
      plannedDurationMinutes: operation.standardDurationMinutes,
      actualDurationMinutes:  0,
      status:                 WO_STATUS.PENDING,
    });
    await wo.save();
    created.push(wo);
    logger.info(`WorkOrderService: created ${woNumber} (seq=${bomOp.sequence}) for MO ${mo.moNumber}`);
  }

  return created;
};

// ─── GET Work Orders for MO ───────────────────────────────────────────────────

const getWorkOrdersForMO = async (moId) =>
  WorkOrder.find({ manufacturingOrderId: moId })
    .sort({ sequence: 1 })
    .populate('operationId',      'operationName operationCode standardDurationMinutes')
    .populate('workCenterId',     'workCenterCode workCenterName efficiencyPercentage')
    .populate('assignedOperator', 'name email');

// ─── GET All Work Orders (paginated) ─────────────────────────────────────────

const getAllWorkOrders = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.status)               filter.status               = query.status;
  if (query.manufacturingOrderId) filter.manufacturingOrderId = query.manufacturingOrderId;
  if (query.workCenterId)         filter.workCenterId         = query.workCenterId;

  const [workOrders, total] = await Promise.all([
    WorkOrder.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('manufacturingOrderId', 'moNumber status')
      .populate('operationId',          'operationName')
      .populate('workCenterId',         'workCenterCode workCenterName'),
    WorkOrder.countDocuments(filter),
  ]);

  return { workOrders, meta: buildPaginationMeta(total, page, limit) };
};

// ─── MARK first WO as Ready (called when MO starts) ──────────────────────────

const markFirstWorkOrderReady = async (moId) => {
  const firstWO = await WorkOrder.findOne({
    manufacturingOrderId: moId,
    status:               WO_STATUS.PENDING,
    sequence:             1,
  });
  if (firstWO) {
    firstWO.status = WO_STATUS.READY;
    await firstWO.save();
    logger.info(`WorkOrderService: WO[seq=1] marked Ready for MO ${moId}`);
  }
  return firstWO;
};

// ─── START Work Order (Pending/Ready → In Progress) ──────────────────────────

const startWorkOrder = async (woId, userId) => {
  const wo = await WorkOrder.findById(woId).populate('manufacturingOrderId');
  if (!wo) throw { statusCode: 404, message: 'Work Order not found' };

  if (![WO_STATUS.PENDING, WO_STATUS.READY].includes(wo.status)) {
    throw {
      statusCode: 400,
      message: `Cannot start Work Order in '${wo.status}' status. Must be Pending or Ready.`,
    };
  }

  // Auto-start parent MO if still Confirmed
  const mo = await ManufacturingOrder.findById(wo.manufacturingOrderId);
  if (mo && mo.status === MO_STATUS.CONFIRMED) {
    mo.status          = MO_STATUS.IN_PROGRESS;
    mo.actualStartDate = new Date();
    await mo.save();
    logger.info(`WorkOrderService: auto-started MO ${mo.moNumber} on first WO start`);
  }

  wo.status    = WO_STATUS.IN_PROGRESS;
  wo.startedAt = new Date();
  await wo.save();

  logger.info(`WorkOrderService: started ${wo.workOrderNumber}`);
  return _populateWO(wo._id);
};

// ─── COMPLETE Work Order (In Progress → Completed) ───────────────────────────

const completeWorkOrder = async (woId, data = {}, userId) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) throw { statusCode: 404, message: 'Work Order not found' };

  if (wo.status !== WO_STATUS.IN_PROGRESS) {
    throw {
      statusCode: 400,
      message: `Cannot complete Work Order in '${wo.status}' status. Must be In Progress.`,
    };
  }

  const now             = new Date();
  const elapsedMinutes  = wo.startedAt ? Math.round((now - wo.startedAt) / 60000) : wo.plannedDurationMinutes;

  wo.status                = WO_STATUS.COMPLETED;
  wo.completedAt           = now;
  wo.actualDurationMinutes = data.actualDurationMinutes ?? elapsedMinutes;
  if (data.remarks !== undefined) wo.remarks = data.remarks;
  await wo.save();

  // Post an operational tracking movement (qty=0, informational)
  const mo = await ManufacturingOrder.findById(wo.manufacturingOrderId);
  if (mo) {
    await inventoryMovementService.createMovement({
      productId:     mo.productId,
      movementType:  'WORK_ORDER_COMPLETION',
      quantity:      0,
      previousQty:   0,
      newQty:        0,
      referenceType: 'WorkOrder',
      referenceId:   wo._id,
      remarks:       `Work Order completed — ${wo.workOrderNumber}`,
      createdBy:     userId,
    });
  }

  // Advance sequence: mark next WO as Ready
  await _advanceSequence(wo);

  logger.info(`WorkOrderService: completed ${wo.workOrderNumber} in ${wo.actualDurationMinutes}m`);
  return _populateWO(wo._id);
};

// ─── CANCEL Work Order ────────────────────────────────────────────────────────

const cancelWorkOrder = async (woId) => {
  const wo = await WorkOrder.findById(woId);
  if (!wo) throw { statusCode: 404, message: 'Work Order not found' };

  if ([WO_STATUS.COMPLETED, WO_STATUS.CANCELLED].includes(wo.status)) {
    throw { statusCode: 400, message: `Cannot cancel Work Order in '${wo.status}' status.` };
  }

  wo.status = WO_STATUS.CANCELLED;
  await wo.save();

  logger.info(`WorkOrderService: cancelled ${wo.workOrderNumber}`);
  return _populateWO(wo._id);
};

// ─── CANCEL ALL Work Orders for an MO ────────────────────────────────────────

const cancelAllWorkOrdersForMO = async (moId) => {
  const result = await WorkOrder.updateMany(
    { manufacturingOrderId: moId, status: { $nin: [WO_STATUS.COMPLETED, WO_STATUS.CANCELLED] } },
    { status: WO_STATUS.CANCELLED }
  );
  logger.info(`WorkOrderService: cancelled ${result.modifiedCount} WOs for MO ${moId}`);
  return result;
};

// ─── COMPLETE ALL remaining Work Orders for an MO ────────────────────────────

const completeAllRemainingWorkOrders = async (moId) => {
  const result = await WorkOrder.updateMany(
    { manufacturingOrderId: moId, status: { $nin: [WO_STATUS.COMPLETED, WO_STATUS.CANCELLED] } },
    { status: WO_STATUS.COMPLETED, completedAt: new Date() }
  );
  logger.info(`WorkOrderService: force-completed ${result.modifiedCount} WOs for MO ${moId}`);
  return result;
};

// ─── PRIVATE: advance sequencing ─────────────────────────────────────────────

const _advanceSequence = async (completedWO) => {
  const nextWO = await WorkOrder.findOne({
    manufacturingOrderId: completedWO.manufacturingOrderId,
    sequence:             completedWO.sequence + 1,
    status:               WO_STATUS.PENDING,
  });
  if (nextWO) {
    nextWO.status = WO_STATUS.READY;
    await nextWO.save();
    logger.info(`WorkOrderService: WO[seq=${nextWO.sequence}] advanced to Ready`);
  }
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

module.exports = {
  generateWorkOrdersForMO,
  getWorkOrdersForMO,
  getAllWorkOrders,
  markFirstWorkOrderReady,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  cancelAllWorkOrdersForMO,
  completeAllRemainingWorkOrders,
};
