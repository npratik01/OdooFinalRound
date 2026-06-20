'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');
const { validate }     = require('../middleware/validate.middleware');
const {
  createMOSchema,
  updateMOSchema,
  completeMOSchema,
  completeWOSchema,
} = require('../validators/manufacturing.validator');
const {
  getManufacturingOrders,
  getManufacturingOrderById,
  createManufacturingOrder,
  updateManufacturingOrder,
  confirmManufacturingOrder,
  startManufacturingOrder,
  completeManufacturingOrder,
  cancelManufacturingOrder,
  getWorkOrdersForMO,
  getAllWorkOrders,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
} = require('../controllers/manufacturing.controller');

router.use(authenticate);

// ── Manufacturing Orders ──────────────────────────────────────────────────────

// GET /api/manufacturing
router.get('/', authorize('manufacturing', 'read'), getManufacturingOrders);

// GET /api/manufacturing/work-orders (all WOs)
router.get('/work-orders', authorize('manufacturing', 'read'), getAllWorkOrders);

// GET /api/manufacturing/:id
router.get('/:id', authorize('manufacturing', 'read'), getManufacturingOrderById);

// GET /api/manufacturing/:id/work-orders
router.get('/:id/work-orders', authorize('manufacturing', 'read'), getWorkOrdersForMO);

// POST /api/manufacturing
router.post('/', authorize('manufacturing', 'create'), validate(createMOSchema), createManufacturingOrder);

// PUT /api/manufacturing/:id
router.put('/:id', authorize('manufacturing', 'update'), validate(updateMOSchema), updateManufacturingOrder);

// PATCH /api/manufacturing/:id/confirm  — Draft → Confirmed
router.patch('/:id/confirm', authorize('manufacturing', 'update'), confirmManufacturingOrder);

// PATCH /api/manufacturing/:id/start    — Confirmed → In Progress
router.patch('/:id/start', authorize('manufacturing', 'update'), startManufacturingOrder);

// PATCH /api/manufacturing/:id/complete — In Progress → Completed
router.patch('/:id/complete', authorize('manufacturing', 'update'), validate(completeMOSchema), completeManufacturingOrder);

// PATCH /api/manufacturing/:id/cancel
router.patch('/:id/cancel', authorize('manufacturing', 'update'), cancelManufacturingOrder);

// ── Work Order Actions ────────────────────────────────────────────────────────

// PATCH /api/manufacturing/work-orders/:woId/start
router.patch('/work-orders/:id/start', authorize('manufacturing', 'update'), startWorkOrder);

// PATCH /api/manufacturing/work-orders/:woId/complete
router.patch('/work-orders/:id/complete', authorize('manufacturing', 'update'), validate(completeWOSchema), completeWorkOrder);

// PATCH /api/manufacturing/work-orders/:woId/cancel
router.patch('/work-orders/:id/cancel', authorize('manufacturing', 'update'), cancelWorkOrder);

module.exports = router;
