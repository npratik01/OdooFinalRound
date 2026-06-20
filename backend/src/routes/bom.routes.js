'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate }  = require('../middleware/auth.middleware');
const { authorize }     = require('../middleware/rbac.middleware');
const { validate }      = require('../middleware/validate.middleware');
const { createBOMSchema, updateBOMSchema } = require('../validators/bom.validator');
const {
  getBOMs, getBOMById, createBOM, updateBOM,
  cloneBOM, activateBOM, archiveBOM,
} = require('../controllers/bom.controller');

router.use(authenticate);

// GET /api/bom
router.get('/', authorize('manufacturing', 'read'), getBOMs);

// GET /api/bom/:id
router.get('/:id', authorize('manufacturing', 'read'), getBOMById);

// POST /api/bom
router.post('/', authorize('manufacturing', 'create'), validate(createBOMSchema), createBOM);

// PUT /api/bom/:id
router.put('/:id', authorize('manufacturing', 'update'), validate(updateBOMSchema), updateBOM);

// POST /api/bom/:id/clone
router.post('/:id/clone', authorize('manufacturing', 'create'), cloneBOM);

// PATCH /api/bom/:id/activate
router.patch('/:id/activate', authorize('manufacturing', 'update'), activateBOM);

// PATCH /api/bom/:id/archive
router.patch('/:id/archive', authorize('manufacturing', 'update'), archiveBOM);

module.exports = router;
