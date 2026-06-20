'use strict';

const Vendor = require('../models/Vendor.model');
const { generateVendorCode } = require('../utils/vendorCodeGenerator');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

const createVendor = async (vendorData) => {
  const vendorCode = await generateVendorCode();

  const vendor = new Vendor({
    vendorCode,
    vendorName:    vendorData.vendorName,
    contactPerson: vendorData.contactPerson || '',
    email:         vendorData.email         || '',
    phone:         vendorData.phone         || '',
    gstNumber:     vendorData.gstNumber     || '',
    address:       vendorData.address       || '',
    city:          vendorData.city          || '',
    state:         vendorData.state         || '',
    country:       vendorData.country       || 'India',
    pincode:       vendorData.pincode       || '',
    paymentTerms:  vendorData.paymentTerms  || 'Net 30',
    leadTimeDays:  vendorData.leadTimeDays  !== undefined ? vendorData.leadTimeDays : 7,
    rating:        vendorData.rating        !== undefined ? vendorData.rating       : 3,
    isActive:      true,
  });

  await vendor.save();
  logger.info(`Vendor created: ${vendorCode} — ${vendor.vendorName}`);
  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — ALL
// ─────────────────────────────────────────────────────────────────────────────

const getAllVendors = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    filter.$or = [
      { vendorName:    new RegExp(query.search, 'i') },
      { vendorCode:    new RegExp(query.search, 'i') },
      { contactPerson: new RegExp(query.search, 'i') },
      { email:         new RegExp(query.search, 'i') },
      { city:          new RegExp(query.search, 'i') },
    ];
  }

  if (query.city)    filter.city    = new RegExp(query.city,    'i');
  if (query.country) filter.country = new RegExp(query.country, 'i');

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Vendor.countDocuments(filter),
  ]);

  return {
    vendors,
    meta: buildPaginationMeta(total, page, limit),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — BY ID
// ─────────────────────────────────────────────────────────────────────────────

const getVendorById = async (id) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw { statusCode: 404, message: 'Vendor not found' };
  }
  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

const updateVendor = async (id, updateData) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw { statusCode: 404, message: 'Vendor not found' };
  }

  const updatableFields = [
    'vendorName', 'contactPerson', 'email', 'phone', 'gstNumber',
    'address', 'city', 'state', 'country', 'pincode',
    'paymentTerms', 'leadTimeDays', 'rating',
  ];

  updatableFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      vendor[field] = updateData[field];
    }
  });

  await vendor.save();
  logger.info(`Vendor updated: ${vendor.vendorCode}`);
  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

const toggleVendorStatus = async (id) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw { statusCode: 404, message: 'Vendor not found' };
  }

  vendor.isActive = !vendor.isActive;
  await vendor.save();

  const action = vendor.isActive ? 'activated' : 'deactivated';
  logger.info(`Vendor ${action}: ${vendor.vendorCode}`);
  return vendor;
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  toggleVendorStatus,
};
