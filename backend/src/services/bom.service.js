'use strict';

const BillOfMaterials = require('../models/BillOfMaterials.model');
const Product = require('../models/Product.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─── Helper ───────────────────────────────────────────────────────────────────

const populateBom = (id) =>
  BillOfMaterials.findById(id)
    .populate('productId', 'productName sku productType costPrice salesPrice')
    .populate('components.productId', 'productName sku productType costPrice')
    .populate('createdBy', 'name email role');

// ─── Auto-generate BoM Code ───────────────────────────────────────────────────

const generateBomCode = async () => {
  const last = await BillOfMaterials.findOne({}, { bomCode: 1 }, { sort: { bomCode: -1 } });
  let seq = 1;
  if (last && last.bomCode) {
    const match = last.bomCode.match(/BOM(\d+)/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `BOM${String(seq).padStart(4, '0')}`;
};

// ─── CREATE BoM ───────────────────────────────────────────────────────────────

const createBom = async (data, userId) => {
  // Validate finished product exists
  const product = await Product.findById(data.productId);
  if (!product) throw { statusCode: 404, message: 'Product not found' };
  if (!product.isActive) throw { statusCode: 400, message: 'Cannot create BoM for an inactive product' };

  // Validate all component products exist
  for (const comp of data.components) {
    const compProduct = await Product.findById(comp.productId);
    if (!compProduct) {
      throw { statusCode: 404, message: `Component product not found: ${comp.productId}` };
    }
    // Prevent circular BoM (product using itself as component)
    if (comp.productId.toString() === data.productId.toString()) {
      throw { statusCode: 400, message: 'A product cannot be its own component' };
    }
  }

  const bomCode = await generateBomCode();

  const bom = new BillOfMaterials({
    bomCode,
    productId: data.productId,
    quantity: data.quantity || 1,
    version: data.version || 1,
    components: data.components,
    description: data.description || '',
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdBy: userId,
  });

  await bom.save();
  logger.info(`BoM created: ${bomCode} for product ${product.productName}`);
  return populateBom(bom._id);
};

// ─── GET ALL BoMs ─────────────────────────────────────────────────────────────

const getAllBoms = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.productId) filter.productId = query.productId;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) filter.bomCode = new RegExp(query.search, 'i');

  const [boms, total] = await Promise.all([
    BillOfMaterials.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'productName sku productType')
      .populate('components.productId', 'productName sku')
      .populate('createdBy', 'name'),
    BillOfMaterials.countDocuments(filter),
  ]);

  return {
    boms,
    meta: buildPaginationMeta(total, page, limit),
  };
};

// ─── GET BoM BY ID ────────────────────────────────────────────────────────────

const getBomById = async (id) => {
  const bom = await populateBom(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };
  return bom;
};

// ─── GET BoM BY PRODUCT ───────────────────────────────────────────────────────

const getBomByProduct = async (productId) => {
  const bom = await BillOfMaterials.findOne({ productId, isActive: true })
    .sort({ version: -1 })
    .populate('productId', 'productName sku productType costPrice salesPrice')
    .populate('components.productId', 'productName sku productType costPrice')
    .populate('createdBy', 'name email');
  
  if (!bom) throw { statusCode: 404, message: 'No active Bill of Materials found for this product' };
  return bom;
};

// ─── UPDATE BoM ───────────────────────────────────────────────────────────────

const updateBom = async (id, updateData) => {
  const bom = await BillOfMaterials.findById(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };

  if (updateData.components) {
    // Validate component products
    for (const comp of updateData.components) {
      const compProduct = await Product.findById(comp.productId);
      if (!compProduct) {
        throw { statusCode: 404, message: `Component product not found: ${comp.productId}` };
      }
      if (comp.productId.toString() === bom.productId.toString()) {
        throw { statusCode: 400, message: 'A product cannot be its own component' };
      }
    }
    bom.components = updateData.components;
  }

  if (updateData.quantity !== undefined) bom.quantity = updateData.quantity;
  if (updateData.description !== undefined) bom.description = updateData.description;

  await bom.save();
  logger.info(`BoM updated: ${bom.bomCode}`);
  return populateBom(bom._id);
};

// ─── DEACTIVATE BoM ───────────────────────────────────────────────────────────

const deactivateBom = async (id) => {
  const bom = await BillOfMaterials.findById(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };

  bom.isActive = false;
  await bom.save();
  logger.info(`BoM deactivated: ${bom.bomCode}`);
  return populateBom(bom._id);
};

module.exports = {
  createBom,
  getAllBoms,
  getBomById,
  getBomByProduct,
  updateBom,
  deactivateBom,
};
