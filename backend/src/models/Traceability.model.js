'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const traceabilitySchema = new Schema(
  {
    sourceDocId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sourceDocType: {
      type: String,
      required: true,
      enum: ['SalesOrder', 'ManufacturingOrder', 'PurchaseOrder', 'Delivery', 'GoodsReceipt'],
      index: true,
    },
    sourceDocNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetDocId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetDocType: {
      type: String,
      required: true,
      enum: ['SalesOrder', 'ManufacturingOrder', 'PurchaseOrder', 'Delivery', 'GoodsReceipt'],
      index: true,
    },
    targetDocNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    relationType: {
      type: String,
      required: true,
      enum: ['TRIGGERED', 'CONSUMED', 'SHIPPED'],
      default: 'TRIGGERED',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to speed up document flow lookup in either direction
traceabilitySchema.index({ sourceDocId: 1, targetDocId: 1 });

module.exports = mongoose.model('Traceability', traceabilitySchema);
