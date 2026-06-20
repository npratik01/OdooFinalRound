'use strict';

const Delivery = require('../models/Delivery.model');
const SalesOrder = require('../models/SalesOrder.model');
const inventoryService = require('./inventory.service');
const movementService = require('./inventoryMovement.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Generates next delivery number (DLV-YYYYMM-XXXX).
 */
const generateDeliveryNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `DLV-${year}${month}`;

  const count = await Delivery.countDocuments({
    deliveryNumber: { $regex: `^${prefix}` }
  });

  const sequence = String(count + 1).padStart(4, '0');
  const deliveryNumber = `${prefix}-${sequence}`;

  const exists = await Delivery.findOne({ deliveryNumber });
  if (exists) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return generateDeliveryNumber();
  }

  return deliveryNumber;
};

/**
 * Process a new delivery dispatch for a Sales Order.
 */
const processDelivery = async (deliveryData, userId) => {
  const { soId, items } = deliveryData;

  const order = await SalesOrder.findById(soId);
  if (!order) {
    throw { statusCode: 404, message: 'Sales Order not found' };
  }

  if (!['Confirmed', 'Partially Delivered'].includes(order.status)) {
    throw {
      statusCode: 400,
      message: `Cannot process delivery for order in '${order.status}' status. Order must be Confirmed or Partially Delivered.`
    };
  }

  // 1. Get already delivered quantities from previous deliveries
  const previousDeliveries = await Delivery.find({ soId });
  const deliveredMap = {};
  for (const del of previousDeliveries) {
    for (const item of del.items) {
      const pid = item.productId.toString();
      deliveredMap[pid] = (deliveredMap[pid] || 0) + item.quantityShipped;
    }
  }

  // 2. Validate dispatch quantities
  const validatedItems = [];
  for (const shipItem of items) {
    const pidStr = shipItem.productId.toString();
    const qtyShipped = parseInt(shipItem.quantityShipped, 10);

    if (qtyShipped <= 0) {
      throw { statusCode: 400, message: 'Shipped quantity must be greater than zero.' };
    }

    // Find in sales order
    const soItem = order.items.find(item => item.productId.toString() === pidStr);
    if (!soItem) {
      throw { statusCode: 400, message: `Product ${pidStr} is not part of this Sales Order.` };
    }

    const alreadyDelivered = deliveredMap[pidStr] || 0;
    const remaining = soItem.quantity - alreadyDelivered;

    if (qtyShipped > remaining) {
      throw {
        statusCode: 400,
        message: `Cannot ship ${qtyShipped} units. Only ${remaining} units remaining to ship for product (ordered: ${soItem.quantity}, shipped: ${alreadyDelivered}).`
      };
    }

    validatedItems.push({
      productId: shipItem.productId,
      quantityShipped: qtyShipped
    });
  }

  if (validatedItems.length === 0) {
    throw { statusCode: 400, message: 'Delivery must contain at least one valid item to ship.' };
  }

  // 3. Auto generate delivery code
  const deliveryNumber = await generateDeliveryNumber();

  const delivery = new Delivery({
    deliveryNumber,
    soId,
    items: validatedItems,
    shippedBy: userId
  });

  await delivery.save();

  // 4. Update Inventory & create log entries
  for (const item of validatedItems) {
    // Deducts on-hand stock and releases reservedQty simultaneously
    await inventoryService.shipStock(
      item.productId,
      item.quantityShipped,
      userId,
      'Delivery',
      delivery._id,
      `Shipped stock for Delivery ${deliveryNumber} (SO: ${order.soNumber})`
    );
  }

  // 5. Update Sales Order status
  // Update map with new shipped quantities
  for (const item of validatedItems) {
    const pidStr = item.productId.toString();
    deliveredMap[pidStr] = (deliveredMap[pidStr] || 0) + item.quantityShipped;
  }

  let fullyDelivered = true;
  for (const soItem of order.items) {
    const pidStr = soItem.productId.toString();
    const totalShipped = deliveredMap[pidStr] || 0;
    if (totalShipped < soItem.quantity) {
      fullyDelivered = false;
      break;
    }
  }

  order.status = fullyDelivered ? 'Fully Delivered' : 'Partially Delivered';
  await order.save();

  return delivery;
};

/**
 * Fetch all Deliveries (paginated, filterable by sales order).
 */
const getAllDeliveries = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.soId) filter.soId = query.soId;

  const [deliveries, total] = await Promise.all([
    Delivery.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('soId', 'soNumber')
      .populate('items.productId', 'productName sku')
      .populate('shippedBy', 'name'),
    Delivery.countDocuments(filter)
  ]);

  return {
    deliveries,
    meta: buildPaginationMeta(total, page, limit)
  };
};

module.exports = {
  processDelivery,
  getAllDeliveries
};
