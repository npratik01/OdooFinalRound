'use strict';

const { PurchaseOrder } = require('../models/PurchaseOrder.model');

/**
 * Generates a unique PO Number in the format: PO-YYYY-XXXX
 * Example: PO-2026-0001
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}`;

  const count = await PurchaseOrder.countDocuments({
    poNumber: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const poNumber = `${prefix}-${sequence}`;

  const exists = await PurchaseOrder.findOne({ poNumber });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generatePONumber();
  }

  return poNumber;
};

module.exports = { generatePONumber };
