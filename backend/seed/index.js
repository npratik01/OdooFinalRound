'use strict';

/**
 * ============================================================
 * MASTER ERP SEED SCRIPT
 * ============================================================
 * Populates ALL ERP modules with realistic demo data.
 * Idempotent — safe to run multiple times (no duplicates).
 *
 * Run:  node seed/index.js
 *  or:  npm run seed
 * ============================================================
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ────────────────────────────────────────────────────────────────────
const User               = require('../src/models/User.model');
const Product            = require('../src/models/Product.model');
const Inventory          = require('../src/models/Inventory.model');
const Customer           = require('../src/models/Customer.model');
const Vendor             = require('../src/models/Vendor.model');
const SalesOrder         = require('../src/models/SalesOrder.model');
const Delivery           = require('../src/models/Delivery.model');
const { PurchaseOrder }  = require('../src/models/PurchaseOrder.model');
const GoodsReceipt       = require('../src/models/GoodsReceipt.model');
const WorkCenter         = require('../src/models/WorkCenter.model');
const BillOfMaterials    = require('../src/models/BillOfMaterials.model');
const { ManufacturingOrder } = require('../src/models/ManufacturingOrder.model');
const WorkOrder          = require('../src/models/WorkOrder.model');
const AuditLog           = require('../src/models/AuditLog.model');
const InventoryMovement  = require('../src/models/InventoryMovement.model');

// ── Seed data ─────────────────────────────────────────────────────────────────
const { USERS_DATA }              = require('./data/users.data');
const { CUSTOMERS_DATA, VENDORS_DATA } = require('./data/customers_vendors.data');
const { PRODUCTS_DATA, BOMS_DATA, WORK_CENTERS_DATA } = require('./data/products.data');

const SALT_ROUNDS = 12;

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const log  = (msg) => console.log(msg);
const info = (msg) => console.log(`  ✅ ${msg}`);
const skip = (msg) => console.log(`  ⏭️  ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const section = (title) => {
  console.log('\n' + '─'.repeat(60));
  console.log(`  📦 ${title}`);
  console.log('─'.repeat(60));
};

/** Upsert by unique field. Returns the doc (existing or new). */
async function upsert(Model, query, data) {
  const existing = await Model.findOne(query);
  if (existing) return existing;
  return Model.create(data);
}

/** Raw insert bypassing hooks (for password pre-hashed data) */
async function upsertRaw(Model, query, data) {
  const existing = await Model.findOne(query);
  if (existing) return existing;
  const result = await Model.collection.insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { ...data, _id: result.insertedId };
}

function daysAgo(n)   { return new Date(Date.now() - n * 86400000); }
function daysAhead(n) { return new Date(Date.now() + n * 86400000); }

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1 — USERS
// ═════════════════════════════════════════════════════════════════════════════

async function seedUsers() {
  section('USERS & RBAC');
  const results = [];

  for (const u of USERS_DATA) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      skip(`User already exists: ${u.email} [${u.role}]`);
      results.push(existing);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
    const doc = await User.collection.insertOne({
      name: u.name,
      email: u.email,
      password: hashed,
      role: u.role,
      isActive: u.isActive,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    results.push({ ...u, _id: doc.insertedId });
    info(`Created user: ${u.email} [${u.role}]`);
  }

  log(`\n  Total users seeded/found: ${results.length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2 — CUSTOMERS
// ═════════════════════════════════════════════════════════════════════════════

async function seedCustomers() {
  section('CUSTOMERS (10)');
  const results = [];
  for (const c of CUSTOMERS_DATA) {
    const existing = await Customer.findOne({ customerCode: c.customerCode });
    if (existing) {
      skip(`Customer exists: ${c.customerName}`);
      results.push(existing);
      continue;
    }
    const doc = await Customer.create(c);
    results.push(doc);
    info(`Created customer: ${c.customerName} [${c.customerCode}]`);
  }
  log(`\n  Total customers: ${results.length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 3 — VENDORS
// ═════════════════════════════════════════════════════════════════════════════

async function seedVendors() {
  section('VENDORS (10)');
  const results = [];
  for (const v of VENDORS_DATA) {
    const { suppliedProducts, ...vendorData } = v;
    const existing = await Vendor.findOne({ vendorCode: vendorData.vendorCode });
    if (existing) {
      skip(`Vendor exists: ${vendorData.vendorName}`);
      results.push({ ...existing.toObject(), suppliedProducts });
      continue;
    }
    const doc = await Vendor.create(vendorData);
    results.push({ ...doc.toObject(), suppliedProducts });
    info(`Created vendor: ${vendorData.vendorName} [${vendorData.vendorCode}]`);
  }
  log(`\n  Total vendors: ${results.length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 4 — WORK CENTERS
// ═════════════════════════════════════════════════════════════════════════════

async function seedWorkCenters(adminUserId) {
  section('WORK CENTERS');
  const results = {};
  for (const wc of WORK_CENTERS_DATA) {
    const existing = await WorkCenter.findOne({ code: wc.code });
    if (existing) {
      skip(`Work Center exists: ${wc.name}`);
      results[wc.name] = existing;
      continue;
    }
    const doc = await WorkCenter.create({ ...wc, createdBy: adminUserId });
    results[wc.name] = doc;
    info(`Created work center: ${wc.name} [${wc.code}]`);
  }
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 5 — PRODUCTS + INVENTORY
// ═════════════════════════════════════════════════════════════════════════════

async function seedProducts(adminUserId) {
  section('PRODUCTS (11) + INVENTORY');
  const results = {};

  for (const p of PRODUCTS_DATA) {
    const { _inventory, ...productData } = p;
    const existing = await Product.findOne({ sku: productData.sku });

    if (existing) {
      skip(`Product exists: ${productData.productName} [${productData.sku}]`);
      results[productData.productName] = existing;
      continue;
    }

    const doc = await Product.create({ ...productData, createdBy: adminUserId });
    results[productData.productName] = doc;
    info(`Created product: ${productData.productName} [${productData.sku}] — ${productData.productType}`);

    // Seed inventory record
    const invExisting = await Inventory.findOne({ productId: doc._id });
    if (!invExisting) {
      const stockStatus = _inventory.onHandQty <= _inventory.minimumStockLevel
        ? 'LOW_STOCK' : 'NORMAL';
      await Inventory.create({
        productId: doc._id,
        onHandQty: _inventory.onHandQty,
        reservedQty: _inventory.reservedQty,
        minimumStockLevel: _inventory.minimumStockLevel,
        stockStatus,
      });
      info(`  Inventory: OnHand=${_inventory.onHandQty} Reserved=${_inventory.reservedQty} Free=${_inventory.onHandQty - _inventory.reservedQty}`);
    }

    // Audit log: Product Created
    await AuditLog.create({
      userId: adminUserId,
      action: 'PRODUCT_CREATED',
      module: 'PRODUCTS',
      details: { sku: productData.sku, productName: productData.productName, productType: productData.productType },
    });
  }

  log(`\n  Total products: ${Object.keys(results).length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 6 — BILL OF MATERIALS
// ═════════════════════════════════════════════════════════════════════════════

async function seedBoMs(products, adminUserId) {
  section('BILL OF MATERIALS');
  const results = {};

  for (const bom of BOMS_DATA) {
    const existing = await BillOfMaterials.findOne({ bomCode: bom.bomCode });
    if (existing) {
      skip(`BoM exists: ${bom.bomCode} → ${bom.productName}`);
      results[bom.productName] = existing;
      continue;
    }

    const finishedProduct = products[bom.productName];
    if (!finishedProduct) {
      warn(`Product not found for BoM: ${bom.productName}`);
      continue;
    }

    const components = bom.components.map((c) => {
      const compProduct = products[c.productName];
      if (!compProduct) throw new Error(`Component not found: ${c.productName}`);
      return { productId: compProduct._id, quantity: c.quantity, uom: c.uom };
    });

    const doc = await BillOfMaterials.create({
      bomCode: bom.bomCode,
      productId: finishedProduct._id,
      quantity: bom.quantity,
      version: bom.version,
      description: bom.description,
      isActive: bom.isActive,
      components,
      createdBy: adminUserId,
    });
    results[bom.productName] = doc;
    info(`Created BoM: ${bom.bomCode} → ${bom.productName} (${components.length} components)`);
  }

  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 7 — SALES ORDERS (SO-001, SO-002 + more statuses)
// ═════════════════════════════════════════════════════════════════════════════

async function seedSalesOrders(users, customers, products) {
  section('SALES ORDERS');

  const adminUser = users.find(u => u.role === 'ADMIN');
  const salesUser = users.find(u => u.role === 'SALES_USER');
  const userId    = adminUser._id;

  const diningTable = products['Dining Table'];
  const officeChair = products['Office Chair'];
  const woodenTable = products['Wooden Table'];

  const customerABC = customers.find(c => c.customerName === 'ABC Interiors');
  const customerXYZ = customers.find(c => c.customerName === 'XYZ Furniture');
  const customerHS  = customers.find(c => c.customerName === 'HomeStyle Furnishings');
  const customerML  = customers.find(c => c.customerName === 'Modern Living Pvt Ltd');

  const salesOrders = [
    // ── SO-001: ABC Interiors → Dining Table × 20 (MTO scenario) ────────────
    {
      soNumber: 'SO-2026-001',
      customerId: customerABC._id,
      orderDate: daysAgo(5),
      items: [{ productId: diningTable._id, quantity: 20, unitPrice: diningTable.salesPrice, totalPrice: 20 * diningTable.salesPrice }],
      totalAmount: 20 * diningTable.salesPrice,
      status: 'Confirmed',
      remarks: 'MTO order: 5 from stock, 15 to be manufactured. Priority delivery.',
      createdBy: userId,
    },
    // ── SO-002: XYZ Furniture → Office Chair × 10 (MTS scenario) ────────────
    {
      soNumber: 'SO-2026-002',
      customerId: customerXYZ._id,
      orderDate: daysAgo(3),
      items: [{ productId: officeChair._id, quantity: 10, unitPrice: officeChair.salesPrice, totalPrice: 10 * officeChair.salesPrice }],
      totalAmount: 10 * officeChair.salesPrice,
      status: 'Ready For Delivery',
      remarks: 'MTS order: Stock sufficient. Ready for dispatch.',
      createdBy: userId,
    },
    // ── SO-003: Draft ─────────────────────────────────────────────────────────
    {
      soNumber: 'SO-2026-003',
      customerId: customerHS._id,
      orderDate: daysAgo(1),
      items: [{ productId: woodenTable._id, quantity: 5, unitPrice: woodenTable.salesPrice, totalPrice: 5 * woodenTable.salesPrice }],
      totalAmount: 5 * woodenTable.salesPrice,
      status: 'Draft',
      remarks: 'Pending customer payment confirmation.',
      createdBy: userId,
    },
    // ── SO-004: Partially Delivered ───────────────────────────────────────────
    {
      soNumber: 'SO-2026-004',
      customerId: customerML._id,
      orderDate: daysAgo(10),
      items: [{ productId: diningTable._id, quantity: 10, unitPrice: diningTable.salesPrice, totalPrice: 10 * diningTable.salesPrice }],
      totalAmount: 10 * diningTable.salesPrice,
      status: 'Partially Delivered',
      remarks: '5 of 10 Dining Tables delivered. Remaining in production.',
      createdBy: userId,
    },
    // ── SO-005: Fully Delivered ───────────────────────────────────────────────
    {
      soNumber: 'SO-2026-005',
      customerId: customerABC._id,
      orderDate: daysAgo(15),
      items: [{ productId: officeChair._id, quantity: 25, unitPrice: officeChair.salesPrice, totalPrice: 25 * officeChair.salesPrice }],
      totalAmount: 25 * officeChair.salesPrice,
      status: 'Fully Delivered',
      remarks: 'Completed and invoiced.',
      createdBy: userId,
    },
    // ── SO-006: Cancelled ─────────────────────────────────────────────────────
    {
      soNumber: 'SO-2026-006',
      customerId: customerXYZ._id,
      orderDate: daysAgo(20),
      items: [{ productId: woodenTable._id, quantity: 8, unitPrice: woodenTable.salesPrice, totalPrice: 8 * woodenTable.salesPrice }],
      totalAmount: 8 * woodenTable.salesPrice,
      status: 'Cancelled',
      remarks: 'Cancelled by customer.',
      createdBy: userId,
    },
  ];

  const results = {};
  for (const so of salesOrders) {
    const existing = await SalesOrder.findOne({ soNumber: so.soNumber });
    if (existing) {
      skip(`SO exists: ${so.soNumber}`);
      results[so.soNumber] = existing;
      continue;
    }
    const doc = await SalesOrder.create(so);
    results[so.soNumber] = doc;
    info(`Created SO: ${so.soNumber} [${so.status}] — Customer: ${customers.find(c => String(c._id) === String(so.customerId))?.customerName}`);

    await AuditLog.create({
      userId,
      action: 'SALES_ORDER_CREATED',
      module: 'SALES',
      details: { soNumber: so.soNumber, status: so.status, totalAmount: so.totalAmount },
    });
  }

  // Seed reservation movement for SO-2026-001 (5 Dining Tables reserved from stock)
  const so001 = results['SO-2026-001'];
  if (so001) {
    const existingMov = await InventoryMovement.findOne({ referenceId: so001._id, movementType: 'SALES_RESERVATION' });
    if (!existingMov) {
      await InventoryMovement.create({
        productId: diningTable._id,
        quantity: 5,
        movementType: 'SALES_RESERVATION',
        referenceType: 'SalesOrder',
        referenceId: so001._id,
        remarks: 'Reserved 5 Dining Tables from stock for SO-2026-001',
        previousQty: 5,
        newQty: 0,
        createdBy: userId,
      });
      // Update inventory reserve
      await Inventory.findOneAndUpdate(
        { productId: diningTable._id },
        { $inc: { reservedQty: 5 } }
      );
      info('Inventory reservation movement logged for SO-2026-001');
    }
  }

  // Delivery for Fully Delivered SO-005
  const so005 = results['SO-2026-005'];
  if (so005) {
    const existingDlv = await Delivery.findOne({ soId: so005._id });
    if (!existingDlv) {
      const dlv = await Delivery.create({
        deliveryNumber: 'DLV-2026-001',
        soId: so005._id,
        deliveryDate: daysAgo(5),
        items: [{ productId: officeChair._id, quantityShipped: 25 }],
        shippedBy: userId,
      });
      // Deduct inventory
      await Inventory.findOneAndUpdate({ productId: officeChair._id }, { $inc: { onHandQty: -25 } });
      await InventoryMovement.create({
        productId: officeChair._id,
        quantity: 25,
        movementType: 'SALES_DELIVERY',
        referenceType: 'Delivery',
        referenceId: dlv._id,
        remarks: 'Delivered 25 Office Chairs — SO-2026-005 complete',
        previousQty: 75,
        newQty: 50,
        createdBy: userId,
      });
      await AuditLog.create({
        userId,
        action: 'DELIVERY_COMPLETED',
        module: 'SALES',
        details: { deliveryNumber: 'DLV-2026-001', soNumber: 'SO-2026-005', qty: 25 },
      });
      info('Created delivery DLV-2026-001 for SO-2026-005');
    }
  }

  // Partial delivery for SO-004
  const so004 = results['SO-2026-004'];
  if (so004) {
    const existingDlv = await Delivery.findOne({ soId: so004._id });
    if (!existingDlv) {
      const dlv2 = await Delivery.create({
        deliveryNumber: 'DLV-2026-002',
        soId: so004._id,
        deliveryDate: daysAgo(3),
        items: [{ productId: diningTable._id, quantityShipped: 5 }],
        shippedBy: userId,
      });
      await AuditLog.create({
        userId,
        action: 'PARTIAL_DELIVERY_COMPLETED',
        module: 'SALES',
        details: { deliveryNumber: 'DLV-2026-002', soNumber: 'SO-2026-004', qtyShipped: 5, qtyOrdered: 10 },
      });
      info('Created partial delivery DLV-2026-002 for SO-2026-004');
    }
  }

  log(`\n  Total sales orders: ${Object.keys(results).length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 8 — PURCHASE ORDERS (4 statuses)
// ═════════════════════════════════════════════════════════════════════════════

async function seedPurchaseOrders(users, vendors, products) {
  section('PURCHASE ORDERS (Draft / Confirmed / Partially Received / Fully Received)');

  const purchaseUser = users.find(u => u.role === 'PURCHASE_USER') || users[0];
  const userId = purchaseUser._id;

  const vendorWoodMart  = vendors.find(v => v.vendorName === 'WoodMart Suppliers');
  const vendorFasteners = vendors.find(v => v.vendorName === 'Fasteners Pvt Ltd');
  const vendorSteelCraft = vendors.find(v => v.vendorName === 'SteelCraft Vendors');
  const vendorFoamTech  = vendors.find(v => v.vendorName === 'FoamTech Industries');

  const woodenLegs  = products['Wooden Legs'];
  const woodenTop   = products['Wooden Top'];
  const screws      = products['Screws'];
  const chairBase   = products['Chair Base'];
  const chairCushion = products['Chair Cushion'];

  const pos = [
    // ── PO-001: DRAFT ────────────────────────────────────────────────────────
    {
      poNumber: 'PO-2026-0001',
      vendorId: vendorWoodMart._id,
      orderDate: daysAgo(2),
      expectedDeliveryDate: daysAhead(5),
      items: [
        { productId: woodenLegs._id, quantity: 100, unitCost: woodenLegs.costPrice, totalCost: 100 * woodenLegs.costPrice, receivedQty: 0 },
        { productId: woodenTop._id, quantity: 50, unitCost: woodenTop.costPrice, totalCost: 50 * woodenTop.costPrice, receivedQty: 0 },
      ],
      totalAmount: 100 * woodenLegs.costPrice + 50 * woodenTop.costPrice,
      status: 'Draft',
      remarks: 'Procurement for upcoming manufacturing batch.',
      createdBy: userId,
    },
    // ── PO-002: CONFIRMED ────────────────────────────────────────────────────
    {
      poNumber: 'PO-2026-0002',
      vendorId: vendorFasteners._id,
      orderDate: daysAgo(4),
      expectedDeliveryDate: daysAhead(2),
      items: [
        { productId: screws._id, quantity: 5000, unitCost: screws.costPrice, totalCost: 5000 * screws.costPrice, receivedQty: 0 },
      ],
      totalAmount: 5000 * screws.costPrice,
      status: 'Confirmed',
      remarks: 'Screws for dining table assembly. Confirmed with vendor.',
      createdBy: userId,
    },
    // ── PO-003: PARTIALLY RECEIVED ────────────────────────────────────────────
    {
      poNumber: 'PO-2026-0003',
      vendorId: vendorSteelCraft._id,
      orderDate: daysAgo(8),
      expectedDeliveryDate: daysAgo(1),
      items: [
        { productId: chairBase._id, quantity: 200, unitCost: chairBase.costPrice, totalCost: 200 * chairBase.costPrice, receivedQty: 100 },
      ],
      totalAmount: 200 * chairBase.costPrice,
      status: 'Partially Received',
      remarks: 'First batch of 100 chair bases received. Remaining 100 pending.',
      createdBy: userId,
    },
    // ── PO-004: FULLY RECEIVED ────────────────────────────────────────────────
    {
      poNumber: 'PO-2026-0004',
      vendorId: vendorFoamTech._id,
      orderDate: daysAgo(12),
      expectedDeliveryDate: daysAgo(5),
      items: [
        { productId: chairCushion._id, quantity: 150, unitCost: chairCushion.costPrice, totalCost: 150 * chairCushion.costPrice, receivedQty: 150 },
      ],
      totalAmount: 150 * chairCushion.costPrice,
      status: 'Fully Received',
      remarks: 'All 150 chair cushions received and quality checked.',
      createdBy: userId,
    },
    // ── PO-005: Another CONFIRMED (for wooden legs shortfall scenario) ─────────
    {
      poNumber: 'PO-2026-0005',
      vendorId: vendorWoodMart._id,
      orderDate: daysAgo(1),
      expectedDeliveryDate: daysAhead(7),
      items: [
        { productId: woodenLegs._id, quantity: 200, unitCost: woodenLegs.costPrice, totalCost: 200 * woodenLegs.costPrice, receivedQty: 0 },
      ],
      totalAmount: 200 * woodenLegs.costPrice,
      status: 'Confirmed',
      remarks: 'Auto-generated by procurement engine for Dining Table MO shortfall.',
      createdBy: userId,
    },
  ];

  const results = {};
  for (const po of pos) {
    const existing = await PurchaseOrder.findOne({ poNumber: po.poNumber });
    if (existing) {
      skip(`PO exists: ${po.poNumber}`);
      results[po.poNumber] = existing;
      continue;
    }
    const doc = await PurchaseOrder.create(po);
    results[po.poNumber] = doc;
    info(`Created PO: ${po.poNumber} [${po.status}]`);
    await AuditLog.create({
      userId,
      action: 'PURCHASE_ORDER_CREATED',
      module: 'PURCHASE',
      details: { poNumber: po.poNumber, status: po.status, totalAmount: po.totalAmount },
    });
  }

  // Goods Receipts for Fully Received PO
  const po004 = results['PO-2026-0004'];
  if (po004) {
    const existingGR = await GoodsReceipt.findOne({ poId: po004._id });
    if (!existingGR) {
      const gr = await GoodsReceipt.create({
        grNumber: 'GR-2026-0001',
        poId: po004._id,
        receiptDate: daysAgo(5),
        items: [{ productId: chairCushion._id, quantityReceived: 150, remarks: 'All accepted, no defects' }],
        receivedBy: userId,
        remarks: 'Full receipt of chair cushions.',
      });
      // Inventory already seeded at 100, this receipt adds 150 more (adjusted to reflect historical receipt)
      await InventoryMovement.create({
        productId: chairCushion._id,
        quantity: 150,
        movementType: 'PURCHASE_RECEIPT',
        referenceType: 'GoodsReceipt',
        referenceId: gr._id,
        remarks: 'Received 150 Chair Cushions via GR-2026-0001',
        previousQty: 0,
        newQty: 150,
        createdBy: userId,
      });
      await AuditLog.create({
        userId,
        action: 'GOODS_RECEIPT_CREATED',
        module: 'PURCHASE',
        details: { grNumber: 'GR-2026-0001', poNumber: 'PO-2026-0004' },
      });
      info('Created Goods Receipt: GR-2026-0001 for PO-2026-0004');
    }
  }

  // Goods Receipt for Partially Received PO
  const po003 = results['PO-2026-0003'];
  if (po003) {
    const existingGR2 = await GoodsReceipt.findOne({ poId: po003._id });
    if (!existingGR2) {
      const gr2 = await GoodsReceipt.create({
        grNumber: 'GR-2026-0002',
        poId: po003._id,
        receiptDate: daysAgo(2),
        items: [{ productId: chairBase._id, quantityReceived: 100, remarks: 'First batch — 100 units accepted' }],
        receivedBy: userId,
        remarks: 'Partial receipt — 100 of 200 chair bases.',
      });
      await InventoryMovement.create({
        productId: chairBase._id,
        quantity: 100,
        movementType: 'PURCHASE_RECEIPT',
        referenceType: 'GoodsReceipt',
        referenceId: gr2._id,
        remarks: 'Received 100 Chair Bases via GR-2026-0002 (partial)',
        previousQty: 0,
        newQty: 100,
        createdBy: userId,
      });
      await AuditLog.create({
        userId,
        action: 'GOODS_RECEIPT_CREATED',
        module: 'PURCHASE',
        details: { grNumber: 'GR-2026-0002', poNumber: 'PO-2026-0003', partial: true },
      });
      info('Created Partial Goods Receipt: GR-2026-0002 for PO-2026-0003');
    }
  }

  log(`\n  Total POs: ${Object.keys(results).length}`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 9 — MANUFACTURING ORDERS + WORK ORDERS
// ═════════════════════════════════════════════════════════════════════════════

async function seedManufacturingOrders(users, products, boms, workCenters) {
  section('MANUFACTURING ORDERS + WORK ORDERS');

  const mfgUser = users.find(u => u.role === 'MANUFACTURING_USER') || users[0];
  const userId  = mfgUser._id;

  const diningTable = products['Dining Table'];
  const woodenTable = products['Wooden Table'];
  const officeChair = products['Office Chair'];
  const woodenLegs  = products['Wooden Legs'];
  const woodenTop   = products['Wooden Top'];
  const chairBase   = products['Chair Base'];
  const chairCushion = products['Chair Cushion'];
  const screws      = products['Screws'];

  const bomDining = boms['Dining Table'];
  const bomWooden = boms['Wooden Table'];
  const bomChair  = boms['Office Chair'];

  const wcAssembly  = workCenters['Assembly Line'];
  const wcPaint     = workCenters['Paint Floor'];
  const wcPackaging = workCenters['Packaging Unit'];

  const mos = [
    // ── MO-001: DONE (Dining Table batch completed) ──────────────────────────
    {
      moNumber: 'MO-2026-0001',
      bomId: bomDining._id,
      productId: diningTable._id,
      workCenterId: wcAssembly._id,
      plannedQty: 10,
      producedQty: 10,
      status: 'DONE',
      scheduledDate: daysAgo(10),
      completedDate: daysAgo(7),
      remarks: 'Batch of 10 Dining Tables completed without defects.',
      createdBy: userId,
      components: [
        { productId: woodenLegs._id, requiredQty: 40, consumedQty: 40, reservedQty: 0 },
        { productId: woodenTop._id, requiredQty: 10, consumedQty: 10, reservedQty: 0 },
        { productId: screws._id, requiredQty: 120, consumedQty: 120, reservedQty: 0 },
      ],
    },
    // ── MO-002: IN_PROGRESS (for MTO scenario, 15 Dining Tables for SO-001) ──
    {
      moNumber: 'MO-2026-0002',
      bomId: bomDining._id,
      productId: diningTable._id,
      workCenterId: wcAssembly._id,
      plannedQty: 15,
      producedQty: 0,
      status: 'IN_PROGRESS',
      scheduledDate: daysAgo(2),
      completedDate: null,
      remarks: 'MTO-triggered MO for SO-2026-001. Components reserved.',
      createdBy: userId,
      components: [
        { productId: woodenLegs._id, requiredQty: 60, consumedQty: 0, reservedQty: 20 },
        { productId: woodenTop._id, requiredQty: 15, consumedQty: 0, reservedQty: 10 },
        { productId: screws._id, requiredQty: 180, consumedQty: 0, reservedQty: 180 },
      ],
    },
    // ── MO-003: WAITING_FOR_COMPONENTS (Office Chair — components shortage) ──
    {
      moNumber: 'MO-2026-0003',
      bomId: bomChair._id,
      productId: officeChair._id,
      workCenterId: wcAssembly._id,
      plannedQty: 30,
      producedQty: 0,
      status: 'WAITING_FOR_COMPONENTS',
      scheduledDate: daysAhead(3),
      completedDate: null,
      remarks: 'Waiting for Chair Base delivery (PO-2026-0003 partially received).',
      createdBy: userId,
      components: [
        { productId: chairBase._id, requiredQty: 30, consumedQty: 0, reservedQty: 0 },
        { productId: chairCushion._id, requiredQty: 30, consumedQty: 0, reservedQty: 0 },
        { productId: screws._id, requiredQty: 240, consumedQty: 0, reservedQty: 0 },
      ],
    },
    // ── MO-004: DRAFT (Wooden Table future batch) ─────────────────────────────
    {
      moNumber: 'MO-2026-0004',
      bomId: bomWooden._id,
      productId: woodenTable._id,
      workCenterId: wcAssembly._id,
      plannedQty: 20,
      producedQty: 0,
      status: 'DRAFT',
      scheduledDate: daysAhead(7),
      completedDate: null,
      remarks: 'Planned batch for next week replenishment of Wooden Table stock.',
      createdBy: userId,
      components: [
        { productId: woodenLegs._id, requiredQty: 80, consumedQty: 0, reservedQty: 0 },
        { productId: woodenTop._id, requiredQty: 20, consumedQty: 0, reservedQty: 0 },
        { productId: screws._id, requiredQty: 200, consumedQty: 0, reservedQty: 0 },
      ],
    },
  ];

  const moResults = {};
  for (const mo of mos) {
    const existing = await ManufacturingOrder.findOne({ moNumber: mo.moNumber });
    if (existing) {
      skip(`MO exists: ${mo.moNumber}`);
      moResults[mo.moNumber] = existing;
      continue;
    }
    const doc = await ManufacturingOrder.create(mo);
    moResults[mo.moNumber] = doc;
    info(`Created MO: ${mo.moNumber} [${mo.status}] — ${mo.plannedQty} × ${products[Object.keys(products).find(k => String(products[k]._id) === String(mo.productId))] ? Object.keys(products).find(k => String(products[k]._id) === String(mo.productId)) : 'Product'}`);
    await AuditLog.create({
      userId,
      action: 'MANUFACTURING_ORDER_CREATED',
      module: 'MANUFACTURING',
      details: { moNumber: mo.moNumber, status: mo.status, plannedQty: mo.plannedQty },
    });
  }

  // Reserve inventory for IN_PROGRESS MO-002
  const mo002 = moResults['MO-2026-0002'];
  if (mo002) {
    const existingMov = await InventoryMovement.findOne({ referenceId: mo002._id, movementType: 'MFG_COMPONENT_CONSUME' });
    if (!existingMov) {
      await Inventory.findOneAndUpdate({ productId: woodenLegs._id }, { $inc: { reservedQty: 20 } });
      await Inventory.findOneAndUpdate({ productId: woodenTop._id }, { $inc: { reservedQty: 10 } });
      await Inventory.findOneAndUpdate({ productId: screws._id }, { $inc: { reservedQty: 180 } });

      for (const [prod, qty] of [[woodenLegs, 20], [woodenTop, 10], [screws, 180]]) {
        await InventoryMovement.create({
          productId: prod._id,
          quantity: qty,
          movementType: 'MFG_COMPONENT_CONSUME',
          referenceType: 'ManufacturingOrder',
          referenceId: mo002._id,
          remarks: `Reserved for MO-2026-0002`,
          previousQty: 0,
          newQty: qty,
          createdBy: userId,
        });
      }
      info('Component inventory reserved for MO-2026-0002');
    }
  }

  // Work Orders for MO-002 (IN_PROGRESS)
  section('WORK ORDERS');
  const woData = [
    { woNumber: 'WO-2026-0001', moId: mo002?._id, name: 'Assembly', status: 'IN_PROGRESS', workCenterId: wcAssembly._id },
    { woNumber: 'WO-2026-0002', moId: mo002?._id, name: 'Painting',  status: 'PENDING',     workCenterId: wcPaint._id },
    { woNumber: 'WO-2026-0003', moId: mo002?._id, name: 'Packing',   status: 'PENDING',     workCenterId: wcPackaging._id },
  ];
  // Work Orders for MO-001 (all COMPLETED)
  const mo001 = moResults['MO-2026-0001'];
  if (mo001) {
    woData.push(
      { woNumber: 'WO-2026-0004', moId: mo001._id, name: 'Assembly', status: 'COMPLETED', workCenterId: wcAssembly._id,  completedAt: daysAgo(7) },
      { woNumber: 'WO-2026-0005', moId: mo001._id, name: 'Painting',  status: 'COMPLETED', workCenterId: wcPaint._id,    completedAt: daysAgo(8) },
      { woNumber: 'WO-2026-0006', moId: mo001._id, name: 'Packing',   status: 'COMPLETED', workCenterId: wcPackaging._id, completedAt: daysAgo(7) },
    );
  }

  for (const wo of woData) {
    if (!wo.moId) continue;
    const existing = await WorkOrder.findOne({ woNumber: wo.woNumber });
    if (existing) {
      skip(`WO exists: ${wo.woNumber}`);
      continue;
    }
    await WorkOrder.create({ ...wo, createdBy: userId, completedBy: wo.completedAt ? userId : null });
    info(`Created WO: ${wo.woNumber} [${wo.status}] — ${wo.name}`);
  }

  // Inventory consumption movements for DONE MO-001
  if (mo001) {
    const existingComp = await InventoryMovement.findOne({ referenceId: mo001._id, movementType: 'MFG_COMPONENT_CONSUME' });
    if (!existingComp) {
      for (const [prod, qty] of [[woodenLegs, 40], [woodenTop, 10], [screws, 120]]) {
        await InventoryMovement.create({
          productId: prod._id,
          quantity: qty,
          movementType: 'MFG_COMPONENT_CONSUME',
          referenceType: 'ManufacturingOrder',
          referenceId: mo001._id,
          remarks: `Consumed for MO-2026-0001 (completed)`,
          previousQty: qty,
          newQty: 0,
          createdBy: userId,
        });
      }
      // MFG production output — Dining Tables
      await InventoryMovement.create({
        productId: diningTable._id,
        quantity: 10,
        movementType: 'MFG_OUTPUT_PRODUCE',
        referenceType: 'ManufacturingOrder',
        referenceId: mo001._id,
        remarks: 'Produced 10 Dining Tables from MO-2026-0001',
        previousQty: 0,
        newQty: 10,
        createdBy: userId,
      });
      await AuditLog.create({
        userId,
        action: 'MANUFACTURING_COMPLETED',
        module: 'MANUFACTURING',
        details: { moNumber: 'MO-2026-0001', producedQty: 10, productName: 'Dining Table' },
      });
      info('Consumption & production movements seeded for MO-2026-0001 (DONE)');
    }
  }

  log(`\n  Total MOs: ${Object.keys(moResults).length}`);
  return moResults;
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 10 — ADDITIONAL AUDIT LOGS (covering all required audit events)
// ═════════════════════════════════════════════════════════════════════════════

async function seedAuditLogs(users, products) {
  section('AUDIT LOGS (supplemental)');
  const adminUser = users.find(u => u.role === 'ADMIN');
  const userId = adminUser._id;

  const audits = [
    { action: 'PRODUCT_UPDATED',           module: 'PRODUCTS',       details: { productName: 'Dining Table', field: 'salesPrice', oldValue: 14000, newValue: 15000 } },
    { action: 'SALES_ORDER_CONFIRMED',     module: 'SALES',          details: { soNumber: 'SO-2026-001', confirmedAt: daysAgo(4) } },
    { action: 'PURCHASE_ORDER_CONFIRMED',  module: 'PURCHASE',       details: { poNumber: 'PO-2026-0002', vendorName: 'Fasteners Pvt Ltd' } },
    { action: 'GOODS_RECEIPT_CREATED',     module: 'PURCHASE',       details: { grNumber: 'GR-2026-0001', qtyReceived: 150 } },
    { action: 'INVENTORY_ADJUSTMENT',      module: 'INVENTORY',      details: { productName: 'Screws', adjustment: +200, reason: 'Physical count correction' } },
    { action: 'WORK_ORDER_COMPLETED',      module: 'MANUFACTURING',  details: { woNumber: 'WO-2026-0004', moNumber: 'MO-2026-0001' } },
    { action: 'DELIVERY_DISPATCHED',       module: 'SALES',          details: { deliveryNumber: 'DLV-2026-001', soNumber: 'SO-2026-005' } },
    { action: 'USER_LOGIN',                module: 'AUTH',            details: { email: 'admin@erp.com', ip: '192.168.1.1' } },
    { action: 'USER_ROLE_UPDATED',         module: 'USERS',          details: { email: 'sales1@erp.com', oldRole: 'SALES_USER', newRole: 'SALES_USER' } },
    { action: 'PROCUREMENT_TRIGGERED',     module: 'PROCUREMENT',    details: { trigger: 'Sales Order SO-2026-001', shortfall: { 'Wooden Legs': 40, 'Wooden Top': 5 } } },
  ];

  let created = 0;
  for (const a of audits) {
    await AuditLog.create({ userId, ...a });
    created++;
  }
  info(`Created ${created} supplemental audit log entries`);
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 11 — INVENTORY MOVEMENT LEDGER (supplemental types)
// ═════════════════════════════════════════════════════════════════════════════

async function seedInventoryMovementLedger(users, products) {
  section('INVENTORY MOVEMENT LEDGER (supplemental)');
  const adminUser = users.find(u => u.role === 'ADMIN');
  const userId = adminUser._id;

  const screws    = products['Screws'];
  const nails     = products['Nails'];
  const woodSheets = products['Wood Sheets'];

  // Stock Adjustment movement
  const existingAdj = await InventoryMovement.findOne({ movementType: 'STOCK_ADJUSTMENT', productId: screws._id });
  if (!existingAdj) {
    await InventoryMovement.create({
      productId: screws._id,
      quantity: 200,
      movementType: 'STOCK_ADJUSTMENT',
      referenceType: 'Inventory',
      referenceId: screws._id,
      remarks: 'Physical count correction — added 200 Screws',
      previousQty: 800,
      newQty: 1000,
      createdBy: userId,
    });
    await Inventory.findOneAndUpdate({ productId: screws._id }, { $inc: { onHandQty: 200 } });
    info('Stock adjustment movement: +200 Screws');
  }

  // Receipt movement for Wood Sheets
  const existingReceipt = await InventoryMovement.findOne({ movementType: 'RECEIPT', productId: woodSheets._id });
  if (!existingReceipt) {
    await InventoryMovement.create({
      productId: woodSheets._id,
      quantity: 50,
      movementType: 'RECEIPT',
      referenceType: 'Inventory',
      referenceId: woodSheets._id,
      remarks: 'Initial opening stock receipt of Wood Sheets',
      previousQty: 150,
      newQty: 200,
      createdBy: userId,
    });
    info('Initial receipt movement: +50 Wood Sheets');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEED ORCHESTRATOR
// ═════════════════════════════════════════════════════════════════════════════

async function seed() {
  const startTime = Date.now();
  try {
    log('\n' + '═'.repeat(60));
    log('  🌱  ERP MASTER SEED SCRIPT');
    log('  📅  ' + new Date().toISOString());
    log('═'.repeat(60));

    log('\nConnecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    log(`✅ Connected: ${process.env.MONGO_URI}`);

    // ── Run all seed sections in dependency order ────────────────────────────
    const users       = await seedUsers();
    const adminUser   = users.find(u => u.role === 'ADMIN');
    const customers   = await seedCustomers();
    const vendors     = await seedVendors();
    const workCenters = await seedWorkCenters(adminUser._id);
    const products    = await seedProducts(adminUser._id);
    const boms        = await seedBoMs(products, adminUser._id);
    const salesOrders = await seedSalesOrders(users, customers, products);
    const purchaseOrders = await seedPurchaseOrders(users, vendors, products);
    const moResults   = await seedManufacturingOrders(users, products, boms, workCenters);
    await seedAuditLogs(users, products);
    await seedInventoryMovementLedger(users, products);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    log('\n' + '═'.repeat(60));
    log('  🎉  SEEDING COMPLETED SUCCESSFULLY!');
    log(`  ⏱️   Time: ${elapsed}s`);
    log('═'.repeat(60));

    log('\n📋 LOGIN CREDENTIALS:');
    log('  ┌─────────────────────────────────┬─────────────────┬────────────────────┐');
    log('  │ Email                           │ Password        │ Role               │');
    log('  ├─────────────────────────────────┼─────────────────┼────────────────────┤');
    log('  │ admin@erp.com                   │ Admin@1234      │ ADMIN              │');
    log('  │ owner1@erp.com                  │ Owner@1234      │ BUSINESS_OWNER     │');
    log('  │ sales1@erp.com                  │ Sales@1234      │ SALES_USER         │');
    log('  │ purchase1@erp.com               │ Purchase@1234   │ PURCHASE_USER      │');
    log('  │ mfg1@erp.com                    │ Mfg@1234        │ MANUFACTURING_USER │');
    log('  │ inv1@erp.com                    │ Inv@1234        │ INVENTORY_MANAGER  │');
    log('  └─────────────────────────────────┴─────────────────┴────────────────────┘');

    log('\n📊 DATA SUMMARY:');
    log(`  👥 Users:             ${users.length}`);
    log(`  🏢 Customers:         ${customers.length}`);
    log(`  🏭 Vendors:           ${vendors.length}`);
    log(`  📦 Products:          ${Object.keys(products).length}`);
    log(`  📋 BoMs:              ${Object.keys(boms).length}`);
    log(`  🔧 Work Centers:      ${Object.keys(workCenters).length}`);
    log(`  🛒 Sales Orders:      ${Object.keys(salesOrders).length}`);
    log(`  📥 Purchase Orders:   ${Object.keys(purchaseOrders).length}`);
    log(`  🏗️  Mfg Orders:        ${Object.keys(moResults).length}`);

  } catch (err) {
    console.error('\n❌ SEED FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log('\nMongoDB connection closed. Goodbye! 👋\n');
    process.exit(0);
  }
}

seed();
