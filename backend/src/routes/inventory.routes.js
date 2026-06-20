'use strict';

const express = require('express');
const router = express.Router();
const {
  getAllInventory, getInventoryByProductId, adjustInventory, getLowStockItems,
  increaseStock, decreaseStock, reserveStock, releaseStock,
} = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { adjustInventorySchema } = require('../validators/inventory.validator');
const Joi = require('joi');

const qtySchema = Joi.object({
  qty: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'qty is required',
  }),
});

router.use(authenticate);

// Specific alert route FIRST (before /:productId)
router.get('/alerts/low-stock', authorize('inventory', 'read'), getLowStockItems);

// List all
router.get('/', authorize('inventory', 'read'), getAllInventory);

// Get by product
router.get('/:productId', authorize('inventory', 'read'), getInventoryByProductId);

// Direct adjust (set values)
router.patch('/:productId/adjust', authorize('inventory', 'update'), validate(adjustInventorySchema), adjustInventory);

// Named stock operations
router.post('/:productId/increase', authorize('inventory', 'update'), validate(qtySchema), increaseStock);
router.post('/:productId/decrease', authorize('inventory', 'update'), validate(qtySchema), decreaseStock);
router.post('/:productId/reserve',  authorize('inventory', 'update'), validate(qtySchema), reserveStock);
router.post('/:productId/release',  authorize('inventory', 'update'), validate(qtySchema), releaseStock);

module.exports = router;
