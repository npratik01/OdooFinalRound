'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const dashboardRoutes = require('./dashboard.routes');

// Mount all API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);

// Future module slots (to be activated in later phases)
// router.use('/sales', salesRoutes);
// router.use('/purchase', purchaseRoutes);
// router.use('/manufacturing', manufacturingRoutes);
// router.use('/bom', bomRoutes);
// router.use('/audit-logs', auditLogRoutes);

module.exports = router;
