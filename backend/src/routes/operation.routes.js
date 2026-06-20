'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');
const { validate }     = require('../middleware/validate.middleware');
const {
  createOperationSchema,
  updateOperationSchema,
} = require('../validators/workCenter.validator');
const {
  getOperations, getOperationById, createOperation, updateOperation,
} = require('../controllers/operation.controller');

router.use(authenticate);

// GET /api/operations
router.get('/', authorize('manufacturing', 'read'), getOperations);

// GET /api/operations/:id
router.get('/:id', authorize('manufacturing', 'read'), getOperationById);

// POST /api/operations
router.post('/', authorize('manufacturing', 'create'), validate(createOperationSchema), createOperation);

// PUT /api/operations/:id
router.put('/:id', authorize('manufacturing', 'update'), validate(updateOperationSchema), updateOperation);

module.exports = router;
