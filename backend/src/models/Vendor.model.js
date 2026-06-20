'use strict';

const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      // Auto-generated before save
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      minlength: [2, 'Vendor name must be at least 2 characters'],
      maxlength: [200, 'Vendor name cannot exceed 200 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'GST Number cannot exceed 20 characters'],
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
      default: '',
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      default: '',
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
      default: '',
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      default: 'India',
    },
    pincode: {
      type: String,
      trim: true,
      maxlength: [10, 'Pincode cannot exceed 10 characters'],
      default: '',
    },
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment terms cannot exceed 100 characters'],
      default: 'Net 30',
    },
    leadTimeDays: {
      type: Number,
      min: [0, 'Lead time cannot be negative'],
      default: 7,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────
// vendorCode index is created automatically via unique:true
vendorSchema.index({ vendorName: 'text', contactPerson: 'text', email: 'text' });
vendorSchema.index({ isActive: 1 });
vendorSchema.index({ rating: -1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
