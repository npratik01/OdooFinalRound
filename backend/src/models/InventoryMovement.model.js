'use strict';

const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  movementType: {
    type: String,
    enum: ['SALES_RESERVATION', 'SALES_DELIVERY', 'STOCK_ADJUSTMENT', 'RESERVATION_RELEASE', 'RECEIPT'],
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQty: {
    type: Number,
    required: true,
    default: 0
  },
  newQty: {
    type: Number,
    required: true,
    default: 0
  },
  referenceType: {
    type: String,
    enum: ['SalesOrder', 'Delivery', 'Inventory'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
