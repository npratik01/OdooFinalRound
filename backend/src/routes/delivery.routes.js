'use strict';

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authorize } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { processDeliverySchema } = require('../validators/sales.validator');

router.get(
  '/',
  authorize('deliveries', 'read'),
  deliveryController.getAllDeliveries
);

router.post(
  '/',
  authorize('deliveries', 'create'),
  validate(processDeliverySchema),
  deliveryController.processDelivery
);

module.exports = router;
