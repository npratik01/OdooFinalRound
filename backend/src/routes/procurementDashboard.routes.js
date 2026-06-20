'use strict';

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getDashboard,
  getAnalytics,
  getSupplierPerformance,
  getLowStockInsights,
} = require('../controllers/procurementDashboard.controller');

router.use(authenticate);

// GET /api/procurement/dashboard — KPI cards
router.get('/dashboard',           authorize('purchase', 'read'), getDashboard);

// GET /api/procurement/analytics — charts data
router.get('/analytics',           authorize('purchase', 'read'), getAnalytics);

// GET /api/procurement/supplier-performance — vendor scorecards
router.get('/supplier-performance', authorize('purchase', 'read'), getSupplierPerformance);

// GET /api/procurement/low-stock-insights — replenishment suggestions
router.get('/low-stock-insights',  authorize('inventory', 'read'), getLowStockInsights);

module.exports = router;
