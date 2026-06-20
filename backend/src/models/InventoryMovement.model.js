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
    enum: [
      // Phase 2 — Sales
      'SALES_RESERVATION',
      'SALES_DELIVERY',
      'RESERVATION_RELEASE',
      // Phase 1 — Manual
      'STOCK_ADJUSTMENT',
      'RECEIPT',
      // Phase 3 — Procurement
      'PURCHASE_RECEIPT',
      'PURCHASE_RETURN',
      'PURCHASE_ADJUSTMENT',
      // Phase 4 — Manufacturing
      'MFG_COMPONENT_CONSUME',
      'MFG_OUTPUT_PRODUCE',
      'MFG_SCRAP',
    ],
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
    enum: [
      // Phase 2
      'SalesOrder',
      'Delivery',
      // Phase 1
      'Inventory',
      // Phase 3
      'PurchaseOrder',
      'GoodsReceipt',
      // Phase 4
      'ManufacturingOrder',
    ],
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
