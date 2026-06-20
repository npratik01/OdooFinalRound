'use strict';

const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  operationCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  operationName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  standardDurationMinutes: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1 minute'],
    default: 60,
  },
  workCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true,
    index: true,
  },
  sequence: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Operation', operationSchema);
