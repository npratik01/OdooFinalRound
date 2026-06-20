'use strict';

const express = require('express');
const router = express.Router();
const traceabilityController = require('../controllers/traceability.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

router.get('/flow/:docId', traceabilityController.getTraceabilityFlow);

module.exports = router;
