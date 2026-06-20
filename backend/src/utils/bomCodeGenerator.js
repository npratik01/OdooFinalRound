'use strict';

const { BOM } = require('../models/BOM.model');

/**
 * Generates a unique BoM Code in the format: BOM-YYYY-XXXX
 * Example: BOM-2026-0001
 */
const generateBOMCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `BOM-${year}`;

  const count = await BOM.countDocuments({
    bomCode: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, '0');
  const bomCode = `${prefix}-${sequence}`;

  const exists = await BOM.findOne({ bomCode });
  if (exists) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return generateBOMCode();
  }

  return bomCode;
};

module.exports = { generateBOMCode };
