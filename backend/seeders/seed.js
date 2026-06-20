'use strict';

/**
 * Database Seeder
 * Creates default users, sample products, inventory, customers, sales orders,
 * deliveries, vendors, purchase orders, goods receipts, work centers,
 * bills of materials, and manufacturing orders.
 * Run: node seeders/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User.model');
const Product = require('../src/models/Product.model');
const Inventory = require('../src/models/Inventory.model');
const Customer = require('../src/models/Customer.model');
const SalesOrder = require('../src/models/SalesOrder.model');
const Delivery = require('../src/models/Delivery.model');
const InventoryMovement = require('../src/models/InventoryMovement.model');
const Vendor = require('../src/models/Vendor.model');
const { PurchaseOrder } = require('../src/models/PurchaseOrder.model');
const GoodsReceipt = require('../src/models/GoodsReceipt.model');
const WorkCenter = require('../src/models/WorkCenter.model');
const BillOfMaterials = require('../src/models/BillOfMaterials.model');
const { ManufacturingOrder } = require('../src/models/ManufacturingOrder.model');

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
    {
      name: 'Manufacturing Lead',
      email: 'manufacturing@erp.com',
      password: await bcrypt.hash('Mfg@1234', SALT_ROUNDS),
      role: ROLES.MANUFACTURING_USER,
      isActive: true,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
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

const seedVendors = async () => {
  const vendors = [
    {
      vendorCode: 'VND-0001',
      vendorName: 'Steel Works India Pvt Ltd',
      contactPerson: 'Rajesh Kumar',
      email: 'sales@steelworks.com',
      phone: '+91 9988776655',
      gstNumber: '27STW1234A1Z0',
      address: 'Plot 45, MIDC Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411018',
      paymentTerms: 'Net 30',
      leadTimeDays: 5,
      rating: 4.5,
      isActive: true,
    },
    {
      vendorCode: 'VND-0002',
      vendorName: 'MetAlco Supplies',
      contactPerson: 'Amit Shah',
      email: 'orders@metalco.com',
      phone: '+91 8877665544',
      gstNumber: '24MET5678B2Z1',
      address: 'GIDC Estate, Zone B',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      pincode: '380015',
      paymentTerms: 'Net 15',
      leadTimeDays: 7,
      rating: 4.0,
      isActive: true,
    },
    {
      vendorCode: 'VND-0003',
      vendorName: 'SKF India Limited',
      contactPerson: 'Sanjay Deshmukh',
      email: 'support@skfindia.com',
      phone: '+91 7766554433',
      gstNumber: '27SKF9999C3Z2',
      address: 'Chinchwad Industrial Zone',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411019',
      paymentTerms: 'Net 45',
      leadTimeDays: 3,
      rating: 4.8,
      isActive: true,
    },
    {
      vendorCode: 'VND-0004',
      vendorName: 'HydroTech Systems',
      contactPerson: 'Vikram Mehta',
      email: 'sales@hydrotech.com',
      phone: '+91 6655443322',
      gstNumber: '29HYD8888D4Z3',
      address: 'Peenya Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560058',
      paymentTerms: 'Net 30',
      leadTimeDays: 10,
      rating: 4.2,
      isActive: true,
    },
  ];

  const created = await Vendor.insertMany(vendors);
  logger.info(`✅ Seeded ${created.length} Vendors`);
  return created;
};

const seedProducts = async (adminUserId, vendors) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const getVendorId = (name) => {
    const v = vendors.find((v) => v.vendorName === name);
    return v ? v._id : null;
  };

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
      vendorId: getVendorId('Steel Works India Pvt Ltd'),
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
      vendorId: getVendorId('MetAlco Supplies'),
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
      vendorId: null,
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
      vendorId: null,
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
      vendorId: getVendorId('HydroTech Systems'),
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
      vendorId: getVendorId('SKF India Limited'),
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
      vendorId: null,
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
      vendorId: null,
      isActive: true,
      createdBy: adminUserId,
    },
  ];

  const inventoryData = [
    { onHandQty: 150, reservedQty: 20, minimumStockLevel: 50 },
    { onHandQty: 45, reservedQty: 10, minimumStockLevel: 30 },  // Normal
    { onHandQty: 50, reservedQty: 2, minimumStockLevel: 10 },   // Normal (increased from 5 to avoid initial shortages)
    { onHandQty: 28, reservedQty: 5, minimumStockLevel: 15 },
    { onHandQty: 3, reservedQty: 1, minimumStockLevel: 5 },     // LOW_STOCK
    { onHandQty: 500, reservedQty: 50, minimumStockLevel: 100 },
    { onHandQty: 120, reservedQty: 0, minimumStockLevel: 20 },   // Normal (increased from 12)
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

      createdProducts.push({ ...productData, _id: productId });
      logger.info(`✅ Created product: ${productData.productName} [${productData.sku}] — ${stockStatus}`);
    } else {
      const inv = await Inventory.findOne({ productId: existing._id });
      createdProducts.push({ ...existing.toObject(), _id: existing._id });
      logger.info(`⏭️  Product already exists: ${productData.sku}`);
    }
  }
  return createdProducts;
};

const seedCustomers = async () => {
  const customers = [
    {
      customerCode: 'CUST-0001',
      customerName: 'Acme Manufacturing Corp',
      email: 'procurement@acme.com',
      phone: '+1 555-0199',
      gstNumber: '27AAAAA1111A1Z1',
      address: '101 Industrial Parkway, Sector 4',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      isActive: true
    },
    {
      customerCode: 'CUST-0002',
      customerName: 'Apex Tech Builders Ltd',
      email: 'supplies@apextech.com',
      phone: '+91 9876543210',
      gstNumber: '19BBBBB2222B2Z2',
      address: '402 Cyber Towers, Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500081',
      isActive: true
    },
    {
      customerCode: 'CUST-0003',
      customerName: 'Global Trade Logistics',
      email: 'info@globaltrade.com',
      phone: '+91 22 2456 7890',
      gstNumber: '29CCCCC3333C3Z3',
      address: 'Building 7A, Harbour Port',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '600001',
      isActive: true
    }
  ];
  const created = await Customer.insertMany(customers);
  logger.info(`✅ Seeded ${created.length} Customers`);
  return created;
};

const seedSalesWorkflows = async (users, customers, products) => {
  const steelRod = products.find((p) => p.productName === 'Steel Rod 10mm');
  const bearing = products.find((p) => p.productName === 'Bearing 6205-2RS');
  const adminUser = users.find(u => u.role === ROLES.ADMIN);

  if (!steelRod || !bearing || !adminUser) {
    logger.warn('⚠️ Product or user missing for sales order seeding.');
    return;
  }

  // 1. Create a DRAFT Sales Order
  const draftSO = new SalesOrder({
    soNumber: 'SO-2026-0001',
    customerId: customers[0]._id,
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    items: [{
      productId: steelRod._id,
      quantity: 10,
      unitPrice: steelRod.salesPrice,
      totalPrice: 10 * steelRod.salesPrice
    }],
    totalAmount: 10 * steelRod.salesPrice,
    status: 'Draft',
    remarks: 'Standard draft order to be reviewed.',
    createdBy: adminUser._id
  });
  await draftSO.save();
  logger.info('✅ Seeded Sales Order: SO-2026-0001 [Draft]');

  // 2. Create a CONFIRMED Sales Order (Stock Reserved)
  const confirmedSO = new SalesOrder({
    soNumber: 'SO-2026-0002',
    customerId: customers[1]._id,
    orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    items: [{
      productId: bearing._id,
      quantity: 15,
      unitPrice: bearing.salesPrice,
      totalPrice: 15 * bearing.salesPrice
    }],
    totalAmount: 15 * bearing.salesPrice,
    status: 'Confirmed',
    remarks: 'Confirmed order, stock reserved.',
    createdBy: adminUser._id
  });
  await confirmedSO.save();
  logger.info('✅ Seeded Sales Order: SO-2026-0002 [Confirmed]');

  // Update Inventory: reserve 15 bearings
  await Inventory.findOneAndUpdate(
    { productId: bearing._id },
    { $inc: { reservedQty: 15 } }
  );

  // Log reservation movement
  await new InventoryMovement({
    productId: bearing._id,
    quantity: 15,
    movementType: 'SALES_RESERVATION',
    referenceType: 'SalesOrder',
    referenceId: confirmedSO._id,
    remarks: 'Reserved 15 bearings for SO-2026-0002',
    previousQty: 500,
    newQty: 515,
    createdBy: adminUser._id
  }).save();

  // 3. Create a DELIVERED Sales Order (Fully Shipped)
  const deliveredSO = new SalesOrder({
    soNumber: 'SO-2026-0003',
    customerId: customers[2]._id,
    orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    items: [{
      productId: steelRod._id,
      quantity: 5,
      unitPrice: steelRod.salesPrice,
      totalPrice: 5 * steelRod.salesPrice
    }],
    totalAmount: 5 * steelRod.salesPrice,
    status: 'Fully Delivered',
    remarks: 'Order delivered and invoiced.',
    createdBy: adminUser._id
  });
  await deliveredSO.save();
  logger.info('✅ Seeded Sales Order: SO-2026-0003 [Fully Delivered]');

  // Create Delivery document
  const dlv = new Delivery({
    deliveryNumber: 'DLV-202606-0001',
    soId: deliveredSO._id,
    deliveryDate: new Date(),
    items: [{
      productId: steelRod._id,
      quantityShipped: 5
    }],
    shippedBy: adminUser._id
  });
  await dlv.save();
  logger.info('✅ Seeded Delivery: DLV-202606-0001');

  // Deduct Inventory
  await Inventory.findOneAndUpdate(
    { productId: steelRod._id },
    { $inc: { onHandQty: -5 } }
  );

  // Log physical delivery movement
  await new InventoryMovement({
    productId: steelRod._id,
    quantity: 5,
    movementType: 'SALES_DELIVERY',
    referenceType: 'Delivery',
    referenceId: dlv._id,
    remarks: 'Shipped 5 steel rods for DLV-202606-0001',
    previousQty: 150,
    newQty: 145,
    createdBy: adminUser._id
  }).save();
};

const seedPurchaseWorkflows = async (users, vendors, products) => {
  const steelRod = products.find((p) => p.productName === 'Steel Rod 10mm');
  const bearing = products.find((p) => p.productName === 'Bearing 6205-2RS');
  const purchaseUser = users.find(u => u.role === ROLES.PURCHASE_USER) || users[0];

  if (!steelRod || !bearing) {
    logger.warn('⚠️ Raw materials or bearings missing for PO seeding.');
    return;
  }

  // 1. Create a DRAFT PO
  const po1 = new PurchaseOrder({
    poNumber: 'PO/2026/0001',
    vendorId: vendors[0]._id,
    orderDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    items: [{
      productId: steelRod._id,
      quantity: 100,
      unitCost: steelRod.costPrice,
      totalCost: 100 * steelRod.costPrice
    }],
    totalAmount: 100 * steelRod.costPrice,
    status: 'Draft',
    createdBy: purchaseUser._id
  });
  await po1.save();
  logger.info('✅ Seeded PO: PO/2026/0001 [Draft]');

  // 2. Create a RECEIVED PO with Goods Receipt
  const po2 = new PurchaseOrder({
    poNumber: 'PO/2026/0002',
    vendorId: vendors[2]._id,
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expectedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    items: [{
      productId: bearing._id,
      quantity: 200,
      unitCost: bearing.costPrice,
      totalCost: 200 * bearing.costPrice
    }],
    totalAmount: 200 * bearing.costPrice,
    status: 'Fully Received',
    createdBy: purchaseUser._id
  });
  await po2.save();
  logger.info('✅ Seeded PO: PO/2026/0002 [Fully Received]');

  const gr = new GoodsReceipt({
    grNumber: 'GR/2026/0001',
    poId: po2._id,
    receiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    receivedBy: purchaseUser._id,
    items: [{
      productId: bearing._id,
      quantityReceived: 200,
      status: 'ACCEPTED'
    }],
    remarks: 'Seeded goods receipt - perfect count.'
  });
  await gr.save();
  logger.info('✅ Seeded Goods Receipt: GR/2026/0001');

  // Add 200 bearings to inventory
  await Inventory.findOneAndUpdate(
    { productId: bearing._id },
    { $inc: { onHandQty: 200 } }
  );

  // Log receipt movement
  await new InventoryMovement({
    productId: bearing._id,
    quantity: 200,
    movementType: 'PURCHASE_RECEIPT',
    referenceType: 'GoodsReceipt',
    referenceId: gr._id,
    remarks: 'Received 200 bearings via GR/2026/0001',
    previousQty: 300,
    newQty: 500,
    createdBy: purchaseUser._id
  }).save();
};

const seedManufacturingWorkflows = async (users, products) => {
  const steelRod = products.find((p) => p.productName === 'Steel Rod 10mm');
  const aluminumSheet = products.find((p) => p.productName === 'Aluminium Sheet 2mm');
  const gearAssembly = products.find((p) => p.productName === 'Industrial Gear Assembly');
  const machinedBracket = products.find((p) => p.productName === 'CNC Machined Bracket');
  const bearing = products.find((p) => p.productName === 'Bearing 6205-2RS');
  const mfgUser = users.find(u => u.role === ROLES.MANUFACTURING_USER) || users[0];

  if (!steelRod || !aluminumSheet || !gearAssembly || !machinedBracket || !bearing) {
    logger.warn('⚠️ Products missing for manufacturing seeding.');
    return;
  }

  // 1. Seed Work Centers
  const wc1 = new WorkCenter({
    code: 'WC001',
    name: 'CNC Milling Station',
    description: 'Precision 3-axis CNC milling and drilling station',
    capacity: 10,
    costPerHour: 150,
    isActive: true,
    createdBy: mfgUser._id,
  });
  const wc2 = new WorkCenter({
    code: 'WC002',
    name: 'Assembly Line A',
    description: 'Manual assembly station with pneumatic tools',
    capacity: 20,
    costPerHour: 80,
    isActive: true,
    createdBy: mfgUser._id,
  });
  await wc1.save();
  await wc2.save();
  logger.info('✅ Seeded Work Centers: CNC Milling Station, Assembly Line A');

  // 2. Seed Bills of Materials (BoMs)
  // CNC Machined Bracket BoM: needs 2 Steel Rod, 1 Aluminium Sheet, 4 Bearings
  const bom1 = new BillOfMaterials({
    bomCode: 'BOM0001',
    productId: machinedBracket._id,
    quantity: 1,
    version: 1,
    description: 'Standard BoM for CNC Machined Bracket',
    isActive: true,
    createdBy: mfgUser._id,
    components: [
      { productId: steelRod._id, quantity: 2, uom: 'units' },
      { productId: aluminumSheet._id, quantity: 1, uom: 'units' },
      { productId: bearing._id, quantity: 4, uom: 'units' },
    ],
  });
  await bom1.save();

  // Industrial Gear Assembly BoM: needs 4 Steel Rod, 2 Bearings
  const bom2 = new BillOfMaterials({
    bomCode: 'BOM0002',
    productId: gearAssembly._id,
    quantity: 1,
    version: 1,
    description: 'BoM for Industrial Gear Assembly',
    isActive: true,
    createdBy: mfgUser._id,
    components: [
      { productId: steelRod._id, quantity: 4, uom: 'units' },
      { productId: bearing._id, quantity: 2, uom: 'units' },
    ],
  });
  await bom2.save();
  logger.info('✅ Seeded Bills of Materials: BOM0001, BOM0002');

  // 3. Seed Manufacturing Orders (MOs)
  // MO 1: Done MO (completed)
  const mo1 = new ManufacturingOrder({
    moNumber: 'MO/2026/0001',
    bomId: bom1._id,
    productId: machinedBracket._id,
    workCenterId: wc1._id,
    plannedQty: 10,
    producedQty: 10,
    status: 'DONE',
    scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    remarks: 'Completed smoothly with no defects.',
    createdBy: mfgUser._id,
    components: [
      { productId: steelRod._id, requiredQty: 20, consumedQty: 20, reservedQty: 0 },
      { productId: aluminumSheet._id, requiredQty: 10, consumedQty: 10, reservedQty: 0 },
      { productId: bearing._id, requiredQty: 40, consumedQty: 40, reservedQty: 0 },
    ],
  });
  await mo1.save();
  logger.info('✅ Seeded Manufacturing Order: MO/2026/0001 [DONE]');

  // MO 2: In Progress MO (components reserved)
  const mo2 = new ManufacturingOrder({
    moNumber: 'MO/2026/0002',
    bomId: bom2._id,
    productId: gearAssembly._id,
    workCenterId: wc2._id,
    plannedQty: 5,
    producedQty: 0,
    status: 'IN_PROGRESS',
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    remarks: 'Components reserved. Assembly scheduled.',
    createdBy: mfgUser._id,
    components: [
      { productId: steelRod._id, requiredQty: 20, consumedQty: 0, reservedQty: 20 },
      { productId: bearing._id, requiredQty: 10, consumedQty: 0, reservedQty: 10 },
    ],
  });
  await mo2.save();
  logger.info('✅ Seeded Manufacturing Order: MO/2026/0002 [IN_PROGRESS]');

  // Update component inventory reserves for the in-progress MO (Steel Rod & Bearings)
  await Inventory.findOneAndUpdate({ productId: steelRod._id }, { $inc: { reservedQty: 20 } });
  await Inventory.findOneAndUpdate({ productId: bearing._id }, { $inc: { reservedQty: 10 } });

  // Log component reservation movements for MO 2
  await new InventoryMovement({
    productId: steelRod._id,
    quantity: 20,
    movementType: 'MFG_COMPONENT_CONSUME',
    referenceType: 'ManufacturingOrder',
    referenceId: mo2._id,
    remarks: 'Component reserved for MO MO/2026/0002',
    previousQty: 0,
    newQty: 20,
    createdBy: mfgUser._id,
  }).save();

  await new InventoryMovement({
    productId: bearing._id,
    quantity: 10,
    movementType: 'MFG_COMPONENT_CONSUME',
    referenceType: 'ManufacturingOrder',
    referenceId: mo2._id,
    remarks: 'Component reserved for MO MO/2026/0002',
    previousQty: 0,
    newQty: 10,
    createdBy: mfgUser._id,
  }).save();
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
      Inventory.deleteMany({}),
      Customer.deleteMany({}),
      SalesOrder.deleteMany({}),
      Delivery.deleteMany({}),
      InventoryMovement.deleteMany({}),
      Vendor.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      GoodsReceipt.deleteMany({}),
      WorkCenter.deleteMany({}),
      BillOfMaterials.deleteMany({}),
      ManufacturingOrder.deleteMany({}),
    ]);
    logger.info('🧹 Cleared existing database collections.');

    const users = await seedUsers();
    const adminUser = users.find((u) => u.role === ROLES.ADMIN);
    const vendors = await seedVendors();
    const products = await seedProducts(adminUser._id, vendors);
    const customers = await seedCustomers();

    await seedSalesWorkflows(users, customers, products);
    await seedPurchaseWorkflows(users, vendors, products);
    await seedManufacturingWorkflows(users, products);

    logger.info('\n🎉 Seeding completed successfully!');
    logger.info('\n📋 Login Credentials:');
    logger.info('   admin@erp.com          | Admin@123     | ADMIN');
    logger.info('   owner@erp.com          | Owner@1234    | BUSINESS_OWNER');
    logger.info('   inventory@erp.com      | Inv@1234      | INVENTORY_MANAGER');
    logger.info('   sales@erp.com          | Sales@1234    | SALES_USER');
    logger.info('   purchase@erp.com       | Purchase@1234 | PURCHASE_USER');
    logger.info('   manufacturing@erp.com  | Mfg@1234      | MANUFACTURING_USER');
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
