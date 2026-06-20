'use strict';

const productService = require('../services/product.service');
const { sendSuccess, sendCreated, sendError } = require('../utils/apiResponse');

const getProducts = async (req, res, next) => {
  try {
    const result = await productService.getProducts(req.query);
    return sendSuccess(res, { message: 'Products fetched successfully', data: result.products, meta: result.meta });
  } catch (err) { next(err); }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return sendSuccess(res, { message: 'Product fetched successfully', data: product });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user._id);
    return sendCreated(res, { message: 'Product created successfully', data: product });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, { message: 'Product updated successfully', data: product });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

// PATCH /api/products/:id/status
const updateProductStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, { statusCode: 400, message: 'isActive must be a boolean value' });
    }
    const product = await productService.updateProductStatus(req.params.id, isActive);
    return sendSuccess(res, {
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return sendSuccess(res, { message: 'Product deactivated successfully' });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct };
