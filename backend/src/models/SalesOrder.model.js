'use strict';

const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const salesOrderSchema = new mongoose.Schema({
  soNumber: {
    type: String,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: {
    type: [salesOrderItemSchema],
    validate: [val => val.length > 0, 'Sales Order must contain at least one item']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Partially Delivered', 'Fully Delivered', 'Cancelled'],
    default: 'Draft',
    index: true
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
