'use strict';

const express = require('express');
const router = express.Router();
const movementController = require('../controllers/inventoryMovement.controller');
const { authorize } = require('../middleware/rbac.middleware');

router.get(
  '/',
  authorize('movements', 'read'),
  movementController.getAllMovements
);

module.exports = router;
