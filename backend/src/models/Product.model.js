'use strict';

const mongoose = require('mongoose');
const {
  PRODUCT_TYPES,
  PROCUREMENT_STRATEGY,
  PROCUREMENT_TYPE,
} = require('../constants/stockStatus');

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated before save; not required in schema input
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    salesPrice: {
      type: Number,
      min: [0, 'Sales price cannot be negative'],
      default: 0,
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0,
    },
    productType: {
      type: String,
      enum: {
        values: Object.values(PRODUCT_TYPES),
        message: '{VALUE} is not a valid product type',
      },
      required: [true, 'Product type is required'],
    },
    procurementStrategy: {
      type: String,
      enum: {
        values: Object.values(PROCUREMENT_STRATEGY),
        message: '{VALUE} is not a valid procurement strategy',
      },
      required: [true, 'Procurement strategy is required'],
    },
    procurementType: {
      type: String,
      enum: {
        values: Object.values(PROCUREMENT_TYPE),
        message: '{VALUE} is not a valid procurement type',
      },
      required: [true, 'Procurement type is required'],
    },
    vendor: {
      type: String,
      trim: true,
      maxlength: [200, 'Vendor name cannot exceed 200 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
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

// ─── Indexes ─────────────────────────────────────────────────────────────
productSchema.index({ productName: 'text', sku: 'text', description: 'text' }); // Full-text search
productSchema.index({ sku: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdBy: 1 });

// ─── Virtual: inventory ───────────────────────────────────────────────────
productSchema.virtual('inventory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'productId',
  justOne: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
