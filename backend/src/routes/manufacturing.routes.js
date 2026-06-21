'use strict';

const express = require('express');
const router = express.Router();
const {
  createManufacturingOrder,
  getManufacturingOrders,
  getManufacturingOrderById,
  confirmManufacturingOrder,
  startProduction,
  produceOutput,
  cancelManufacturingOrder,
  getManufacturingDashboard,
  getWorkOrdersByMO,
  completeWorkOrder,
} = require('../controllers/manufacturing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createManufacturingOrderSchema,
  updateManufacturingOrderSchema,
  produceOutputSchema,
} = require('../validators/manufacturing.validator');

// All routes require authentication
router.use(authenticate);

// Put /dashboard BEFORE /:id to prevent routing collision
router.get('/dashboard', authorize('manufacturing', 'read'), getManufacturingDashboard);

router.get('/work-orders/list', authorize('manufacturing', 'read'), getWorkOrdersByMO);
router.patch('/work-orders/:id/complete', authorize('manufacturing', 'update'), completeWorkOrder);

router.get('/', authorize('manufacturing', 'read'), getManufacturingOrders);
router.post('/', authorize('manufacturing', 'create'), validate(createManufacturingOrderSchema), createManufacturingOrder);
router.get('/:id', authorize('manufacturing', 'read'), getManufacturingOrderById);
router.patch('/:id/confirm', authorize('manufacturing', 'update'), confirmManufacturingOrder);
router.patch('/:id/start', authorize('manufacturing', 'update'), startProduction);
router.post('/:id/produce', authorize('manufacturing', 'update'), validate(produceOutputSchema), produceOutput);
router.patch('/:id/cancel', authorize('manufacturing', 'update'), cancelManufacturingOrder);

module.exports = router;
