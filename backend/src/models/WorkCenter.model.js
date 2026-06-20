'use strict';

const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated before save
    },
    name: {
      type: String,
      required: [true, 'Work center name is required'],
      trim: true,
      minlength: [2, 'Work center name must be at least 2 characters'],
      maxlength: [200, 'Work center name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    capacity: {
      type: Number,
      min: [0, 'Capacity cannot be negative'],
      default: 0,
      // Units per hour
    },
    costPerHour: {
      type: Number,
      min: [0, 'Cost per hour cannot be negative'],
      default: 0,
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
workCenterSchema.index({ code: 1 });
workCenterSchema.index({ isActive: 1 });

const WorkCenter = mongoose.model('WorkCenter', workCenterSchema);

module.exports = WorkCenter;
