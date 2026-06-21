'use strict';

const mongoose = require('mongoose');

const PO_STATUS = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  CANCELLED: 'Cancelled',
};

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: [0, 'Received quantity cannot be negative'],
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor ID is required'],
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    items: {
      type: [purchaseOrderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Purchase Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(PO_STATUS),
      default: PO_STATUS.DRAFT,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: pendingQtyTotal ─────────────────────────────────────────────
purchaseOrderSchema.virtual('pendingQtyTotal').get(function () {
  if (!this.items) return 0;
  return this.items.reduce((sum, item) => sum + Math.max(0, item.quantity - item.receivedQty), 0);
});

// ─── Indexes ─────────────────────────────────────────────────────────────
// poNumber index created automatically via unique:true
purchaseOrderSchema.index({ vendorId: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ createdBy: 1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = { PurchaseOrder, PO_STATUS };
