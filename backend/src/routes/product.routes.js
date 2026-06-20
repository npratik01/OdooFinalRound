'use strict';

const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct } = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createProductSchema, updateProductSchema, productQuerySchema } = require('../validators/product.validator');
const Joi = require('joi');

const statusSchema = Joi.object({ isActive: Joi.boolean().required() });

router.use(authenticate);

router.get('/', authorize('products', 'read'), validate(productQuerySchema, 'query'), getProducts);
router.post('/', authorize('products', 'create'), validate(createProductSchema), createProduct);
router.get('/:id', authorize('products', 'read'), getProductById);

// Full replace (PUT) and partial update (PATCH) — both call updateProduct
router.put('/:id', authorize('products', 'update'), validate(updateProductSchema), updateProduct);
router.patch('/:id', authorize('products', 'update'), validate(updateProductSchema), updateProduct);

// Status toggle
router.patch('/:id/status', authorize('products', 'update'), validate(statusSchema), updateProductStatus);

// Soft delete
router.delete('/:id', authorize('products', 'delete'), deleteProduct);

module.exports = router;
