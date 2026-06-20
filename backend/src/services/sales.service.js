'use strict';

const SalesOrder = require('../models/SalesOrder.model');
const Inventory = require('../models/Inventory.model');
const Delivery = require('../models/Delivery.model');
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

  // 1. Confirm the order status first
  order.status = 'Confirmed';
  await order.save();

  // 2. Invoke central ERP workflow orchestration brain to reserve stock / trigger auto-replenishment (PO/MO)
  const erpWorkflowService = require('./erpWorkflow.service');
  await erpWorkflowService.handleSalesOrderConfirmed(order._id, userId);

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

  // If order has reserved stock (Confirmed or Partially Delivered), release the remaining reserved qty
  if (['Confirmed', 'Partially Delivered'].includes(order.status)) {
    // For Partially Delivered: find how much has already been physically shipped
    const previousDeliveries = await Delivery.find({ soId: order._id });
    const deliveredMap = {};
    for (const del of previousDeliveries) {
      for (const item of del.items) {
        const pid = item.productId.toString();
        deliveredMap[pid] = (deliveredMap[pid] || 0) + item.quantityShipped;
      }
    }

    for (const item of order.items) {
      const pid = item.productId._id ? item.productId._id.toString() : item.productId.toString();
      const alreadyShipped = deliveredMap[pid] || 0;
      // Only release the still-reserved portion (ordered - shipped)
      const remainingReserved = Math.max(0, item.quantity - alreadyShipped);

      if (remainingReserved > 0) {
        await inventoryService.releaseStock(
          item.productId._id || item.productId,
          remainingReserved,
          userId,
          'SalesOrder',
          order._id,
          `Released ${remainingReserved} reserved units due to cancellation of SO ${order.soNumber}`
        );
      }
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

/**
 * Fully delivers all remaining quantities of a Sales Order.
 */
const deliverSalesOrder = async (id, userId) => {
  const order = await SalesOrder.findById(id);
  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }

  if (!['Confirmed', 'Partially Delivered'].includes(order.status)) {
    throw {
      statusCode: 400,
      message: `Cannot process delivery for order in '${order.status}' status. Order must be Confirmed or Partially Delivered.`
    };
  }

  // Find previous deliveries to calculate remaining quantity
  const previousDeliveries = await Delivery.find({ soId: id });
  const deliveredMap = {};
  for (const del of previousDeliveries) {
    for (const item of del.items) {
      const pid = item.productId.toString();
      deliveredMap[pid] = (deliveredMap[pid] || 0) + item.quantityShipped;
    }
  }

  const itemsToShip = [];
  for (const soItem of order.items) {
    const pidStr = soItem.productId.toString();
    const alreadyShipped = deliveredMap[pidStr] || 0;
    const remaining = soItem.quantity - alreadyShipped;

    if (remaining > 0) {
      itemsToShip.push({
        productId: soItem.productId,
        quantityShipped: remaining
      });
    }
  }

  if (itemsToShip.length === 0) {
    throw { statusCode: 400, message: 'All items of this Sales Order have already been fully delivered.' };
  }

  const deliveryService = require('./delivery.service');
  await deliveryService.processDelivery({
    soId: id,
    items: itemsToShip
  }, userId);

  return getSalesOrderById(id);
};

/**
 * Partially delivers specific quantities of a Sales Order.
 */
const partialDeliverSalesOrder = async (id, items, userId) => {
  const deliveryService = require('./delivery.service');
  await deliveryService.processDelivery({
    soId: id,
    items
  }, userId);

  return getSalesOrderById(id);
};

module.exports = {
  createSalesOrder,
  getSalesOrderById,
  updateSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
  getAllSalesOrders,
  deliverSalesOrder,
  partialDeliverSalesOrder
};
