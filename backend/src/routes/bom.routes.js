'use strict';

const express = require('express');
const router = express.Router();
const {
  createBom,
  getBoms,
  getBomById,
  getBomByProduct,
  updateBom,
  deactivateBom,
} = require('../controllers/bom.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createBomSchema, updateBomSchema } = require('../validators/manufacturing.validator');

// All routes require authentication
router.use(authenticate);

router.get('/', authorize('manufacturing', 'read'), getBoms);
router.post('/', authorize('manufacturing', 'create'), validate(createBomSchema), createBom);
router.get('/:id', authorize('manufacturing', 'read'), getBomById);
router.get('/product/:productId', authorize('manufacturing', 'read'), getBomByProduct);
router.put('/:id', authorize('manufacturing', 'update'), validate(updateBomSchema), updateBom);
router.patch('/:id/deactivate', authorize('manufacturing', 'update'), deactivateBom);

module.exports = router;
