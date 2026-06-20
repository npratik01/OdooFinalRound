'use strict';

const SalesOrder = require('../models/SalesOrder.model');
const Inventory = require('../models/Inventory.model');
const inventoryService = require('./inventory.service');
const movementService = require('./inventoryMovement.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Generates sequential SO Number (SO-YYYY-XXXX).
 */
const generateSONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}`;

  const count = await SalesOrder.countDocuments({
    soNumber: { $regex: `^${prefix}` }
  });

  const sequence = String(count + 1).padStart(4, '0');
  const soNumber = `${prefix}-${sequence}`;

  const exists = await SalesOrder.findOne({ soNumber });
  if (exists) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return generateSONumber();
  }

  return soNumber;
};

/**
 * Create a new Sales Order (Draft by default).
 */
const createSalesOrder = async (orderData, userId) => {
  const soNumber = await generateSONumber();
  
  // Calculate pricing
  const items = (orderData.items || []).map(item => {
    const qty = parseInt(item.quantity, 10);
    const price = parseFloat(item.unitPrice);
    return {
      productId: item.productId,
      quantity: qty,
      unitPrice: price,
      totalPrice: qty * price
    };
  });

  if (items.length === 0) {
    throw { statusCode: 400, message: 'Sales Order must have at least one product item.' };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const order = new SalesOrder({
    soNumber,
    customerId: orderData.customerId,
    orderDate: orderData.orderDate || new Date(),
    items,
    totalAmount,
    status: 'Draft',
    remarks: orderData.remarks || '',
    createdBy: userId
  });

  await order.save();
  return getSalesOrderById(order._id);
};

/**
 * Get Sales Order by ID with populated Customer and Products.
 */
const getSalesOrderById = async (id) => {
  const order = await SalesOrder.findById(id)
    .populate('customerId')
    .populate('items.productId')
    .populate('createdBy', 'name email role');
    
  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }
  return order;
};

/**
 * Update a Sales Order (only allowed in Draft status).
 */
const updateSalesOrder = async (id, updateData) => {
  const order = await SalesOrder.findById(id);
  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }

  if (order.status !== 'Draft') {
    throw { statusCode: 400, message: `Cannot edit order in '${order.status}' status. Only Draft orders can be edited.` };
  }

  // If customer or items are being updated, recalculate totals
  if (updateData.items) {
    const items = updateData.items.map(item => {
      const qty = parseInt(item.quantity, 10);
      const price = parseFloat(item.unitPrice);
      return {
        productId: item.productId,
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price
      };
    });
    order.items = items;
    order.totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  if (updateData.customerId) order.customerId = updateData.customerId;
  if (updateData.orderDate) order.orderDate = updateData.orderDate;
  if (updateData.remarks !== undefined) order.remarks = updateData.remarks;

  await order.save();
  return getSalesOrderById(order._id);
};

/**
 * Confirm a Sales Order (Stock Reservation).
 */
const confirmSalesOrder = async (id, userId) => {
  const order = await SalesOrder.findById(id);
  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }

  if (order.status !== 'Draft') {
    throw { statusCode: 400, message: `Cannot confirm order in '${order.status}' status. Status must be Draft.` };
  }

  // 1. Stock availability validation
  for (const item of order.items) {
    const inventory = await Inventory.findOne({ productId: item.productId });
    if (!inventory) {
      throw { statusCode: 400, message: `Inventory record does not exist for product ID ${item.productId}` };
    }
    const freeQty = Math.max(0, inventory.onHandQty - inventory.reservedQty);
    if (item.quantity > freeQty) {
      throw {
        statusCode: 400,
        message: `Insufficient stock for product. Requested: ${item.quantity}, Available Free Qty: ${freeQty}`
      };
    }
  }

  // 2. Perform Stock Reservations
  for (const item of order.items) {
    await inventoryService.reserveStock(item.productId, item.quantity);
    
    // Log Reservation movement
    await movementService.createMovement({
      productId: item.productId,
      quantity: -item.quantity, // reserve acts as temporary hold
      movementType: 'RESERVATION',
      referenceId: order._id,
      referenceModel: 'SalesOrder',
      description: `Reserved stock for Sales Order ${order.soNumber}`,
      performedBy: userId
    });
  }

  order.status = 'Confirmed';
  await order.save();

  return getSalesOrderById(order._id);
};

/**
 * Cancel a Sales Order (Releases reserved stock if Confirmed or Partially Delivered).
 */
const cancelSalesOrder = async (id, userId) => {
  const order = await SalesOrder.findById(id)
    .populate('items.productId');

  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }

  if (['Fully Delivered', 'Cancelled'].includes(order.status)) {
    throw { statusCode: 400, message: `Cannot cancel order in '${order.status}' status.` };
  }

  // If order was Confirmed, we must release the reserved stock
  if (order.status === 'Confirmed') {
    for (const item of order.items) {
      await inventoryService.releaseStock(item.productId, item.quantity);

      // Log movement release
      await movementService.createMovement({
        productId: item.productId,
        quantity: item.quantity,
        movementType: 'RESERVATION_RELEASE',
        referenceId: order._id,
        referenceModel: 'SalesOrder',
        description: `Released reserved stock due to cancellation of SO ${order.soNumber}`,
        performedBy: userId
      });
    }
  }

  order.status = 'Cancelled';
  await order.save();

  return getSalesOrderById(order._id);
};

/**
 * Get all Sales Orders (paginated, sorted, searchable).
 */
const getAllSalesOrders = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.customerId) {
    filter.customerId = query.customerId;
  }

  if (query.search) {
    filter.soNumber = new RegExp(query.search, 'i');
  }

  const [orders, total] = await Promise.all([
    SalesOrder.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'customerName customerCode')
      .populate('createdBy', 'name'),
    SalesOrder.countDocuments(filter)
  ]);

  return {
    orders,
    meta: buildPaginationMeta(total, page, limit)
  };
};

module.exports = {
  createSalesOrder,
  getSalesOrderById,
  updateSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
  getAllSalesOrders
};
