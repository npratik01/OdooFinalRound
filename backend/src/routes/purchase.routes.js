'use strict';

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  goodsReceiptSchema,
} = require('../validators/purchase.validator');
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  receiveGoods,
  getReceiptsByPO,
} = require('../controllers/purchase.controller');

// All purchase routes require authentication
router.use(authenticate);

// GET /api/purchase-orders
router.get(
  '/',
  authorize('purchase', 'read'),
  getPurchaseOrders
);

// GET /api/purchase-orders/:id
router.get(
  '/:id',
  authorize('purchase', 'read'),
  getPurchaseOrderById
);

// GET /api/purchase-orders/:id/receipts
router.get(
  '/:id/receipts',
  authorize('purchase', 'read'),
  getReceiptsByPO
);

// POST /api/purchase-orders
router.post(
  '/',
  authorize('purchase', 'create'),
  validate(createPurchaseOrderSchema),
  createPurchaseOrder
);

// PUT /api/purchase-orders/:id (Draft only)
router.put(
  '/:id',
  authorize('purchase', 'update'),
  validate(updatePurchaseOrderSchema),
  updatePurchaseOrder
);

// PATCH /api/purchase-orders/:id/confirm
router.patch(
  '/:id/confirm',
  authorize('purchase', 'update'),
  confirmPurchaseOrder
);

// PATCH /api/purchase-orders/:id/cancel
router.patch(
  '/:id/cancel',
  authorize('purchase', 'update'),
  cancelPurchaseOrder
);

// POST /api/purchase-orders/:id/receive — Goods Receipt
router.post(
  '/:id/receive',
  authorize('purchase', 'update'),
  validate(goodsReceiptSchema),
  receiveGoods
);

module.exports = router;
