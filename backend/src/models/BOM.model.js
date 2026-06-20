'use strict';

const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const bomComponentSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantityRequired: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be greater than 0'],
  },
  unit: {
    type: String,
    default: 'Units',
    trim: true,
  },
}, { _id: false });

const bomOperationSchema = new mongoose.Schema({
  operationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operation',
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false });

// ─── BoM Status ───────────────────────────────────────────────────────────────
const BOM_STATUS = Object.freeze({
  DRAFT:    'Draft',
  ACTIVE:   'Active',
  ARCHIVED: 'Archived',
});

// ─── BoM Schema ──────────────────────────────────────────────────────────────
const bomSchema = new mongoose.Schema({
  bomCode: {
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
  version: {
    type: String,
    default: '1.0',
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(BOM_STATUS),
    default: BOM_STATUS.DRAFT,
    index: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  components: {
    type: [bomComponentSchema],
    default: [],
  },
  operations: {
    type: [bomOperationSchema],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index — one active BoM per product
bomSchema.index({ productId: 1, status: 1 });

module.exports = {
  BOM: mongoose.model('BOM', bomSchema),
  BOM_STATUS,
};
