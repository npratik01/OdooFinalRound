'use strict';

const mongoose = require('mongoose');

const goodsReceiptItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    quantityReceived: {
      type: Number,
      required: [true, 'Quantity received is required'],
      min: [1, 'Quantity received must be at least 1'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    grNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated
    },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase Order ID is required'],
    },
    receiptDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [goodsReceiptItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Goods Receipt must have at least one item',
      },
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Received by user is required'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────
// grNumber index created automatically via unique:true
goodsReceiptSchema.index({ poId: 1 });
goodsReceiptSchema.index({ receivedBy: 1 });
goodsReceiptSchema.index({ receiptDate: -1 });

const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema);

module.exports = GoodsReceipt;
