'use strict';

const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createSalesOrderSchema, updateSalesOrderSchema } = require('../validators/sales.validator');

router.use(authenticate);

router.get(
  '/',
  authorize('sales', 'read'),
  salesController.getAllSalesOrders
);

router.get(
  '/stats',
  authorize('sales', 'read'),
  salesController.getSalesStats
);

router.get(
  '/analytics',
  authorize('sales', 'read'),
  salesController.getSalesAnalytics
);

router.get(
  '/:id',
  authorize('sales', 'read'),
  salesController.getSalesOrderById
);

router.post(
  '/',
  authorize('sales', 'create'),
  validate(createSalesOrderSchema),
  salesController.createSalesOrder
);

router.put(
  '/:id',
  authorize('sales', 'update'),
  validate(updateSalesOrderSchema),
  salesController.updateSalesOrder
);

router.patch(
  '/:id/confirm',
  authorize('sales', 'update'),
  salesController.confirmSalesOrder
);

router.patch(
  '/:id/cancel',
  authorize('sales', 'update'),
  salesController.cancelSalesOrder
);

router.post(
  '/:id/deliver',
  authorize('deliveries', 'create'),
  salesController.deliverSalesOrder
);

router.post(
  '/:id/partial-deliver',
  authorize('deliveries', 'create'),
  validate(require('../validators/sales.validator').partialDeliverySchema),
  salesController.partialDeliverSalesOrder
);

module.exports = router;
