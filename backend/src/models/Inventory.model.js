'use strict';

const mongoose = require('mongoose');
const { STOCK_STATUS } = require('../constants/stockStatus');

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      unique: true, // One inventory record per product
    },
    onHandQty: {
      type: Number,
      min: [0, 'On-hand quantity cannot be negative'],
      default: 0,
    },
    reservedQty: {
      type: Number,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0,
    },
    minimumStockLevel: {
      type: Number,
      min: [0, 'Minimum stock level cannot be negative'],
      default: 0,
    },
    stockStatus: {
      type: String,
      enum: Object.values(STOCK_STATUS),
      default: STOCK_STATUS.NORMAL,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: freeToUseQty ────────────────────────────────────────────────
inventorySchema.virtual('freeToUseQty').get(function () {
  return Math.max(0, this.onHandQty - this.reservedQty);
});

// ─── Pre-save: Compute stockStatus ────────────────────────────────────────
inventorySchema.pre('save', function (next) {
  // Validate reservedQty doesn't exceed onHandQty
  if (this.reservedQty > this.onHandQty) {
    return next(new Error('Reserved quantity cannot exceed on-hand quantity'));
  }

  // Compute stock status
  this.stockStatus =
    this.onHandQty <= this.minimumStockLevel
      ? STOCK_STATUS.LOW_STOCK
      : STOCK_STATUS.NORMAL;

  next();
});

// ─── Pre-findOneAndUpdate: Compute stockStatus ────────────────────────────
inventorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    const onHandQty = update.$set.onHandQty;
    const reservedQty = update.$set.reservedQty;
    const minimumStockLevel = update.$set.minimumStockLevel;

    if (onHandQty !== undefined && minimumStockLevel !== undefined) {
      update.$set.stockStatus =
        onHandQty <= minimumStockLevel ? STOCK_STATUS.LOW_STOCK : STOCK_STATUS.NORMAL;
    }
  }
  next();
});

// ─── Indexes ─────────────────────────────────────────────────────────────
inventorySchema.index({ productId: 1 });
inventorySchema.index({ stockStatus: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
