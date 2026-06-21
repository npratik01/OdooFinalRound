'use strict';

/**
 * Product, BoM & WorkCenter Seed Data
 * 10 Products with full procurement metadata
 * BoMs for all finished goods
 */

// ──────────────────────────────────────────────────────────────────────────────
// PRODUCTS (10 total)
// ──────────────────────────────────────────────────────────────────────────────

const PRODUCTS_DATA = [
  // ── FINISHED GOODS ───────────────────────────────────────────────────────
  {
    productName: 'Dining Table',
    sku: 'FG-DTBL-001',
    description: 'Premium solid wood dining table, seats 6, natural finish',
    salesPrice: 15000,
    costPrice: 8500,
    productType: 'FINISHED_GOOD',
    procurementStrategy: 'MTO',
    procurementType: 'MANUFACTURING',
    vendor: '',
    isActive: true,
    // Inventory seeding
    _inventory: { onHandQty: 5, reservedQty: 0, minimumStockLevel: 2 },
  },
  {
    productName: 'Wooden Table',
    sku: 'FG-WTBL-002',
    description: 'Simple wooden table for home and office, multiple sizes',
    salesPrice: 8500,
    costPrice: 4800,
    productType: 'FINISHED_GOOD',
    procurementStrategy: 'MTS',
    procurementType: 'MANUFACTURING',
    vendor: '',
    isActive: true,
    _inventory: { onHandQty: 20, reservedQty: 0, minimumStockLevel: 5 },
  },
  {
    productName: 'Office Chair',
    sku: 'FG-OCHR-003',
    description: 'Ergonomic office chair with lumbar support and cushioned seat',
    salesPrice: 5500,
    costPrice: 3200,
    productType: 'FINISHED_GOOD',
    procurementStrategy: 'MTS',
    procurementType: 'MANUFACTURING',
    vendor: '',
    isActive: true,
    _inventory: { onHandQty: 50, reservedQty: 0, minimumStockLevel: 10 },
  },

  // ── COMPONENTS ───────────────────────────────────────────────────────────
  {
    productName: 'Wooden Legs',
    sku: 'CMP-WLEG-004',
    description: 'Solid teak wood table legs, 75cm height, lathe-turned',
    salesPrice: 0,
    costPrice: 250,
    productType: 'COMPONENT',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'WoodMart Suppliers',
    isActive: true,
    _inventory: { onHandQty: 20, reservedQty: 0, minimumStockLevel: 8 },
  },
  {
    productName: 'Wooden Top',
    sku: 'CMP-WTOP-005',
    description: 'Flat wooden table top panel, 120×60cm, 18mm thickness',
    salesPrice: 0,
    costPrice: 800,
    productType: 'COMPONENT',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'WoodMart Suppliers',
    isActive: true,
    _inventory: { onHandQty: 10, reservedQty: 0, minimumStockLevel: 4 },
  },
  {
    productName: 'Chair Base',
    sku: 'CMP-CBAS-006',
    description: 'Five-star metallic chair base with caster wheels',
    salesPrice: 0,
    costPrice: 550,
    productType: 'COMPONENT',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'SteelCraft Vendors',
    isActive: true,
    _inventory: { onHandQty: 100, reservedQty: 0, minimumStockLevel: 20 },
  },
  {
    productName: 'Chair Cushion',
    sku: 'CMP-CUSH-007',
    description: 'High-density foam seat cushion with fabric cover',
    salesPrice: 0,
    costPrice: 320,
    productType: 'COMPONENT',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'FoamTech Industries',
    isActive: true,
    _inventory: { onHandQty: 100, reservedQty: 0, minimumStockLevel: 20 },
  },

  // ── RAW MATERIALS ────────────────────────────────────────────────────────
  {
    productName: 'Screws',
    sku: 'RAW-SCRW-008',
    description: 'M6 hex-head wood screws, 50mm, zinc-plated, pack of 100',
    salesPrice: 0,
    costPrice: 50,
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'Fasteners Pvt Ltd',
    isActive: true,
    _inventory: { onHandQty: 1000, reservedQty: 0, minimumStockLevel: 200 },
  },
  {
    productName: 'Nails',
    sku: 'RAW-NAIL-009',
    description: 'Common wire nails, 2.5 inch, bright finish, per kg',
    salesPrice: 0,
    costPrice: 80,
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'NailBox Supplies',
    isActive: true,
    _inventory: { onHandQty: 500, reservedQty: 0, minimumStockLevel: 100 },
  },
  {
    productName: 'Wood Sheets',
    sku: 'RAW-WSHT-010',
    description: 'Marine plywood sheets, 8×4ft, 12mm thickness, per sheet',
    salesPrice: 0,
    costPrice: 650,
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'Timber Industries',
    isActive: true,
    _inventory: { onHandQty: 200, reservedQty: 0, minimumStockLevel: 50 },
  },
  // Paint — 11th item per spec mention
  {
    productName: 'Paint',
    sku: 'RAW-PANT-011',
    description: 'Wood primer + topcoat paint, 1-litre can, various colors',
    salesPrice: 0,
    costPrice: 350,
    productType: 'RAW_MATERIAL',
    procurementStrategy: 'MTS',
    procurementType: 'PURCHASE',
    vendor: 'PaintPro Solutions',
    isActive: true,
    _inventory: { onHandQty: 100, reservedQty: 0, minimumStockLevel: 20 },
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// BILLS OF MATERIALS
// ──────────────────────────────────────────────────────────────────────────────

const BOMS_DATA = [
  {
    bomCode: 'BOM-DTBL-001',
    productName: 'Dining Table',
    quantity: 1,
    version: 1,
    description: 'Standard BoM for Dining Table — premium finish',
    isActive: true,
    components: [
      { productName: 'Wooden Legs', quantity: 4, uom: 'units' },
      { productName: 'Wooden Top', quantity: 1, uom: 'units' },
      { productName: 'Screws', quantity: 12, uom: 'units' },
    ],
    operations: [
      { name: 'Assembly', workCenter: 'Assembly Line', durationMins: 60 },
      { name: 'Painting', workCenter: 'Paint Floor', durationMins: 30 },
      { name: 'Packing', workCenter: 'Packaging Unit', durationMins: 20 },
    ],
  },
  {
    bomCode: 'BOM-WTBL-002',
    productName: 'Wooden Table',
    quantity: 1,
    version: 1,
    description: 'Standard BoM for Wooden Table',
    isActive: true,
    components: [
      { productName: 'Wooden Legs', quantity: 4, uom: 'units' },
      { productName: 'Wooden Top', quantity: 1, uom: 'units' },
      { productName: 'Screws', quantity: 10, uom: 'units' },
    ],
    operations: [
      { name: 'Assembly', workCenter: 'Assembly Line', durationMins: 45 },
      { name: 'Painting', workCenter: 'Paint Floor', durationMins: 25 },
      { name: 'Packing', workCenter: 'Packaging Unit', durationMins: 15 },
    ],
  },
  {
    bomCode: 'BOM-OCHR-003',
    productName: 'Office Chair',
    quantity: 1,
    version: 1,
    description: 'Standard BoM for Office Chair',
    isActive: true,
    components: [
      { productName: 'Chair Base', quantity: 1, uom: 'units' },
      { productName: 'Chair Cushion', quantity: 1, uom: 'units' },
      { productName: 'Screws', quantity: 8, uom: 'units' },
    ],
    operations: [
      { name: 'Assembly', workCenter: 'Assembly Line', durationMins: 30 },
      { name: 'Packing', workCenter: 'Packaging Unit', durationMins: 10 },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// WORK CENTERS
// ──────────────────────────────────────────────────────────────────────────────

const WORK_CENTERS_DATA = [
  {
    code: 'WC-ASML-001',
    name: 'Assembly Line',
    description: 'Main furniture assembly station with pneumatic tools and jigs',
    capacity: 20,
    costPerHour: 120,
    isActive: true,
  },
  {
    code: 'WC-PNTF-002',
    name: 'Paint Floor',
    description: 'Spray painting and finishing booth with ventilation',
    capacity: 10,
    costPerHour: 80,
    isActive: true,
  },
  {
    code: 'WC-PKGU-003',
    name: 'Packaging Unit',
    description: 'Final QC, wrapping, and dispatch preparation area',
    capacity: 30,
    costPerHour: 60,
    isActive: true,
  },
];

module.exports = { PRODUCTS_DATA, BOMS_DATA, WORK_CENTERS_DATA };
