'use strict';

/**
 * ManufacturingOrderService
 * Single responsibility: MO lifecycle orchestration.
 *
 * This service is the ORCHESTRATOR — it delegates to:
 *   - BoMService          for BoM retrieval
 *   - WorkOrderService    for WO generation and sequencing
 *   - ProductionExecutionService for inventory engines
 *   - CapacityPlanningService   for scheduling feasibility (Phase 5)
 *
 * Controllers call ONLY this service for MO operations.
 * This service never writes to Inventory directly.
 *
 * ─── Phase 5 Auto-Generation Hook ────────────────────────────────────────────
 * `scheduleFromSalesOrder(salesOrderId, lineItem, userId)` is a Phase 5
 * integration point. When a Sales Order is confirmed and a line item has
 * procurementType = 'MANUFACTURING', the ProcurementAutomationService will
 * call this method to automatically create + confirm an MO.
 * The method:
 *   1. Finds the active BoM for the product.
 *   2. Checks capacity via CapacityPlanningService.
 *   3. Creates a Draft MO.
 *   4. Confirms it (reserves stock + generates WOs).
 *   5. Returns the confirmed MO with a linkage to the originating SO.
 */

const { ManufacturingOrder, MO_STATUS } = require('../../models/ManufacturingOrder.model');
const { BOM, BOM_STATUS }               = require('../../models/BOM.model');
const BoMService                        = require('./BoMService');
const WorkOrderService                  = require('./WorkOrderService');
const ProductionExecutionService        = require('./ProductionExecutionService');
const CapacityPlanningService           = require('./CapacityPlanningService');
const { generateMONumber }              = require('../../utils/moNumberGenerator');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const logger                            = require('../../utils/logger');

// ─── Populate Helper ──────────────────────────────────────────────────────────

const _populateMO = (id) =>
  ManufacturingOrder.findById(id)
    .populate('productId',        'productName sku productType')
    .populate('bomId',            'bomCode version status')
    .populate('assignedTo',       'name email role')
    .populate('createdBy',        'name email role')
    .populate('componentRequirements.productId', 'productName sku');

// ─── CREATE (Draft) ───────────────────────────────────────────────────────────

const createManufacturingOrder = async (data, userId) => {
  const bom = await BOM.findById(data.bomId);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };
  if (bom.status !== BOM_STATUS.ACTIVE) {
    throw {
      statusCode: 400,
      message: `BoM must be Active to create a Manufacturing Order. Current status: ${bom.status}`,
    };
  }
  if (bom.productId.toString() !== data.productId.toString()) {
    throw { statusCode: 400, message: 'BoM product does not match the Manufacturing Order product' };
  }

  const moNumber = await generateMONumber();

  const mo = new ManufacturingOrder({
    moNumber,
    productId:         data.productId,
    bomId:             data.bomId,
    quantityToProduce: parseInt(data.quantityToProduce, 10),
    quantityProduced:  0,
    quantityRemaining: parseInt(data.quantityToProduce, 10),
    plannedStartDate:  data.plannedStartDate || null,
    plannedEndDate:    data.plannedEndDate   || null,
    status:            MO_STATUS.DRAFT,
    assignedTo:        data.assignedTo || null,
    remarks:           data.remarks    || '',
    createdBy:         userId,
    componentRequirements: [],
    // Phase 5: link originating Sales Order
    originatingSalesOrderId: data.originatingSalesOrderId || null,
    originatingSalesOrderLine: data.originatingSalesOrderLine || null,
  });

  await mo.save();
  logger.info(`ManufacturingOrderService: created ${moNumber}`);
  return _populateMO(mo._id);
};

// ─── LIST (paginated, filtered) ───────────────────────────────────────────────

const getAllManufacturingOrders = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.status)    filter.status    = query.status;
  if (query.productId) filter.productId = query.productId;
  if (query.search)    filter.moNumber  = new RegExp(query.search, 'i');

  const [orders, total] = await Promise.all([
    ManufacturingOrder.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'productName sku')
      .populate('bomId',     'bomCode version')
      .populate('createdBy', 'name'),
    ManufacturingOrder.countDocuments(filter),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

const getManufacturingOrderById = async (id) => {
  const mo = await _populateMO(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  return mo;
};

// ─── UPDATE (Draft only) ──────────────────────────────────────────────────────

const updateManufacturingOrder = async (id, data) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if (mo.status !== MO_STATUS.DRAFT) {
    throw {
      statusCode: 400,
      message: `Cannot edit MO in '${mo.status}' status. Only Draft MOs can be edited.`,
    };
  }

  if (data.quantityToProduce !== undefined) mo.quantityToProduce = parseInt(data.quantityToProduce, 10);
  if (data.plannedStartDate  !== undefined) mo.plannedStartDate  = data.plannedStartDate;
  if (data.plannedEndDate    !== undefined) mo.plannedEndDate    = data.plannedEndDate;
  if (data.assignedTo        !== undefined) mo.assignedTo        = data.assignedTo;
  if (data.remarks           !== undefined) mo.remarks           = data.remarks;

  await mo.save();
  return _populateMO(mo._id);
};

// ─── CONFIRM MO: Reserve Components + Generate Work Orders ────────────────────

const confirmManufacturingOrder = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if (mo.status !== MO_STATUS.DRAFT) {
    throw {
      statusCode: 400,
      message: `Cannot confirm MO in '${mo.status}' status. Status must be Draft.`,
    };
  }

  // Fetch active BoM with populated operations
  const bom = await BOM.findById(mo.bomId).populate('operations.operationId');
  if (!bom || bom.status !== BOM_STATUS.ACTIVE) {
    throw { statusCode: 400, message: 'Associated BoM is no longer Active' };
  }
  if (!bom.components || bom.components.length === 0) {
    throw { statusCode: 400, message: 'BoM has no components. Add components before confirming.' };
  }

  const qtyToProduce = mo.quantityToProduce;

  // Build component requirements snapshot (scaled by qty)
  const componentRequirements = bom.components.map((c) => ({
    productId:        c.productId,
    quantityRequired: parseFloat((c.quantityRequired * qtyToProduce).toFixed(4)),
    quantityConsumed: 0,
    unit:             c.unit || 'Units',
  }));

  // Validate stock availability (throws on shortfall)
  await ProductionExecutionService.validateComponentAvailability(componentRequirements);

  // Reserve component stock
  await ProductionExecutionService.reserveComponents(mo, componentRequirements, userId);

  // Generate Work Orders from BoM routing
  await WorkOrderService.generateWorkOrdersForMO(mo, bom);

  // Persist snapshot + status
  mo.status               = MO_STATUS.CONFIRMED;
  mo.componentRequirements = componentRequirements;
  await mo.save();

  logger.info(`ManufacturingOrderService: confirmed ${mo.moNumber}`);
  return _populateMO(mo._id);
};

// ─── START MO (Confirmed/Ready → In Progress) ─────────────────────────────────

const startManufacturingOrder = async (id) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if (![MO_STATUS.CONFIRMED, MO_STATUS.READY].includes(mo.status)) {
    throw {
      statusCode: 400,
      message: `Cannot start MO in '${mo.status}' status. Status must be Confirmed or Ready.`,
    };
  }

  mo.status          = MO_STATUS.IN_PROGRESS;
  mo.actualStartDate = new Date();
  await mo.save();

  // Mark WO[seq=1] as Ready
  await WorkOrderService.markFirstWorkOrderReady(id);

  logger.info(`ManufacturingOrderService: started ${mo.moNumber}`);
  return _populateMO(mo._id);
};

// ─── COMPLETE MO: Consume + Produce ──────────────────────────────────────────

const completeManufacturingOrder = async (id, data = {}, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if (mo.status !== MO_STATUS.IN_PROGRESS) {
    throw {
      statusCode: 400,
      message: `Cannot complete MO in '${mo.status}' status. MO must be In Progress.`,
    };
  }

  const qtyProduced = data.quantityProduced
    ? parseInt(data.quantityProduced, 10)
    : mo.quantityToProduce;

  if (qtyProduced <= 0) {
    throw { statusCode: 400, message: 'Quantity produced must be greater than 0' };
  }
  if (qtyProduced > mo.quantityToProduce) {
    throw {
      statusCode: 400,
      message: `Quantity produced (${qtyProduced}) cannot exceed planned quantity (${mo.quantityToProduce})`,
    };
  }

  // Engine 2: Consume raw materials
  await ProductionExecutionService.consumeComponents(mo, qtyProduced, userId);

  // Engine 3: Produce finished goods
  await ProductionExecutionService.produceFinishedGoods(mo, qtyProduced, userId);

  // Force-complete any remaining WOs
  await WorkOrderService.completeAllRemainingWorkOrders(id);

  // Update MO
  mo.status           = MO_STATUS.COMPLETED;
  mo.quantityProduced = qtyProduced;
  mo.quantityRemaining = Math.max(0, mo.quantityToProduce - qtyProduced);
  mo.actualEndDate    = new Date();
  if (data.remarks !== undefined) mo.remarks = data.remarks;
  await mo.save();

  logger.info(`ManufacturingOrderService: completed ${mo.moNumber} — produced ${qtyProduced}`);
  return _populateMO(mo._id);
};

// ─── CANCEL MO ────────────────────────────────────────────────────────────────

const cancelManufacturingOrder = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };

  if ([MO_STATUS.COMPLETED, MO_STATUS.CANCELLED].includes(mo.status)) {
    throw { statusCode: 400, message: `Cannot cancel MO in '${mo.status}' status.` };
  }

  // Release any reserved components
  if ([MO_STATUS.CONFIRMED, MO_STATUS.READY, MO_STATUS.IN_PROGRESS].includes(mo.status)) {
    await ProductionExecutionService.releaseComponents(mo, userId);
  }

  // Cancel all active Work Orders
  await WorkOrderService.cancelAllWorkOrdersForMO(id);

  mo.status = MO_STATUS.CANCELLED;
  await mo.save();

  logger.info(`ManufacturingOrderService: cancelled ${mo.moNumber}`);
  return _populateMO(mo._id);
};

// ─── PHASE 5 HOOK: Auto-Schedule MO from Sales Order ─────────────────────────
/**
 * Called by ProcurementAutomationService (Phase 5) when a confirmed SO
 * line item has procurementType = 'MANUFACTURING'.
 *
 * @param {string} salesOrderId    - ID of the originating Sales Order
 * @param {Object} lineItem        - { productId, quantity }
 * @param {string} userId          - User performing the action
 * @returns {Object}               - { mo, capacityReport }
 */
const scheduleFromSalesOrder = async (salesOrderId, lineItem, userId) => {
  // 1. Find active BoM for product
  const bom = await BoMService.getActiveBOMForProduct(lineItem.productId);
  if (!bom) {
    throw {
      statusCode: 400,
      message: `No active BoM found for product ${lineItem.productId}. Cannot auto-schedule MO.`,
    };
  }

  // 2. Check capacity
  const capacityReport = await CapacityPlanningService.checkCapacityForMO(
    bom._id,
    lineItem.quantity,
    new Date()
  );

  // 3. Get scheduling suggestion
  const schedule = await CapacityPlanningService.suggestSchedulingDates(bom._id, lineItem.quantity);

  // 4. Create Draft MO with SO linkage
  const mo = await createManufacturingOrder({
    productId:          lineItem.productId,
    bomId:              bom._id,
    quantityToProduce:  lineItem.quantity,
    plannedStartDate:   capacityReport.suggestedStart,
    plannedEndDate:     schedule.suggestedEndDate,
    remarks:            `Auto-scheduled from Sales Order ${salesOrderId}`,
    originatingSalesOrderId:   salesOrderId,
    originatingSalesOrderLine: lineItem._id || null,
  }, userId);

  // 5. Auto-confirm (reserve + generate WOs)
  const confirmedMO = await confirmManufacturingOrder(mo._id, userId);

  logger.info(`ManufacturingOrderService [Phase5]: auto-scheduled MO ${confirmedMO.moNumber} from SO ${salesOrderId}`);
  return { mo: confirmedMO, capacityReport };
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

module.exports = {
  createManufacturingOrder,
  getAllManufacturingOrders,
  getManufacturingOrderById,
  updateManufacturingOrder,
  confirmManufacturingOrder,
  startManufacturingOrder,
  completeManufacturingOrder,
  cancelManufacturingOrder,
  // Phase 5 hook
  scheduleFromSalesOrder,
};
