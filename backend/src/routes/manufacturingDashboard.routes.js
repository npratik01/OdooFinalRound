'use strict';

const express = require('express');
const router  = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/rbac.middleware');
const {
  getDashboardSummary,
  getAnalytics,
  getWorkCenterUtilization,
} = require('../controllers/manufacturingDashboard.controller');

router.use(authenticate);

// GET /api/manufacturing-dashboard/summary
router.get('/summary', authorize('manufacturing', 'read'), getDashboardSummary);

// GET /api/manufacturing-dashboard/analytics
router.get('/analytics', authorize('manufacturing', 'read'), getAnalytics);

// GET /api/manufacturing-dashboard/work-center-utilization
router.get('/work-center-utilization', authorize('manufacturing', 'read'), getWorkCenterUtilization);

module.exports = router;
