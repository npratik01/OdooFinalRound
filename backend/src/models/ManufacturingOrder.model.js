'use strict';

const mongoose = require('mongoose');

// ─── MO Status constants ───────────────────────────────────────────────────────
const MO_STATUS = Object.freeze({
  DRAFT:                  'DRAFT',
  CONFIRMED:              'CONFIRMED',
  WAITING_FOR_COMPONENTS: 'WAITING_FOR_COMPONENTS',
  IN_PROGRESS:            'IN_PROGRESS',
  DONE:                   'DONE',
  CANCELLED:              'CANCELLED',
  REJECTED:               'REJECTED',   // Manager explicitly rejected the auto-created MO
});

// ─── MO Component Sub-Schema ──────────────────────────────────────────────────
const moComponentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    requiredQty: {
      type: Number,
      required: true,
      min: [0, 'Required quantity cannot be negative'],
    },
    consumedQty: {
      type: Number,
      default: 0,
      min: [0, 'Consumed quantity cannot be negative'],
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
  },
  { _id: true }
);

// ─── Manufacturing Order Schema ───────────────────────────────────────────────
const manufacturingOrderSchema = new mongoose.Schema(
  {
    moNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated before save
    },
    bomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillOfMaterials',
      required: [true, 'Bill of Materials is required'],
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
      index: true,
    },
    workCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
      default: null,
    },
    plannedQty: {
      type: Number,
      required: [true, 'Planned quantity is required'],
      min: [1, 'Planned quantity must be at least 1'],
    },
    producedQty: {
      type: Number,
      default: 0,
      min: [0, 'Produced quantity cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(MO_STATUS),
      default: MO_STATUS.DRAFT,
      index: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    components: {
      type: [moComponentSchema],
      default: [],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    // ─── Procurement Automation fields ────────────────────────────────────────
    linkedSoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      default: null,
    },
    componentPOs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'PurchaseOrder',
      default: [],
    },
    // ─── Automation tracking fields ───────────────────────────────────────────
    // Mirror of linkedSoId.soNumber for quick display without populate
    sourceSalesOrderNumber: {
      type: String,
      trim: true,
      default: null,
    },
    // True when this MO was generated automatically by the ERP Orchestrator
    createdAutomatically: {
      type: Boolean,
      default: false,
    },
    // Alias kept consistent with user request spec
    createdByAutomation: {
      type: Boolean,
      default: false,
    },
    // How many units the originating Sales Order demanded
    pendingDemandQty: {
      type: Number,
      default: null,
    },
    // Optional rejection reason
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
manufacturingOrderSchema.virtual('remainingQty').get(function () {
  return Math.max(0, this.plannedQty - this.producedQty);
});

manufacturingOrderSchema.virtual('completionPercentage').get(function () {
  if (!this.plannedQty) return 0;
  return Math.round((this.producedQty / this.plannedQty) * 100);
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
manufacturingOrderSchema.index({ moNumber: 1 });
manufacturingOrderSchema.index({ status: 1, createdAt: -1 });
manufacturingOrderSchema.index({ productId: 1, status: 1 });
manufacturingOrderSchema.index({ scheduledDate: 1 });

const ManufacturingOrder = mongoose.model('ManufacturingOrder', manufacturingOrderSchema);

module.exports = { ManufacturingOrder, MO_STATUS };
