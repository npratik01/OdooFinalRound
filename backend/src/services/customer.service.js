'use strict';

const Customer = require('../models/Customer.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Generates next customer code in sequence (CUST-0001, CUST-0002, ...)
 */
const generateCustomerCode = async () => {
  // Sort by customerCode descending to find the highest number
  const highest = await Customer.findOne().sort({ customerCode: -1 });
  if (!highest || !highest.customerCode) {
    return 'CUST-0001';
  }
  const match = highest.customerCode.match(/CUST-(\d+)/);
  if (!match) {
    return 'CUST-0001';
  }
  const num = parseInt(match[1], 10);
  const nextNum = String(num + 1).padStart(4, '0');
  return `CUST-${nextNum}`;
};

/**
 * Create a new Customer profile.
 */
const createCustomer = async (customerData) => {
  const code = await generateCustomerCode();
  const customer = new Customer({
    ...customerData,
    customerCode: code
  });
  await customer.save();
  return customer;
};

/**
 * Update Customer details by ID.
 */
const updateCustomer = async (id, updateData) => {
  const customer = await Customer.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }
  return customer;
};

/**
 * Fetch a single Customer by ID.
 */
const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }
  return customer;
};

/**
 * Fetch all Customers (paginated, searchable, filterable).
 */
const getAllCustomers = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  
  // Search by name, code, email, phone
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [
      { customerName: regex },
      { customerCode: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  // Soft delete / isActive status filter (defaults to active-only if not specified otherwise)
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(filter)
  ]);

  return {
    customers,
    meta: buildPaginationMeta(total, page, limit)
  };
};

/**
 * Soft delete / status toggle
 */
const toggleCustomerStatus = async (id, isActive) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw { statusCode: 404, message: 'Customer not found' };
  }
  customer.isActive = isActive;
  await customer.save();
  return customer;
};

module.exports = {
  createCustomer,
  updateCustomer,
  getCustomerById,
  getAllCustomers,
  toggleCustomerStatus
};
