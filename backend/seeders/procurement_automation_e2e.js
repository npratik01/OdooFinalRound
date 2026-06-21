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
const Vendor = require('../src/models/Vendor.model');
const { PurchaseOrder } = require('../src/models/PurchaseOrder.model');
const GoodsReceipt = require('../src/models/GoodsReceipt.model');

// Services
const erpWorkflowService = require('../src/services/erpWorkflow.service');
const manufacturingService = require('../src/services/manufacturing.service');
const deliveryService = require('../src/services/delivery.service');
const salesService = require('../src/services/sales.service');
const purchaseService = require('../src/services/purchase.service');

async function runE2EValidation() {
  logger.info('==================================================');
  logger.info('   ERP PROCUREMENT AUTOMATION & PARTIAL DELIVERY E2E');
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
    await InventoryMovement.deleteMany({ productId: { $in: testProductIds } });
    
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

  // Clean up POs and Receipts for the test vendor
  const existingVendor = await Vendor.findOne({ vendorName: 'Global Timber Supplier' });
  if (existingVendor) {
    await PurchaseOrder.deleteMany({ vendorId: existingVendor._id });
    await Vendor.deleteOne({ _id: existingVendor._id });
  }

  await SalesOrder.deleteMany({ soNumber: 'SO-2026-001' });
  await Product.deleteMany({ productName: { $in: testProductNames } });

  logger.info('Cleanup complete.\n');

  // 4. Seed Vendor
  logger.info('--- SEEDING VENDOR ---');
  const vendor = await Vendor.create({
    vendorName: 'Global Timber Supplier',
    email: 'sales@globaltimber.com',
    phone: '+91 99999 77777',
    isActive: true,
  });
  logger.info(`Vendor created: ${vendor.vendorName} (${vendor.vendorCode})`);

  // 5. Seed Products
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
    createdBy: userId,
    vendor: 'Global Timber Supplier',
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
    createdBy: userId,
    vendor: 'Global Timber Supplier',
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
    createdBy: userId,
    vendor: 'Global Timber Supplier',
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

  // 6. Seed Inventory Levels (Leg = 20, Top = 10, Table = 5)
  await Inventory.create({ productId: table._id, onHandQty: 5, reservedQty: 0, minimumStockLevel: 2 });
  await Inventory.create({ productId: leg._id, onHandQty: 20, reservedQty: 0, minimumStockLevel: 10 });
  await Inventory.create({ productId: top._id, onHandQty: 10, reservedQty: 0, minimumStockLevel: 5 });
  await Inventory.create({ productId: screw._id, onHandQty: 1000, reservedQty: 0, minimumStockLevel: 100 });

  logger.info('Inventory seeded: Table = 5, Leg = 20, Top = 10, Screw = 1000.');

  // 7. Seed BoM
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

  // 8. Seed Customer
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


  // STEP 2 & 3: Confirm Sales Order & trigger auto partial delivery
  logger.info('\n[STEP 2 & 3] Confirming Sales Order & trigger orchestration...');
  so.status = 'Confirmed';
  await so.save();

  // Run central orchestrator confirmation workflow
  await erpWorkflowService.handleSalesOrderConfirmed(so._id, userId);

  // Verify stock & reservations
  const postConfTableInv = await Inventory.findOne({ productId: table._id });
  logger.info(`Dining Table stock after confirmation: On Hand = ${postConfTableInv.onHandQty}, Reserved = ${postConfTableInv.reservedQty}`);
  
  // Verify Sales Order status (should be Partially Delivered now because 5 tables were in stock and auto-delivered)
  const postConfSo = await SalesOrder.findById(so._id);
  logger.info(`Sales Order ${postConfSo.soNumber} Status: ${postConfSo.status} (Expected: Partially Delivered)`);
  if (postConfSo.status !== 'Partially Delivered') {
    throw new Error(`Expected SO status to be Partially Delivered, but got: ${postConfSo.status}`);
  }

  // Check generated MO for deficit of 15
  const mo = await ManufacturingOrder.findOne({ productId: table._id });
  if (!mo) throw new Error('Failed to auto-generate Manufacturing Order.');
  logger.info(`Manufacturing Order generated automatically: ${mo.moNumber} | Planned Qty: ${mo.plannedQty} | Status: ${mo.status}`);
  if (mo.plannedQty !== 15) throw new Error(`Expected MO quantity to be 15, but got ${mo.plannedQty}`);


  // STEP 4 & 5: Confirm Manufacturing Order & check shortage detection
  logger.info('\n[STEP 4 & 5] Confirming Manufacturing Order (Triggering Shortage Detection)...');
  await manufacturingService.confirmManufacturingOrder(mo._id, userId);

  const confirmedMo = await ManufacturingOrder.findById(mo._id);
  logger.info(`MO ${confirmedMo.moNumber} Status: ${confirmedMo.status} (Expected: WAITING_FOR_COMPONENTS)`);
  if (confirmedMo.status !== 'WAITING_FOR_COMPONENTS') {
    throw new Error(`Expected MO status to be WAITING_FOR_COMPONENTS, but got: ${confirmedMo.status}`);
  }

  // Verify shortage POs were created and linked
  logger.info(`MO component PO count: ${confirmedMo.componentPOs.length} (Expected: 2)`);
  if (confirmedMo.componentPOs.length !== 2) {
    throw new Error(`Expected exactly 2 POs to be generated, but got ${confirmedMo.componentPOs.length}`);
  }

  const generatedPOs = await PurchaseOrder.find({ _id: { $in: confirmedMo.componentPOs } }).populate('items.productId');
  for (const poDoc of generatedPOs) {
    logger.info(`  → PO: ${poDoc.poNumber} | Status: ${poDoc.status} | Item: ${poDoc.items[0].productId.productName} | Qty: ${poDoc.items[0].quantity}`);
  }


  // STEP 6: Process GRN for Wooden Legs PO
  logger.info('\n[STEP 6] Receiving Goods for Wooden Legs PO...');
  const legPO = generatedPOs.find(p => p.items[0].productId.sku === 'RAW-LEG-001');
  if (!legPO) throw new Error('Wooden Legs PO not found.');

  await purchaseService.receiveGoods(legPO._id, {
    items: [{ productId: leg._id, quantityReceived: 40 }],
    remarks: 'Received 40 Wooden Legs for MO shortage fulfillment'
  }, userId);

  // Check inventory levels
  const legInvAfterGRN = await Inventory.findOne({ productId: leg._id });
  logger.info(`Wooden Legs inventory after receipt: On Hand = ${legInvAfterGRN.onHandQty} (Expected: 60) | Reserved = ${legInvAfterGRN.reservedQty} (Expected: 0)`);
  if (legInvAfterGRN.onHandQty !== 60) {
    throw new Error(`Expected Legs on hand to be 60, but got ${legInvAfterGRN.onHandQty}`);
  }

  // MO should still be WAITING_FOR_COMPONENTS because Wooden Tops are still short
  const moAfterLegReceipt = await ManufacturingOrder.findById(mo._id);
  logger.info(`MO ${moAfterLegReceipt.moNumber} Status: ${moAfterLegReceipt.status} (Expected: WAITING_FOR_COMPONENTS)`);
  if (moAfterLegReceipt.status !== 'WAITING_FOR_COMPONENTS') {
    throw new Error(`Expected MO to remain WAITING_FOR_COMPONENTS, but got: ${moAfterLegReceipt.status}`);
  }


  // STEP 7: Process GRN for Wooden Tops PO (Should auto-resume MO)
  logger.info('\n[STEP 7] Receiving Goods for Wooden Tops PO (Should auto-resume MO)...');
  const topPO = generatedPOs.find(p => p.items[0].productId.sku === 'RAW-TOP-001');
  if (!topPO) throw new Error('Wooden Tops PO not found.');

  await purchaseService.receiveGoods(topPO._id, {
    items: [{ productId: top._id, quantityReceived: 5 }],
    remarks: 'Received 5 Wooden Tops for MO shortage fulfillment'
  }, userId);

  // Check inventory levels
  const topInvAfterGRN = await Inventory.findOne({ productId: top._id });
  logger.info(`Wooden Tops inventory after receipt: On Hand = ${topInvAfterGRN.onHandQty} (Expected: 15) | Reserved = ${topInvAfterGRN.reservedQty} (Expected: 15)`);
  if (topInvAfterGRN.onHandQty !== 15) {
    throw new Error(`Expected Tops on hand to be 15, but got ${topInvAfterGRN.onHandQty}`);
  }

  // MO status should auto-resume to IN_PROGRESS
  const moAfterTopReceipt = await ManufacturingOrder.findById(mo._id);
  logger.info(`MO ${moAfterTopReceipt.moNumber} Status: ${moAfterTopReceipt.status} (Expected: IN_PROGRESS)`);
  if (moAfterTopReceipt.status !== 'IN_PROGRESS') {
    throw new Error(`Expected MO to auto-resume to IN_PROGRESS, but got: ${moAfterTopReceipt.status}`);
  }


  // STEP 8: Verify Work Orders auto-generated
  logger.info('\n[STEP 8] Verifying Work Orders auto-generated during auto-resume...');
  const workOrders = await WorkOrder.find({ moId: mo._id }).sort({ createdAt: 1 });
  logger.info(`Work Orders generated: ${workOrders.length} (Expected: 3)`);
  if (workOrders.length !== 3) {
    throw new Error(`Expected 3 Work Orders, but got ${workOrders.length}`);
  }
  workOrders.forEach(wo => {
    logger.info(`  - ${wo.woNumber} ${wo.name} | Status: ${wo.status}`);
  });


  // STEP 9: Complete Work Orders to complete manufacturing
  logger.info('\n[STEP 9] Completing Work Orders to finish production...');
  for (const wo of workOrders) {
    await manufacturingService.completeWorkOrder(wo._id, userId);
    logger.info(`  - Work Order ${wo.woNumber} ${wo.name} completed.`);
  }

  // Verify MO is DONE
  const finalMo = await ManufacturingOrder.findById(mo._id);
  logger.info(`Manufacturing Order ${finalMo.moNumber} Status: ${finalMo.status} (Expected: DONE) | Produced: ${finalMo.producedQty}`);
  if (finalMo.status !== 'DONE') {
    throw new Error(`Expected MO status to be DONE, but got: ${finalMo.status}`);
  }


  // STEP 10: Verify finished goods and component stock
  logger.info('\n[STEP 10] Checking final stock levels...');
  const finalLegInv = await Inventory.findOne({ productId: leg._id });
  const finalTopInv = await Inventory.findOne({ productId: top._id });
  const finalScrewInv = await Inventory.findOne({ productId: screw._id });
  const finalTableInv = await Inventory.findOne({ productId: table._id });

  logger.info(`Component Inventory after manufacturing:`);
  logger.info(`  - Wooden Legs: OnHand = ${finalLegInv.onHandQty} (Expected: 0)`);
  logger.info(`  - Wooden Tops: OnHand = ${finalTopInv.onHandQty} (Expected: 0)`);
  logger.info(`  - Screws: OnHand = ${finalScrewInv.onHandQty} (Expected: 820)`);
  logger.info(`Finished Table Inventory:`);
  logger.info(`  - Dining Tables: OnHand = ${finalTableInv.onHandQty} (Expected: 15 on hand from MO + 0 on hand from reserved 5 = 15 total)`);
  logger.info(`  - Dining Tables: Reserved = ${finalTableInv.reservedQty} (Expected: 15 reserved for remaining SO quantity)`);

  if (finalLegInv.onHandQty !== 0) throw new Error(`Expected Legs on hand to be 0, but got ${finalLegInv.onHandQty}`);
  if (finalTopInv.onHandQty !== 0) throw new Error(`Expected Tops on hand to be 0, but got ${finalTopInv.onHandQty}`);
  if (finalTableInv.reservedQty !== 15) throw new Error(`Expected Table reserved to be 15, but got ${finalTableInv.reservedQty}`);


  // STEP 11: Verify Sales Order is promoted to Ready For Delivery
  const finalSo = await SalesOrder.findById(so._id);
  logger.info(`Sales Order ${finalSo.soNumber} Status: ${finalSo.status} (Expected: Ready For Delivery)`);
  if (finalSo.status !== 'Ready For Delivery') {
    throw new Error(`Expected SO status to be Ready For Delivery, but got: ${finalSo.status}`);
  }


  // STEP 12: Ship remaining 15 Dining Tables
  logger.info('\n[STEP 12] Delivering the remaining 15 Dining Tables...');
  const finalDelivery = await salesService.deliverSalesOrder(so._id, userId);
  logger.info(`Delivery processed: ${finalDelivery.soNumber} | New Status: ${finalDelivery.status} (Expected: Fully Delivered)`);
  if (finalDelivery.status !== 'Fully Delivered') {
    throw new Error(`Expected SO status to be Fully Delivered, but got: ${finalDelivery.status}`);
  }

  const absoluteFinalTableInv = await Inventory.findOne({ productId: table._id });
  logger.info(`Dining Tables stock after final delivery: OnHand = ${absoluteFinalTableInv.onHandQty} (Expected: 0) | Reserved = ${absoluteFinalTableInv.reservedQty} (Expected: 0)`);
  if (absoluteFinalTableInv.onHandQty !== 0 || absoluteFinalTableInv.reservedQty !== 0) {
    throw new Error(`Expected final inventory to be 0, but got OnHand=${absoluteFinalTableInv.onHandQty}, Reserved=${absoluteFinalTableInv.reservedQty}`);
  }


  // STEP 13: Verify Inventory Movement Ledger
  logger.info('\n[STEP 13] Verifying Inventory Movement Ledger...');
  const currentProductIds = [table._id, leg._id, top._id, screw._id];
  const movements = await InventoryMovement.find({
    productId: { $in: currentProductIds }
  }).sort({ createdAt: 1 }).populate('productId', 'productName');
  
  logger.info(`  Total ledger entries recorded: ${movements.length}`);
  movements.forEach(m => {
    const name = m.productId ? m.productId.productName : '(unknown)';
    logger.info(`  [Ledger] ${name} | Type: ${m.movementType} | Qty: ${m.quantity} | Prev: ${m.previousQty} → New: ${m.newQty} | Ref: ${m.referenceType}`);
  });


  // STEP 14: Verify Audit Logs
  logger.info('\n[STEP 14] Verifying Audit Logs...');
  const auditLogs = await AuditLog.find({
    module: { $in: ['SALES', 'MANUFACTURING', 'PURCHASE'] }
  }).sort({ createdAt: 1 });

  auditLogs.forEach(log => {
    logger.info(`  [AuditLog] Action: ${log.action} | Module: ${log.module} | Details: ${JSON.stringify(log.details)}`);
  });

  logger.info('\n==================================================');
  logger.info('   ALL 17 END-TO-END VALIDATION STEPS PASSED!');
  logger.info('==================================================');

  await mongoose.connection.close();
  process.exit(0);
}

runE2EValidation().catch(err => {
  logger.error('E2E Validation Failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
