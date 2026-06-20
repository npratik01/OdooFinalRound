'use strict';

const express = require('express');
const router = express.Router();
const { getStats, getInventoryStatus, getRecentProducts, getLowStockProducts } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('dashboard', 'read'));

router.get('/stats', getStats);
router.get('/inventory-status', getInventoryStatus);
router.get('/recent-products', getRecentProducts);
router.get('/low-stock-products', getLowStockProducts);

module.exports = router;
