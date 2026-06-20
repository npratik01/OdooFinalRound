'use strict';

/**
 * BoMService
 * Single responsibility: All Bill of Materials lifecycle operations.
 *
 * Phase 5 hook: `getActiveBOMForProduct(productId)` is the integration point
 * called by ManufacturingOrderService when auto-generating MOs from Sales Orders.
 */

const { BOM, BOM_STATUS } = require('../../models/BOM.model');
const Product              = require('../../models/Product.model');
const { generateBOMCode }  = require('../../utils/bomCodeGenerator');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');
const logger               = require('../../utils/logger');

// ─── Populate Helper ─────────────────────────────────────────────────────────

const _populateBOM = (id) =>
  BOM.findById(id)
    .populate('productId',             'productName sku productType')
    .populate('components.productId',  'productName sku')
    .populate({
      path:     'operations.operationId',
      populate: { path: 'workCenterId', select: 'workCenterName workCenterCode efficiencyPercentage' },
      select:   'operationName operationCode standardDurationMinutes workCenterId',
    })
    .populate('createdBy', 'name email role');

// ─── CREATE ───────────────────────────────────────────────────────────────────

const createBOM = async (data, userId) => {
  const product = await Product.findById(data.productId);
  if (!product)       throw { statusCode: 404, message: 'Product not found' };
  if (!product.isActive) throw { statusCode: 400, message: 'Cannot create BoM for an inactive product' };

  const bomCode = await generateBOMCode();

  const bom = new BOM({
    bomCode,
    productId:   data.productId,
    version:     data.version     || '1.0',
    status:      BOM_STATUS.DRAFT,
    description: data.description || '',
    components:  data.components  || [],
    operations:  data.operations  || [],
    isActive:    true,
    createdBy:   userId,
  });

  await bom.save();
  logger.info(`BoM created: ${bomCode}`);
  return _populateBOM(bom._id);
};

// ─── LIST ─────────────────────────────────────────────────────────────────────

const getAllBOMs = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.status)    filter.status    = query.status;
  if (query.productId) filter.productId = query.productId;
  if (query.search)    filter.bomCode   = new RegExp(query.search, 'i');
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  const [boms, total] = await Promise.all([
    BOM.find(filter)
      .sort(sort || { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'productName sku')
      .populate('createdBy', 'name'),
    BOM.countDocuments(filter),
  ]);

  return { boms, meta: buildPaginationMeta(total, page, limit) };
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

const getBOMById = async (id) => {
  const bom = await _populateBOM(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };
  return bom;
};

// ─── UPDATE (Draft only) ──────────────────────────────────────────────────────

const updateBOM = async (id, data) => {
  const bom = await BOM.findById(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };

  if (bom.status !== BOM_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Cannot edit BoM in '${bom.status}' status. Only Draft BoMs can be edited.` };
  }

  if (data.productId) {
    const product = await Product.findById(data.productId);
    if (!product) throw { statusCode: 404, message: 'Product not found' };
    bom.productId = data.productId;
  }

  if (data.version     !== undefined) bom.version     = data.version;
  if (data.description !== undefined) bom.description = data.description;
  if (data.components  !== undefined) bom.components  = data.components;
  if (data.operations  !== undefined) bom.operations  = data.operations;

  await bom.save();
  return _populateBOM(bom._id);
};

// ─── CLONE (Version Draft) ────────────────────────────────────────────────────

const cloneBOM = async (id, userId) => {
  const original = await BOM.findById(id);
  if (!original) throw { statusCode: 404, message: 'Bill of Materials not found' };

  const newCode = await generateBOMCode();

  const parts   = (original.version || '1.0').split('.');
  const major   = parseInt(parts[0], 10) || 1;
  const minor   = parseInt(parts[1], 10) || 0;
  const newVersion = `${major}.${minor + 1}`;

  const cloned = new BOM({
    bomCode:     newCode,
    productId:   original.productId,
    version:     newVersion,
    status:      BOM_STATUS.DRAFT,
    description: `[Clone] ${original.description}`,
    components:  original.components,
    operations:  original.operations,
    isActive:    true,
    createdBy:   userId,
  });

  await cloned.save();
  logger.info(`BoM cloned: ${newCode} from ${original.bomCode}`);
  return _populateBOM(cloned._id);
};

// ─── ACTIVATE (Draft → Active) ────────────────────────────────────────────────

const activateBOM = async (id) => {
  const bom = await BOM.findById(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };

  if (bom.status !== BOM_STATUS.DRAFT) {
    throw { statusCode: 400, message: `Can only activate a Draft BoM. Current status: ${bom.status}` };
  }
  if (!bom.components || bom.components.length === 0) {
    throw { statusCode: 400, message: 'Cannot activate a BoM with no components' };
  }

  bom.status = BOM_STATUS.ACTIVE;
  await bom.save();
  logger.info(`BoM activated: ${bom.bomCode}`);
  return _populateBOM(bom._id);
};

// ─── ARCHIVE ─────────────────────────────────────────────────────────────────

const archiveBOM = async (id) => {
  const bom = await BOM.findById(id);
  if (!bom) throw { statusCode: 404, message: 'Bill of Materials not found' };

  if (bom.status === BOM_STATUS.ARCHIVED) {
    throw { statusCode: 400, message: 'BoM is already archived' };
  }

  bom.status   = BOM_STATUS.ARCHIVED;
  bom.isActive = false;
  await bom.save();
  logger.info(`BoM archived: ${bom.bomCode}`);
  return _populateBOM(bom._id);
};

// ─── PHASE 5 INTEGRATION HOOK ─────────────────────────────────────────────────
// Called by ManufacturingOrderService.scheduleFromSalesOrder()
// Returns the single active BoM for a product, or null if none exists.

const getActiveBOMForProduct = async (productId) => {
  return BOM.findOne({ productId, status: BOM_STATUS.ACTIVE, isActive: true })
    .populate('components.productId', 'productName sku')
    .populate('operations.operationId', 'operationName standardDurationMinutes workCenterId');
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

module.exports = {
  createBOM,
  getAllBOMs,
  getBOMById,
  updateBOM,
  cloneBOM,
  activateBOM,
  archiveBOM,
  getActiveBOMForProduct,
};
