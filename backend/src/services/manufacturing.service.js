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
  });

  await mo.save();
  logger.info(`Manufacturing Order created: ${moNumber}`);
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

const confirmManufacturingOrder = async (id) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  if (mo.status !== MO_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Cannot confirm MO in '${mo.status}' status. Must be DRAFT.` };
  }

  // Check component availability (freeToUseQty)
  const shortages = [];
  for (const comp of mo.components) {
    const inv = await Inventory.findOne({ productId: comp.productId });
    if (!inv) {
      shortages.push(`No inventory record for component ${comp.productId}`);
      continue;
    }
    const freeQty = Math.max(0, inv.onHandQty - inv.reservedQty);
    if (comp.requiredQty > freeQty) {
      shortages.push(`Insufficient stock for component ${comp.productId}: need ${comp.requiredQty}, available ${freeQty}`);
    }
  }

  if (shortages.length > 0) {
    throw { statusCode: 400, message: `Component shortage detected:\n${shortages.join('\n')}` };
  }

  mo.status = MO_STATUS.CONFIRMED;
  await mo.save();
  logger.info(`Manufacturing Order confirmed: ${mo.moNumber}`);
  return populateMO(mo._id);
};

// ─── START PRODUCTION — Reserve Components ────────────────────────────────────

const startProduction = async (id, userId) => {
  const mo = await ManufacturingOrder.findById(id);
  if (!mo) throw { statusCode: 404, message: 'Manufacturing Order not found' };
  if (mo.status !== MO_STATUS.CONFIRMED) {
    throw { statusCode: 400, message: `Cannot start production for MO in '${mo.status}' status. Must be CONFIRMED.` };
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
  }

  mo.status = MO_STATUS.CANCELLED;
  await mo.save();
  logger.info(`Manufacturing Order cancelled: ${mo.moNumber}`);
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
};
