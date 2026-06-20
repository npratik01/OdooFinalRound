'use strict';

const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true // positive for additions/receipts, negative for reductions/shipments
  },
  movementType: {
    type: String,
    enum: ['RECEIPT', 'DELIVERY', 'ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE'],
    required: true,
    index: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  referenceModel: {
    type: String,
    enum: ['SalesOrder', 'Delivery', 'Inventory'],
    required: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
