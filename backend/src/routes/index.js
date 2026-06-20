'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');
const dashboardRoutes = require('./dashboard.routes');
const customerRoutes = require('./customer.routes');
const salesRoutes = require('./sales.routes');
const deliveryRoutes = require('./delivery.routes');
const inventoryMovementRoutes = require('./inventoryMovement.routes');
// Phase 3
const vendorRoutes = require('./vendor.routes');
const purchaseRoutes = require('./purchase.routes');
const procurementDashboardRoutes = require('./procurementDashboard.routes');

// Mount all API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', salesRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/inventory-movements', inventoryMovementRoutes);
// Phase 3
router.use('/vendors', vendorRoutes);
router.use('/purchase-orders', purchaseRoutes);
router.use('/procurement', procurementDashboardRoutes);

module.exports = router;

