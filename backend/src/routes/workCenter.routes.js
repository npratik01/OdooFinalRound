'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');
const { validate }     = require('../middleware/validate.middleware');
const {
  createWorkCenterSchema,
  updateWorkCenterSchema,
} = require('../validators/workCenter.validator');
const {
  getWorkCenters, getWorkCenterById, createWorkCenter,
  updateWorkCenter, toggleWorkCenterStatus,
} = require('../controllers/workCenter.controller');

router.use(authenticate);

// GET /api/work-centers
router.get('/', authorize('manufacturing', 'read'), getWorkCenters);

// GET /api/work-centers/:id
router.get('/:id', authorize('manufacturing', 'read'), getWorkCenterById);

// POST /api/work-centers
router.post('/', authorize('manufacturing', 'create'), validate(createWorkCenterSchema), createWorkCenter);

// PUT /api/work-centers/:id
router.put('/:id', authorize('manufacturing', 'update'), validate(updateWorkCenterSchema), updateWorkCenter);

// PATCH /api/work-centers/:id/toggle-status
router.patch('/:id/toggle-status', authorize('manufacturing', 'update'), toggleWorkCenterStatus);

module.exports = router;
