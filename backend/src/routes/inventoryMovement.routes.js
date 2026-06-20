'use strict';

const express = require('express');
const router = express.Router();
const movementController = require('../controllers/inventoryMovement.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get(
  '/',
  authorize('movements', 'read'),
  movementController.getAllMovements
);

module.exports = router;
