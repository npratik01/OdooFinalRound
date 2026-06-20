'use strict';

const Product = require('../models/Product.model');
const Inventory = require('../models/Inventory.model');
const { generateSKU } = require('../utils/skuGenerator');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const getProducts = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  } else {
    filter.isActive = true;
  }

  if (query.productType) filter.productType = query.productType;
  if (query.procurementStrategy) filter.procurementStrategy = query.procurementStrategy;
  if (query.procurementType) filter.procurementType = query.procurementType;

  // Search: by productName, SKU, or description
  if (query.search && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [
      { productName: searchRegex },
      { sku: searchRegex },
      { description: searchRegex },
      { vendor: searchRegex },
    ];
  }

  // SKU-specific search (exact prefix match)
  if (query.sku && query.sku.trim()) {
    filter.sku = { $regex: `^${query.sku.trim()}`, $options: 'i' };
    delete filter.$or; // SKU search overrides full-text
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email')
      .populate('inventory'),
    Product.countDocuments(filter),
  ]);

  // Enrich inventory virtual
  const enriched = products.map((p) => {
    const obj = p.toObject({ virtuals: true });
    if (obj.inventory) {
      obj.inventory.freeToUseQty = Math.max(
        0,
        (obj.inventory.onHandQty || 0) - (obj.inventory.reservedQty || 0)
      );
    }
    return obj;
  });

  return { products: enriched, meta: buildPaginationMeta(total, page, limit) };
};

const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('createdBy', 'name email')
    .populate('inventory');

  if (!product) throw { statusCode: 404, message: 'Product not found' };

  const obj = product.toObject({ virtuals: true });
  if (obj.inventory) {
    obj.inventory.freeToUseQty = Math.max(
      0,
      (obj.inventory.onHandQty || 0) - (obj.inventory.reservedQty || 0)
    );
  }
  return obj;
};

const createProduct = async (data, userId) => {
  const sku = await generateSKU();
  const product = await Product.create({ ...data, sku, createdBy: userId });

  await Inventory.create({
    productId: product._id,
    onHandQty: 0,
    reservedQty: 0,
    minimumStockLevel: 0,
  });

  return getProductById(product._id);
};

const updateProduct = async (id, data) => {
  const product = await Product.findById(id);
  if (!product) throw { statusCode: 404, message: 'Product not found' };

  // Immutable fields
  delete data.sku;
  delete data.createdBy;
  delete data.isActive; // Use status endpoint instead

  Object.assign(product, data);
  await product.save();
  return getProductById(product._id);
};

/**
 * PATCH /api/products/:id/status — toggle isActive
 */
const updateProductStatus = async (id, isActive) => {
  const product = await Product.findById(id);
  if (!product) throw { statusCode: 404, message: 'Product not found' };
  product.isActive = isActive;
  await product.save({ validateBeforeSave: false });
  return getProductById(product._id);
};

const deleteProduct = async (id) => {
  return updateProductStatus(id, false);
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};
