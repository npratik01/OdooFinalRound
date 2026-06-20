'use strict';

const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema({
  workCenterCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  workCenterName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  capacityPerDay: {
    type: Number,
    required: true,
    min: [1, 'Capacity per day must be at least 1'],
    default: 8, // hours
  },
  efficiencyPercentage: {
    type: Number,
    min: [1, 'Efficiency must be at least 1%'],
    max: [100, 'Efficiency cannot exceed 100%'],
    default: 85,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WorkCenter', workCenterSchema);
