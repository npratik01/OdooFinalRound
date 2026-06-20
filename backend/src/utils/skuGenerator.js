'use strict';

const Product = require('../models/Product.model');

/**
 * Generates a unique SKU in the format: PRD-YYYYMM-XXXX
 * Example: PRD-202606-0001
 * Uses a padded counter based on total products created this month.
 */
const generateSKU = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `PRD-${year}${month}`;

  // Count existing SKUs with this month's prefix for the counter
  const count = await Product.countDocuments({
    sku: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const sku = `${prefix}-${sequence}`;

  // Ensure uniqueness (handles race conditions)
  const exists = await Product.findOne({ sku });
  if (exists) {
    // Recurse with a small delay to resolve concurrent requests
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateSKU();
  }

  return sku;
};

module.exports = { generateSKU };
