'use strict';

const mongoose = require('mongoose');

// ─── BoM Component Sub-Schema ─────────────────────────────────────────────────
const bomComponentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Component product is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Component quantity is required'],
      min: [0.001, 'Component quantity must be greater than 0'],
    },
    uom: {
      type: String,
      trim: true,
      default: 'units',
    },
  },
  { _id: true }
);

// ─── Bill of Materials Schema ─────────────────────────────────────────────────
const billOfMaterialsSchema = new mongoose.Schema(
  {
    bomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated before save
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Finished product is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Output quantity is required'],
      min: [1, 'Output quantity must be at least 1'],
      default: 1,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    components: {
      type: [bomComponentSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'BoM must have at least one component',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
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

// ─── Indexes ──────────────────────────────────────────────────────────────────
billOfMaterialsSchema.index({ bomCode: 1 });
billOfMaterialsSchema.index({ productId: 1, isActive: 1 });
billOfMaterialsSchema.index({ isActive: 1 });

const BillOfMaterials = mongoose.model('BillOfMaterials', billOfMaterialsSchema);

module.exports = BillOfMaterials;
