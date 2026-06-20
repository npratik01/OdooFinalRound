'use strict';

const express = require('express');
const router = express.Router();
const {
  createWorkCenter,
  getWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterActive,
} = require('../controllers/workCenter.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createWorkCenterSchema, updateWorkCenterSchema } = require('../validators/manufacturing.validator');

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('manufacturing', 'read'), getWorkCenters);
router.post('/', authorize('manufacturing', 'create'), validate(createWorkCenterSchema), createWorkCenter);
router.get('/:id', authorize('manufacturing', 'read'), getWorkCenterById);
router.put('/:id', authorize('manufacturing', 'update'), validate(updateWorkCenterSchema), updateWorkCenter);
router.patch('/:id/toggle', authorize('manufacturing', 'update'), toggleWorkCenterActive);

module.exports = router;
