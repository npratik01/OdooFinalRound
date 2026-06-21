'use strict';

const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema(
  {
    woNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: true,
    },
    moId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ManufacturingOrder',
      required: [true, 'Manufacturing Order is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Work order name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    workCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
workOrderSchema.index({ woNumber: 1 });
workOrderSchema.index({ moId: 1, status: 1 });

const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

module.exports = WorkOrder;
