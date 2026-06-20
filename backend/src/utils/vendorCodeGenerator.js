'use strict';

const Vendor = require('../models/Vendor.model');

/**
 * Generates a unique Vendor Code in the format: VEN-YYYY-XXXX
 * Example: VEN-2026-0001
 */
const generateVendorCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `VEN-${year}`;

  const count = await Vendor.countDocuments({
    vendorCode: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const vendorCode = `${prefix}-${sequence}`;

  const exists = await Vendor.findOne({ vendorCode });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateVendorCode();
  }

  return vendorCode;
};

module.exports = { generateVendorCode };
