'use strict';

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customer.validator');

router.get(
  '/',
  authorize('customers', 'read'),
  customerController.getAllCustomers
);

router.get(
  '/:id',
  authorize('customers', 'read'),
  customerController.getCustomerById
);

router.post(
  '/',
  authorize('customers', 'create'),
  validate(createCustomerSchema),
  customerController.createCustomer
);

router.put(
  '/:id',
  authorize('customers', 'update'),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

router.patch(
  '/:id/status',
  authorize('customers', 'update'),
  customerController.toggleCustomerStatus
);

module.exports = router;
