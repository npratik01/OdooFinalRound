'use strict';

const mongoose = require('mongoose');

// ─── Work Order Status ────────────────────────────────────────────────────────
const WO_STATUS = Object.freeze({
  PENDING:     'Pending',
  READY:       'Ready',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
});

// ─── Work Order Schema ────────────────────────────────────────────────────────
const workOrderSchema = new mongoose.Schema({
  workOrderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  manufacturingOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManufacturingOrder',
    required: true,
    index: true,
  },
  operationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operation',
    required: true,
  },
  workCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
    min: 1,
  },
  plannedDurationMinutes: {
    type: Number,
    default: 0,
  },
  actualDurationMinutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(WO_STATUS),
    default: WO_STATUS.PENDING,
    index: true,
  },
  assignedOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  remarks: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = {
  WorkOrder: mongoose.model('WorkOrder', workOrderSchema),
  WO_STATUS,
};
