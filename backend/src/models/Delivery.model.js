'use strict';

const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantityShipped: {
    type: Number,
    required: true,
    min: 1
  }
});

const deliverySchema = new mongoose.Schema({
  deliveryNumber: {
    type: String,
    unique: true,
    index: true
  },
  soId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true,
    index: true
  },
  deliveryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: {
    type: [deliveryItemSchema],
    validate: [val => val.length > 0, 'Delivery must contain at least one item']
  },
  shippedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
