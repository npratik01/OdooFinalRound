'use strict';

/**
 * Database Seeder
 * Creates default users and sample products with inventory.
 * Run: node seeders/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User.model');
const Product = require('../src/models/Product.model');
const Inventory = require('../src/models/Inventory.model');
const { ROLES } = require('../src/constants/roles');
const { PRODUCT_TYPES, PROCUREMENT_STRATEGY, PROCUREMENT_TYPE } = require('../src/constants/stockStatus');
const logger = require('../src/utils/logger');

const SALT_ROUNDS = 12;

const seedUsers = async () => {
  const users = [
    {
      name: 'System Administrator',
      email: 'admin@erp.com',
      password: await bcrypt.hash('Admin@123', SALT_ROUNDS),
      role: ROLES.ADMIN,
      isActive: true,
    },
    {
      name: 'Business Owner',
      email: 'owner@erp.com',
      password: await bcrypt.hash('Owner@1234', SALT_ROUNDS),
      role: ROLES.BUSINESS_OWNER,
      isActive: true,
    },
    {
      name: 'Inventory Manager',
      email: 'inventory@erp.com',
      password: await bcrypt.hash('Inv@1234', SALT_ROUNDS),
      role: ROLES.INVENTORY_MANAGER,
      isActive: true,
    },
    {
      name: 'Sales Representative',
      email: 'sales@erp.com',
      password: await bcrypt.hash('Sales@1234', SALT_ROUNDS),
      role: ROLES.SALES_USER,
      isActive: true,
    },
    {
      name: 'Purchase Manager',
      email: 'purchase@erp.com',
      password: await bcrypt.hash('Purchase@1234', SALT_ROUNDS),
      role: ROLES.PURCHASE_USER,
      isActive: true,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      // Bypass pre-save hook since we already hashed the password
      const user = new User(userData);
      user.$skipPasswordHash = true;
      // Direct insert to bypass bcrypt double-hash
      const saved = await User.collection.insertOne({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      });
      createdUsers.push({ ...userData, _id: saved.insertedId });
      logger.info(`✅ Created user: ${userData.email} [${userData.role}]`);
    } else {
      createdUsers.push(existing);
      logger.info(`⏭️  User already exists: ${userData.email}`);
    }
  }
  return createdUsers;
};

const seedProducts = async (adminUserId) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const products = [
    {
      productName: 'Steel Rod 10mm',
      sku: `PRD-${yearMonth}-0001`,
      description: 'High-tensile steel rod, 10mm diameter, 6m length',
      salesPrice: 850,
      costPrice: 620,
      productType: PRODUCT_TYPES.RAW_MATERIAL,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'Steel Works India Pvt Ltd',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Aluminium Sheet 2mm',
      sku: `PRD-${yearMonth}-0002`,
      description: 'Aluminium alloy sheet, 2mm thickness, 4x8 ft',
      salesPrice: 2200,
      costPrice: 1750,
      productType: PRODUCT_TYPES.RAW_MATERIAL,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'MetAlco Supplies',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Industrial Gear Assembly',
      sku: `PRD-${yearMonth}-0003`,
      description: 'Precision-machined gear assembly for industrial machinery',
      salesPrice: 15000,
      costPrice: 9800,
      productType: PRODUCT_TYPES.COMPONENT,
      procurementStrategy: PROCUREMENT_STRATEGY.MTO,
      procurementType: PROCUREMENT_TYPE.MANUFACTURING,
      vendor: '',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'CNC Machined Bracket',
      sku: `PRD-${yearMonth}-0004`,
      description: 'Custom CNC machined mounting bracket for heavy equipment',
      salesPrice: 4500,
      costPrice: 2800,
      productType: PRODUCT_TYPES.FINISHED_GOOD,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.MANUFACTURING,
      vendor: '',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Hydraulic Pump Unit',
      sku: `PRD-${yearMonth}-0005`,
      description: 'High-pressure hydraulic pump, 250 bar, 45L/min',
      salesPrice: 85000,
      costPrice: 62000,
      productType: PRODUCT_TYPES.FINISHED_GOOD,
      procurementStrategy: PROCUREMENT_STRATEGY.MTO,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'HydroTech Systems',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Bearing 6205-2RS',
      sku: `PRD-${yearMonth}-0006`,
      description: 'Deep groove ball bearing, 25x52x15mm, double-sealed',
      salesPrice: 320,
      costPrice: 185,
      productType: PRODUCT_TYPES.COMPONENT,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'SKF India Limited',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Copper Wire 2.5sqmm',
      sku: `PRD-${yearMonth}-0007`,
      description: 'Electrolytic copper wire, 2.5 sq.mm, per 100m roll',
      salesPrice: 1800,
      costPrice: 1400,
      productType: PRODUCT_TYPES.RAW_MATERIAL,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'Polycab Wires',
      isActive: true,
      createdBy: adminUserId,
    },
    {
      productName: 'Electric Motor 3HP',
      sku: `PRD-${yearMonth}-0008`,
      description: '3HP single-phase electric motor, 1440 RPM',
      salesPrice: 12500,
      costPrice: 9200,
      productType: PRODUCT_TYPES.FINISHED_GOOD,
      procurementStrategy: PROCUREMENT_STRATEGY.MTS,
      procurementType: PROCUREMENT_TYPE.PURCHASE,
      vendor: 'Crompton Greaves',
      isActive: true,
      createdBy: adminUserId,
    },
  ];

  const inventoryData = [
    { onHandQty: 150, reservedQty: 20, minimumStockLevel: 50 },
    { onHandQty: 45, reservedQty: 10, minimumStockLevel: 30 },  // Normal
    { onHandQty: 5, reservedQty: 2, minimumStockLevel: 10 },    // LOW_STOCK
    { onHandQty: 28, reservedQty: 5, minimumStockLevel: 15 },
    { onHandQty: 3, reservedQty: 1, minimumStockLevel: 5 },     // LOW_STOCK
    { onHandQty: 500, reservedQty: 50, minimumStockLevel: 100 },
    { onHandQty: 12, reservedQty: 0, minimumStockLevel: 20 },   // LOW_STOCK
    { onHandQty: 18, reservedQty: 3, minimumStockLevel: 10 },
  ];

  const createdProducts = [];
  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    const invData = inventoryData[i];

    const existing = await Product.findOne({ sku: productData.sku });
    if (!existing) {
      const product = await Product.collection.insertOne({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const productId = product.insertedId;

      // Determine stockStatus
      const stockStatus = invData.onHandQty <= invData.minimumStockLevel ? 'LOW_STOCK' : 'NORMAL';

      await Inventory.collection.insertOne({
        productId,
        onHandQty: invData.onHandQty,
        reservedQty: invData.reservedQty,
        minimumStockLevel: invData.minimumStockLevel,
        stockStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createdProducts.push(productData.productName);
      logger.info(`✅ Created product: ${productData.productName} [${productData.sku}] — ${stockStatus}`);
    } else {
      logger.info(`⏭️  Product already exists: ${productData.sku}`);
    }
  }
  return createdProducts;
};

const seed = async () => {
  try {
    logger.info('🌱 Starting database seeder...');
    await mongoose.connect(process.env.MONGO_URI);
    logger.info(`✅ Connected to MongoDB: ${process.env.MONGO_URI}`);

    // Clear existing data to guarantee clean seed
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({})
    ]);
    logger.info('🧹 Cleared existing database collections.');

    const users = await seedUsers();
    const adminUser = await User.collection.findOne({ email: 'admin@erp.com' });
    await seedProducts(adminUser._id);

    logger.info('\n🎉 Seeding completed successfully!');
    logger.info('\n📋 Login Credentials:');
    logger.info('   admin@erp.com      | Admin@123     | ADMIN');
    logger.info('   owner@erp.com      | Owner@1234    | BUSINESS_OWNER');
    logger.info('   inventory@erp.com  | Inv@1234      | INVENTORY_MANAGER');
    logger.info('   sales@erp.com      | Sales@1234    | SALES_USER');
    logger.info('   purchase@erp.com   | Purchase@1234 | PURCHASE_USER');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    process.exit(0);
  }
};

seed();
