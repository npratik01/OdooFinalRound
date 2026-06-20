'use strict';

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createVendorSchema, updateVendorSchema } = require('../validators/vendor.validator');
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  toggleVendorStatus,
} = require('../controllers/vendor.controller');

// All vendor routes require authentication
router.use(authenticate);

// GET /api/vendors — list all vendors (purchase, admin, business owner)
router.get(
  '/',
  authorize('vendors', 'read'),
  getVendors
);

// GET /api/vendors/:id — get vendor by ID
router.get(
  '/:id',
  authorize('vendors', 'read'),
  getVendorById
);

// POST /api/vendors — create vendor
router.post(
  '/',
  authorize('vendors', 'create'),
  validate(createVendorSchema),
  createVendor
);

// PUT /api/vendors/:id — full update
router.put(
  '/:id',
  authorize('vendors', 'update'),
  validate(updateVendorSchema),
  updateVendor
);

// PATCH /api/vendors/:id/status — toggle active/inactive
router.patch(
  '/:id/status',
  authorize('vendors', 'update'),
  toggleVendorStatus
);

module.exports = router;
