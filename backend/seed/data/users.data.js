'use strict';

/**
 * User Seed Data
 * 6 roles × multiple users each = complete RBAC demo data
 */

const USERS_DATA = [
  // ── Admin ────────────────────────────────────────────────────────────────
  {
    name: 'System Administrator',
    email: 'admin@erp.com',
    password: 'Admin@1234',
    role: 'ADMIN',
    isActive: true,
  },

  // ── Business Owners (4) ──────────────────────────────────────────────────
  {
    name: 'Rahul Sharma',
    email: 'owner1@erp.com',
    password: 'Owner@1234',
    role: 'BUSINESS_OWNER',
    isActive: true,
  },
  {
    name: 'Priya Mehta',
    email: 'owner2@erp.com',
    password: 'Owner@1234',
    role: 'BUSINESS_OWNER',
    isActive: true,
  },
  {
    name: 'Vikram Nair',
    email: 'owner3@erp.com',
    password: 'Owner@1234',
    role: 'BUSINESS_OWNER',
    isActive: true,
  },
  {
    name: 'Sneha Patel',
    email: 'owner4@erp.com',
    password: 'Owner@1234',
    role: 'BUSINESS_OWNER',
    isActive: true,
  },

  // ── Sales Users (4) ─────────────────────────────────────────────────────
  {
    name: 'Arjun Sales Rep',
    email: 'sales1@erp.com',
    password: 'Sales@1234',
    role: 'SALES_USER',
    isActive: true,
  },
  {
    name: 'Kavitha Sales Rep',
    email: 'sales2@erp.com',
    password: 'Sales@1234',
    role: 'SALES_USER',
    isActive: true,
  },
  {
    name: 'Deepak Sales Rep',
    email: 'sales3@erp.com',
    password: 'Sales@1234',
    role: 'SALES_USER',
    isActive: true,
  },
  {
    name: 'Meena Sales Rep',
    email: 'sales4@erp.com',
    password: 'Sales@1234',
    role: 'SALES_USER',
    isActive: true,
  },

  // ── Purchase Users (4) ──────────────────────────────────────────────────
  {
    name: 'Rajesh Purchase Manager',
    email: 'purchase1@erp.com',
    password: 'Purchase@1234',
    role: 'PURCHASE_USER',
    isActive: true,
  },
  {
    name: 'Anita Purchase Manager',
    email: 'purchase2@erp.com',
    password: 'Purchase@1234',
    role: 'PURCHASE_USER',
    isActive: true,
  },
  {
    name: 'Suresh Purchase Manager',
    email: 'purchase3@erp.com',
    password: 'Purchase@1234',
    role: 'PURCHASE_USER',
    isActive: true,
  },
  {
    name: 'Lakshmi Purchase Manager',
    email: 'purchase4@erp.com',
    password: 'Purchase@1234',
    role: 'PURCHASE_USER',
    isActive: true,
  },

  // ── Manufacturing Users (4) ─────────────────────────────────────────────
  {
    name: 'Mohan Manufacturing Lead',
    email: 'mfg1@erp.com',
    password: 'Mfg@1234',
    role: 'MANUFACTURING_USER',
    isActive: true,
  },
  {
    name: 'Geeta Manufacturing Lead',
    email: 'mfg2@erp.com',
    password: 'Mfg@1234',
    role: 'MANUFACTURING_USER',
    isActive: true,
  },
  {
    name: 'Ravi Manufacturing Lead',
    email: 'mfg3@erp.com',
    password: 'Mfg@1234',
    role: 'MANUFACTURING_USER',
    isActive: true,
  },
  {
    name: 'Sunita Manufacturing Lead',
    email: 'mfg4@erp.com',
    password: 'Mfg@1234',
    role: 'MANUFACTURING_USER',
    isActive: true,
  },

  // ── Inventory Managers (4) ───────────────────────────────────────────────
  {
    name: 'Kiran Inventory Manager',
    email: 'inv1@erp.com',
    password: 'Inv@1234',
    role: 'INVENTORY_MANAGER',
    isActive: true,
  },
  {
    name: 'Pooja Inventory Manager',
    email: 'inv2@erp.com',
    password: 'Inv@1234',
    role: 'INVENTORY_MANAGER',
    isActive: true,
  },
  {
    name: 'Anil Inventory Manager',
    email: 'inv3@erp.com',
    password: 'Inv@1234',
    role: 'INVENTORY_MANAGER',
    isActive: true,
  },
  {
    name: 'Ritu Inventory Manager',
    email: 'inv4@erp.com',
    password: 'Inv@1234',
    role: 'INVENTORY_MANAGER',
    isActive: true,
  },
];

module.exports = { USERS_DATA };
