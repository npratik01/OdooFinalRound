'use strict';

const mongoose = require('mongoose');

// ─── MO Status ────────────────────────────────────────────────────────────────
const MO_STATUS = Object.freeze({
  DRAFT:       'Draft',
  CONFIRMED:   'Confirmed',
  READY:       'Ready',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
});

// ─── Manufacturing Order Schema ───────────────────────────────────────────────
const manufacturingOrderSchema = new mongoose.Schema({
  moNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  bomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOM',
    required: true,
    index: true,
  },
  quantityToProduce: {
    type: Number,
    required: true,
    min: [1, 'Quantity to produce must be at least 1'],
  },
  quantityProduced: {
    type: Number,
    default: 0,
    min: 0,
  },
  quantityRemaining: {
    type: Number,
    default: 0,
    min: 0,
  },
  plannedStartDate: {
    type: Date,
    default: null,
  },
  plannedEndDate: {
    type: Date,
    default: null,
  },
  actualStartDate: {
    type: Date,
    default: null,
  },
  actualEndDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: Object.values(MO_STATUS),
    default: MO_STATUS.DRAFT,
    index: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Snapshot of component requirements at time of confirmation
  componentRequirements: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantityRequired: Number,
    quantityConsumed: {
      type: Number,
      default: 0,
    },
    unit: String,
    _id: false,
  }],
  remarks: {
    type: String,
    default: '',
    trim: true,
  },
  originatingSalesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    default: null,
    index: true,
  },
  originatingSalesOrderLine: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Pre-save: compute quantityRemaining
manufacturingOrderSchema.pre('save', function (next) {
  this.quantityRemaining = Math.max(0, this.quantityToProduce - this.quantityProduced);
  next();
});

module.exports = {
  ManufacturingOrder: mongoose.model('ManufacturingOrder', manufacturingOrderSchema),
  MO_STATUS,
};
