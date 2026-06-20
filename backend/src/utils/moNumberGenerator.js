'use strict';

const { ManufacturingOrder } = require('../models/ManufacturingOrder.model');

/**
 * Auto-generates sequential MO numbers in format: MO/YYYY/NNNN
 * Example: MO/2024/0001
 */
const generateMONumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `MO/${year}/`;

  // Find highest existing MO number for this year
  const lastMO = await ManufacturingOrder.findOne(
    { moNumber: new RegExp(`^${prefix}`) },
    { moNumber: 1 },
    { sort: { moNumber: -1 } }
  );

  let nextSeq = 1;
  if (lastMO && lastMO.moNumber) {
    const parts = lastMO.moNumber.split('/');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

module.exports = { generateMONumber };
