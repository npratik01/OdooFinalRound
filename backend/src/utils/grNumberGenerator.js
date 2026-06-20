'use strict';

const GoodsReceipt = require('../models/GoodsReceipt.model');

/**
 * Generates a unique GR Number in the format: GR-YYYY-XXXX
 * Example: GR-2026-0001
 */
const generateGRNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `GR-${year}`;

  const count = await GoodsReceipt.countDocuments({
    grNumber: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const grNumber = `${prefix}-${sequence}`;

  const exists = await GoodsReceipt.findOne({ grNumber });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateGRNumber();
  }

  return grNumber;
};

module.exports = { generateGRNumber };
