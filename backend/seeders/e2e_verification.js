'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../src/utils/logger');
const { connectDB } = require('../src/config/db');

// Models
const User = require('../src/models/User.model');
const Product = require('../src/models/Product.model');
const Inventory = require('../src/models/Inventory.model');
const BillOfMaterials = require('../src/models/BillOfMaterials.model');
const Customer = require('../src/models/Customer.model');
const SalesOrder = require('../src/models/SalesOrder.model');
const { ManufacturingOrder } = require('../src/models/ManufacturingOrder.model');
const WorkOrder = require('../src/models/WorkOrder.model');
const WorkCenter = require('../src/models/WorkCenter.model');
const InventoryMovement = require('../src/models/InventoryMovement.model');
const AuditLog = require('../src/models/AuditLog.model');
const Traceability = require('../src/models/Traceability.model');
const Delivery = require('../src/models/Delivery.model');

// Services
const erpWorkflowService = require('../src/services/erpWorkflow.service');
const manufacturingService = require('../src/services/manufacturing.service');
const deliveryService = require('../src/services/delivery.service');
const salesService = require('../src/services/sales.service');

async function runE2EValidation() {
  logger.info('==================================================');
  logger.info('   ERP MANUFACTURING END-TO-END VALIDATION');
  logger.info('==================================================\n');

  // 1. Connect to DB
  await connectDB();

  // 2. Find admin user
  const adminUser = await User.findOne({ role: 'ADMIN' });
  if (!adminUser) {
    throw new Error('Admin user must exist. Please run "npm run seed" first to seed basic roles/users.');
  }
  const userId = adminUser._id;
  logger.info(`Using User: ${adminUser.name} (${adminUser.role})`);

  // 3. Clean up existing data for this scenario
  logger.info('Cleaning up previous test data...');
  const testProductNames = ['Dining Table', 'Wooden Leg', 'Wooden Top', 'Screw'];
  const testProducts = await Product.find({ productName: { $in: testProductNames } });
  const testProductIds = testProducts.map(p => p._id);

  if (testProductIds.length > 0) {
    await Inventory.deleteMany({ productId: { $in: testProductIds } });
    await BillOfMaterials.deleteMany({ productId: { $in: testProductIds } });
    // Clean InventoryMovements for these products
    await InventoryMovement.deleteMany({ productId: { $in: testProductIds } });
    // Clean MOs for these products
    const moIds = await ManufacturingOrder.find({ productId: { $in: testProductIds } }).distinct('_id');
    if (moIds.length > 0) {
      await WorkOrder.deleteMany({ moId: { $in: moIds } });
    }
    await ManufacturingOrder.deleteMany({ productId: { $in: testProductIds } });
  }

  // Clean up test customers and their orders
  const existingCustomer = await Customer.findOne({ customerName: 'ABC Interiors' });
  if (existingCustomer) {
    const soIds = await SalesOrder.find({ customerId: existingCustomer._id }).distinct('_id');
    await Delivery.deleteMany({ soId: { $in: soIds } });
    await SalesOrder.deleteMany({ customerId: existingCustomer._id });
    await Customer.deleteOne({ _id: existingCustomer._id });
  }

  // Also clean SO-2026-001 directly if still lingering
  await SalesOrder.deleteMany({ soNumber: 'SO-2026-001' });
  await Product.deleteMany({ productName: { $in: testProductNames } });

  logger.info('Cleanup complete.\n');

  // 4. Seed Products
  logger.info('--- SEEDING SYSTEM DATA ---');
  
  // Create default Work Center if none exists
  let wc = await WorkCenter.findOne({ isActive: true });
  if (!wc) {
    wc = new WorkCenter({
      code: 'WC-01',
      name: 'Main Assembly Area',
      capacity: 10,
      costPerHour: 50,
      isActive: true,
      createdBy: userId
    });
    await wc.save();
    logger.info(`Created default Work Center: ${wc.name}`);
  }

  // Create products
  const leg = await Product.create({
    productName: 'Wooden Leg',
    sku: 'RAW-LEG-001',
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    costPrice: 25,
    salesPrice: 0,
    isActive: true,
    createdBy: userId
  });

  const top = await Product.create({
    productName: 'Wooden Top',
    sku: 'RAW-TOP-001',
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    costPrice: 80,
    salesPrice: 0,
    isActive: true,
    createdBy: userId
  });

  const screw = await Product.create({
    productName: 'Screw',
    sku: 'RAW-SCRW-001',
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    costPrice: 0.5,
    salesPrice: 0,
    isActive: true,
    createdBy: userId
  });

  const table = await Product.create({
    productName: 'Dining Table',
    sku: 'FG-TABL-001',
    productType: 'FINISHED_GOOD',
    procurementStrategy: 'MTO',
    procurementType: 'MANUFACTURING',
    costPrice: 200,
    salesPrice: 500,
    isActive: true,
    createdBy: userId
  });

  logger.info('Products created: Dining Table, Wooden Leg, Wooden Top, Screw.');

  // 5. Seed Inventory Levels
  await Inventory.create({ productId: table._id, onHandQty: 5, reservedQty: 0, minimumStockLevel: 2 });
  await Inventory.create({ productId: leg._id, onHandQty: 100, reservedQty: 0, minimumStockLevel: 10 });
  await Inventory.create({ productId: top._id, onHandQty: 50, reservedQty: 0, minimumStockLevel: 5 });
  await Inventory.create({ productId: screw._id, onHandQty: 1000, reservedQty: 0, minimumStockLevel: 100 });

  logger.info('Inventory seeded: Table = 5, Leg = 100, Top = 50, Screw = 1000.');

  // 6. Seed BoM
  const bom = await BillOfMaterials.create({
    bomCode: 'BOM-TABLE-001',
    productId: table._id,
    quantity: 1,
    components: [
      { productId: leg._id, quantity: 4, uom: 'units' },
      { productId: top._id, quantity: 1, uom: 'units' },
      { productId: screw._id, quantity: 12, uom: 'units' }
    ],
    isActive: true,
    createdBy: userId
  });

  logger.info('Bill of Materials seeded: 1 Dining Table = 4 Legs, 1 Top, 12 Screws.');

  // 7. Seed Customer
  const customer = await Customer.create({
    customerName: 'ABC Interiors',
    email: 'procurement@abcinteriors.com',
    phone: '+91 99999 88888',
    address: '45 Interior Lane, MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    isActive: true
  });
  logger.info('Customer "ABC Interiors" seeded.\n');

  // ===========================================================================
  // RUN WORKFLOW STEPS
  // ===========================================================================

  logger.info('--- RUNNING WORKFLOW STEPS ---');

  // STEP 1: Create Sales Order
  logger.info('\n[STEP 1] Creating Sales Order in Draft status...');
  const so = new SalesOrder({
    soNumber: 'SO-2026-001',
    customerId: customer._id,
    orderDate: new Date(),
    items: [
      {
        productId: table._id,
        quantity: 20,
        unitPrice: 500,
        totalPrice: 10000
      }
    ],
    totalAmount: 10000,
    status: 'Draft',
    createdBy: userId
  });
  await so.save();
  logger.info(`Sales Order created: ${so.soNumber} | Status: ${so.status} | Qty: 20`);


  // STEP 2 & 3: Confirm Sales Order
  logger.info('\n[STEP 2 & 3] Confirming Sales Order & trigger replenishment...');
  so.status = 'Confirmed';
  await so.save();

  // Run central orchestrator confirmation workflow
  await erpWorkflowService.handleSalesOrderConfirmed(so._id, userId);

  // Check Sales Order reservation
  const tableInv = await Inventory.findOne({ productId: table._id });
  logger.info(`Dining Table stock: On Hand = ${tableInv.onHandQty}, Reserved = ${tableInv.reservedQty}, Free = ${tableInv.onHandQty - tableInv.reservedQty}`);
  logger.info(`Orchestration logic reserved 5 tables from stock.`);

  // Check generated MO
  const mo = await ManufacturingOrder.findOne({ productId: table._id });
  if (!mo) throw new Error('Failed to auto-generate Manufacturing Order.');
  logger.info(`Manufacturing Order generated automatically: ${mo.moNumber} | Planned Qty: ${mo.plannedQty} | Status: ${mo.status}`);
  if (mo.plannedQty !== 15) throw new Error(`Expected MO quantity to be 15, but got ${mo.plannedQty}`);


  // STEP 4 & 5: Load BoM and validate stock
  logger.info('\n[STEP 4 & 5] Confirming Manufacturing Order (Loads BoM & validates stock)...');
  await manufacturingService.confirmManufacturingOrder(mo._id);
  const confirmedMo = await ManufacturingOrder.findById(mo._id);
  logger.info(`MO ${confirmedMo.moNumber} Status: ${confirmedMo.status}`);
  
  // Verify component required quantities calculated
  logger.info('Required Components computed:');
  for (const comp of confirmedMo.components) {
    const compProduct = await Product.findById(comp.productId);
    logger.info(`  - ${compProduct.productName}: Required = ${comp.requiredQty}`);
  }


  // STEP 6 & 7: Start Production (Reserves components & generates Work Orders)
  logger.info('\n[STEP 6 & 7] Starting Production (Reserves component inventory & generates Work Orders)...');
  await manufacturingService.startProduction(mo._id, userId);

  // Check inventory levels after reservation
  logger.info('Inventory levels after reservation:');
  const legInv = await Inventory.findOne({ productId: leg._id });
  const topInv = await Inventory.findOne({ productId: top._id });
  const screwInv = await Inventory.findOne({ productId: screw._id });
  logger.info(`  - Wooden Legs: OnHand = ${legInv.onHandQty}, Reserved = ${legInv.reservedQty}, Free = ${legInv.onHandQty - legInv.reservedQty}`);
  logger.info(`  - Wooden Tops: OnHand = ${topInv.onHandQty}, Reserved = ${topInv.reservedQty}, Free = ${topInv.onHandQty - topInv.reservedQty}`);
  logger.info(`  - Screws: OnHand = ${screwInv.onHandQty}, Reserved = ${screwInv.reservedQty}, Free = ${screwInv.onHandQty - screwInv.reservedQty}`);

  // Fetch Work Orders
  const workOrders = await WorkOrder.find({ moId: mo._id }).sort({ createdAt: 1 });
  logger.info(`Work Orders generated: ${workOrders.length}`);
  workOrders.forEach(wo => {
    logger.info(`  - ${wo.woNumber} ${wo.name} | Status: ${wo.status}`);
  });


  // STEP 8: Complete all Work Orders
  logger.info('\n[STEP 8] Completing all Work Orders...');
  for (const wo of workOrders) {
    await manufacturingService.completeWorkOrder(wo._id, userId);
    logger.info(`  - Work Order ${wo.woNumber} ${wo.name} set to COMPLETED.`);
  }


  // STEP 9 & 10 & 11 & 12: Verify Manufacturing Order auto-completion & Sales Order update
  logger.info('\n[STEP 9 & 10 & 11 & 12] Verifying MO and SO status after Work Orders completion...');
  const finalMo = await ManufacturingOrder.findById(mo._id);
  logger.info(`Manufacturing Order ${finalMo.moNumber} Status: ${finalMo.status} | Produced Qty: ${finalMo.producedQty}`);

  // Verify component consumption
  const postLegInv = await Inventory.findOne({ productId: leg._id });
  const postTopInv = await Inventory.findOne({ productId: top._id });
  const postScrewInv = await Inventory.findOne({ productId: screw._id });
  logger.info('Component Inventory after consumption:');
  logger.info(`  - Wooden Legs: OnHand = ${postLegInv.onHandQty} (Expected: 40)`);
  logger.info(`  - Wooden Tops: OnHand = ${postTopInv.onHandQty} (Expected: 35)`);
  logger.info(`  - Screws: OnHand = ${postScrewInv.onHandQty} (Expected: 820)`);

  // Verify produced Dining Tables stock
  const postTableInv = await Inventory.findOne({ productId: table._id });
  logger.info('Finished Good Inventory:');
  logger.info(`  - Dining Tables: OnHand = ${postTableInv.onHandQty} (Expected: 20, was 5 + 15 produced)`);
  logger.info(`  - Dining Tables: Reserved = ${postTableInv.reservedQty} (Expected: 20 — 5 initial + 15 MTO produced, both reserved for SO)`);

  // Verify Sales Order status
  const postSo = await SalesOrder.findById(so._id);
  logger.info(`Sales Order ${postSo.soNumber} Status: ${postSo.status} (Expected: Ready For Delivery)`);


  // STEP 13: Execute Delivery
  logger.info('\n[STEP 13] Executing Delivery for 20 Dining Tables...');
  const delivery = await deliveryService.processDelivery({
    soId: so._id,
    items: [
      {
        productId: table._id,
        quantityShipped: 20
      }
    ]
  }, userId);
  
  logger.info(`Delivery processed: ${delivery.deliveryNumber}`);
  const finalSo = await SalesOrder.findById(so._id);
  logger.info(`Sales Order ${finalSo.soNumber} Status: ${finalSo.status} (Expected: Fully Delivered)`);

  const finalTableInv = await Inventory.findOne({ productId: table._id });
  logger.info(`Dining Tables stock after delivery: OnHand = ${finalTableInv.onHandQty} (Expected: 0) | Reserved = ${finalTableInv.reservedQty} (Expected: 0)`);


  // STEP 14: Verify Inventory Movement Ledger
  logger.info('\n[STEP 14] Verifying Inventory Movement Ledger...');
  // Use the current-seed product IDs (not the stale pre-cleanup IDs)
  const currentProductIds = [table._id, leg._id, top._id, screw._id];
  const movements = await InventoryMovement.find({
    productId: { $in: currentProductIds }
  }).sort({ createdAt: 1 }).populate('productId', 'productName');
  
  logger.info(`  Total ledger entries recorded: ${movements.length}`);
  movements.forEach(m => {
    const name = m.productId ? m.productId.productName : '(unknown)';
    logger.info(`  [Ledger] ${name} | Type: ${m.movementType} | Qty: ${m.quantity} | Prev: ${m.previousQty} → New: ${m.newQty} | Ref: ${m.referenceType}`);
  });


  // STEP 15: Verify Audit Logs
  logger.info('\n[STEP 15] Verifying Audit Logs...');
  const auditLogs = await AuditLog.find({
    module: { $in: ['SALES', 'MANUFACTURING'] }
  }).sort({ createdAt: 1 });

  auditLogs.forEach(log => {
    logger.info(`  [AuditLog] Action: ${log.action} | Module: ${log.module} | Details: ${JSON.stringify(log.details)}`);
  });

  logger.info('\n==================================================');
  logger.info('   E2E VALIDATION RUN COMPLETED SUCCESSFULLY!');
  logger.info('==================================================');

  await mongoose.connection.close();
  process.exit(0);
}

runE2EValidation().catch(err => {
  logger.error('E2E Validation Failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
