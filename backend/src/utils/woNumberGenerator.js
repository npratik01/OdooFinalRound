'use strict';

const { WorkOrder } = require('../models/WorkOrder.model');

/**
 * Generates a unique Work Order Number in the format: WO-YYYY-XXXX
 * Example: WO-2026-0001
 */
const generateWONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}`;

  const count = await WorkOrder.countDocuments({
    workOrderNumber: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const woNumber = `${prefix}-${sequence}`;

  const exists = await WorkOrder.findOne({ workOrderNumber: woNumber });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateWONumber();
  }

  return woNumber;
};

module.exports = { generateWONumber };
