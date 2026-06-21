'use strict';

const { PurchaseOrder, PO_STATUS } = require('../models/PurchaseOrder.model');
const GoodsReceipt = require('../models/GoodsReceipt.model');
const Vendor = require('../models/Vendor.model');
const Inventory = require('../models/Inventory.model');
const inventoryService = require('./inventory.service');
const movementService = require('./inventoryMovement.service');
const { generatePONumber } = require('../utils/poNumberGenerator');
const { generateGRNumber } = require('../utils/grNumberGenerator');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const populatePO = (id) =>
  PurchaseOrder.findById(id)
    .populate('vendorId', 'vendorCode vendorName contactPerson email phone rating leadTimeDays')
    .populate('items.productId', 'productName sku costPrice')
    .populate('createdBy', 'name email role');

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PURCHASE ORDER (Draft)
// ─────────────────────────────────────────────────────────────────────────────

const createPurchaseOrder = async (poData, userId) => {
  // Validate vendor exists and is active
  const vendor = await Vendor.findById(poData.vendorId);
  if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
  if (!vendor.isActive) throw { statusCode: 400, message: 'Cannot create PO for an inactive vendor' };

  const poNumber = await generatePONumber();

  // Build items with totalCost
  const items = (poData.items || []).map((item) => {
    const qty = parseInt(item.quantity, 10);
    const cost = parseFloat(item.unitCost);
    return {
      productId: item.productId,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost,
      receivedQty: 0,
    };
  });

  if (items.length === 0) {
    throw { statusCode: 400, message: 'Purchase Order must have at least one item' };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

  const po = new PurchaseOrder({
    poNumber,
    vendorId: poData.vendorId,
    orderDate: poData.orderDate || new Date(),
    expectedDeliveryDate: poData.expectedDeliveryDate || null,
    items,
    totalAmount,
    status: PO_STATUS.DRAFT,
    remarks: poData.remarks || '',
    createdBy: userId,
  });

  await po.save();
  logger.info(`Purchase Order created: ${poNumber}`);
  return populatePO(po._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PURCHASE ORDERS
// ─────────────────────────────────────────────────────────────────────────────

const getAllPurchaseOrders = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.status)   filter.status   = query.status;
  if (query.vendorId) filter.vendorId = query.vendorId;
  if (query.search)   filter.poNumber = new RegExp(query.search, 'i');

  const [orders, total] = await Promise.all([
    PurchaseOrder.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vendorId', 'vendorCode vendorName rating')
      .populate('createdBy', 'name'),
    PurchaseOrder.countDocuments(filter),
  ]);

  return {
    orders,
    meta: buildPaginationMeta(total, page, limit),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PO BY ID
// ─────────────────────────────────────────────────────────────────────────────

const getPurchaseOrderById = async (id) => {
  const po = await populatePO(id);
  if (!po) throw { statusCode: 404, message: 'Purchase Order not found' };
  return po;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PURCHASE ORDER (Draft only)
// ─────────────────────────────────────────────────────────────────────────────

const updatePurchaseOrder = async (id, updateData) => {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw { statusCode: 404, message: 'Purchase Order not found' };

  if (po.status !== PO_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Cannot edit PO in '${po.status}' status. Only Draft POs can be edited.` };
  }

  if (updateData.vendorId) {
    const vendor = await Vendor.findById(updateData.vendorId);
    if (!vendor) throw { statusCode: 404, message: 'Vendor not found' };
    if (!vendor.isActive) throw { statusCode: 400, message: 'Cannot assign an inactive vendor' };
    po.vendorId = updateData.vendorId;
  }

  if (updateData.items) {
    const items = updateData.items.map((item) => {
      const qty = parseInt(item.quantity, 10);
      const cost = parseFloat(item.unitCost);
      return {
        productId: item.productId,
        quantity: qty,
        unitCost: cost,
        totalCost: qty * cost,
        receivedQty: 0,
      };
    });
    po.items = items;
    po.totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
  }

  if (updateData.orderDate)           po.orderDate           = updateData.orderDate;
  if (updateData.expectedDeliveryDate !== undefined) po.expectedDeliveryDate = updateData.expectedDeliveryDate;
  if (updateData.remarks !== undefined) po.remarks = updateData.remarks;

  await po.save();
  return populatePO(po._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM PURCHASE ORDER (Draft → Confirmed)
// ─────────────────────────────────────────────────────────────────────────────

const confirmPurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw { statusCode: 404, message: 'Purchase Order not found' };

  if (po.status !== PO_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Cannot confirm PO in '${po.status}' status. Status must be Draft.` };
  }

  // Validate inventory records exist for all products
  for (const item of po.items) {
    const inv = await Inventory.findOne({ productId: item.productId });
    if (!inv) {
      throw { statusCode: 400, message: `No inventory record found for product ID ${item.productId}. Create an inventory record first.` };
    }
  }

  po.status = PO_STATUS.CONFIRMED;
  await po.save();
  logger.info(`Purchase Order confirmed: ${po.poNumber}`);
  return populatePO(po._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL PURCHASE ORDER
// ─────────────────────────────────────────────────────────────────────────────

const cancelPurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw { statusCode: 404, message: 'Purchase Order not found' };

  if ([PO_STATUS.FULLY_RECEIVED, PO_STATUS.CANCELLED].includes(po.status)) {
    throw { statusCode: 400, message: `Cannot cancel PO in '${po.status}' status.` };
  }

  if (po.status === PO_STATUS.PARTIALLY_RECEIVED) {
    throw { statusCode: 400, message: 'Cannot cancel a Partially Received PO. Goods have already been received.' };
  }

  po.status = PO_STATUS.CANCELLED;
  await po.save();
  logger.info(`Purchase Order cancelled: ${po.poNumber}`);
  return populatePO(po._id);
};

// ─────────────────────────────────────────────────────────────────────────────
// RECEIVE GOODS — Core Receipt Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processes a Goods Receipt against a confirmed/partially received PO.
 * 
 * For each item received:
 *  1. Validates quantity does not exceed pending qty
 *  2. Increases inventory via inventoryService.increaseStock()
 *  3. Creates InventoryMovement with type PURCHASE_RECEIPT
 *  4. Updates PO item receivedQty
 * 
 * Then:
 *  5. Creates GoodsReceipt document
 *  6. Updates PO status (Partially Received or Fully Received)
 */
const receiveGoods = async (poId, receiptData, userId) => {
  const po = await PurchaseOrder.findById(poId);
  if (!po) throw { statusCode: 404, message: 'Purchase Order not found' };

  if (![PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED].includes(po.status)) {
    throw {
      statusCode: 400,
      message: `Cannot receive goods for PO in '${po.status}' status. PO must be Confirmed or Partially Received.`,
    };
  }

  const receiptItems = receiptData.items || [];
  if (receiptItems.length === 0) {
    throw { statusCode: 400, message: 'Goods Receipt must have at least one item' };
  }

  // Build a map for quick lookup of PO items
  const poItemMap = {};
  for (const item of po.items) {
    poItemMap[item.productId.toString()] = item;
  }

  // Validate all receipt items before making any changes
  for (const receiptItem of receiptItems) {
    const pidStr = receiptItem.productId.toString();
    const poItem = poItemMap[pidStr];

    if (!poItem) {
      throw { statusCode: 400, message: `Product ID ${receiptItem.productId} is not in this Purchase Order` };
    }

    const pendingQty = poItem.quantity - poItem.receivedQty;
    if (receiptItem.quantityReceived > pendingQty) {
      throw {
        statusCode: 400,
        message: `Cannot receive ${receiptItem.quantityReceived} units for product ${receiptItem.productId}. Only ${pendingQty} units are pending.`,
      };
    }

    if (receiptItem.quantityReceived <= 0) {
      throw { statusCode: 400, message: 'Quantity received must be greater than 0' };
    }
  }

  // Generate GR number
  const grNumber = await generateGRNumber();

  // Process each receipt item
  const grItems = [];
  for (const receiptItem of receiptItems) {
    const pidStr = receiptItem.productId.toString();
    const poItem = poItemMap[pidStr];
    const qtyToReceive = parseInt(receiptItem.quantityReceived, 10);

    // 1. Get current inventory for movement record
    const inventory = await Inventory.findOne({ productId: receiptItem.productId });
    if (!inventory) {
      throw { statusCode: 400, message: `No inventory record found for product ${receiptItem.productId}` };
    }

    const previousQty = inventory.onHandQty;

    // 2. Increase inventory using the Phase 1 inventory service
    //    We call increaseStock directly then override the movement type
    inventory.onHandQty += qtyToReceive;
    const { STOCK_STATUS } = require('../constants/stockStatus');
    inventory.stockStatus =
      inventory.onHandQty <= inventory.minimumStockLevel
        ? STOCK_STATUS.LOW_STOCK
        : STOCK_STATUS.NORMAL;
    await inventory.save({ validateBeforeSave: false });

    const newQty = inventory.onHandQty;

    // 3. Create PURCHASE_RECEIPT inventory movement
    await movementService.createMovement({
      productId: receiptItem.productId,
      movementType: 'PURCHASE_RECEIPT',
      quantity: qtyToReceive,
      previousQty,
      newQty,
      referenceType: 'PurchaseOrder',
      referenceId: poId,
      remarks: receiptItem.remarks || `Goods Receipt ${grNumber} — PO ${po.poNumber}`,
      createdBy: userId,
    });

    // 4. Update PO item receivedQty
    poItem.receivedQty += qtyToReceive;

    grItems.push({
      productId: receiptItem.productId,
      quantityReceived: qtyToReceive,
      remarks: receiptItem.remarks || '',
    });
  }

  // 5. Create GoodsReceipt document
  const goodsReceipt = new GoodsReceipt({
    grNumber,
    poId,
    receiptDate: receiptData.receiptDate || new Date(),
    items: grItems,
    receivedBy: userId,
    remarks: receiptData.remarks || '',
  });

  await goodsReceipt.save();

  // 6. Determine new PO status
  const allFullyReceived = po.items.every((item) => item.receivedQty >= item.quantity);
  const anyReceived = po.items.some((item) => item.receivedQty > 0);

  if (allFullyReceived) {
    po.status = PO_STATUS.FULLY_RECEIVED;
  } else if (anyReceived) {
    po.status = PO_STATUS.PARTIALLY_RECEIVED;
  }

  await po.save();

  logger.info(`Goods Receipt processed: ${grNumber} for PO ${po.poNumber}. New status: ${po.status}`);

  // ── Procurement Automation Hook: try to unblock waiting MOs ─────────────
  // Non-blocking: GRN success is never affected by MO resume errors.
  try {
    const procurementAutomation = require('./procurementAutomation.service');
    await procurementAutomation.resumeManufacturingAfterReceipt(poId, userId);
  } catch (hookErr) {
    logger.warn(`[PURCHASE] procurementAutomation hook failed after GRN ${grNumber}:`, hookErr.message);
  }

  return {
    goodsReceipt: await GoodsReceipt.findById(goodsReceipt._id)
      .populate('poId', 'poNumber vendorId status')
      .populate('items.productId', 'productName sku')
      .populate('receivedBy', 'name email'),
    purchaseOrder: await populatePO(po._id),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET RECEIPTS FOR A PO
// ─────────────────────────────────────────────────────────────────────────────

const getReceiptsByPO = async (poId) => {
  const receipts = await GoodsReceipt.find({ poId })
    .sort({ receiptDate: -1 })
    .populate('items.productId', 'productName sku')
    .populate('receivedBy', 'name email');

  return receipts;
};

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  receiveGoods,
  getReceiptsByPO,
};
