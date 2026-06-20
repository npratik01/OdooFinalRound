'use strict';

const { ManufacturingOrder } = require('../models/ManufacturingOrder.model');

/**
 * Generates a unique MO Number in the format: MO-YYYY-XXXX
 * Example: MO-2026-0001
 */
const generateMONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `MO-${year}`;

  const count = await ManufacturingOrder.countDocuments({
    moNumber: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const moNumber = `${prefix}-${sequence}`;

  const exists = await ManufacturingOrder.findOne({ moNumber });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateMONumber();
  }

  return moNumber;
};

module.exports = { generateMONumber };
