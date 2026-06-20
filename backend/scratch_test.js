'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const Product = require('./src/models/Product.model');
const Inventory = require('./src/models/Inventory.model');
const InventoryMovement = require('./src/models/InventoryMovement.model');
const WorkCenter = require('./src/models/WorkCenter.model');
const Operation = require('./src/models/Operation.model');
const { BOM, BOM_STATUS } = require('./src/models/BOM.model');
const { ManufacturingOrder, MO_STATUS } = require('./src/models/ManufacturingOrder.model');
const { WorkOrder, WO_STATUS } = require('./src/models/WorkOrder.model');

// Services
const {
  BoMService,
  ManufacturingOrderService,
  WorkOrderService,
  ProductionExecutionService,
  CapacityPlanningService
} = require('./src/services/manufacturing');

// Load legacy services for setup if needed (Work Center, Operation)
const wcService = require('./src/services/workCenter.service');
const opService = require('./src/services/operation.service');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini-erp');
    console.log('Connected!');

    // Get Admin User
    const admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      console.error('Please run database seeder first: npm run seed');
      process.exit(1);
    }
    const adminId = admin._id;

    // Get raw material & finished good
    const steelRod = await Product.findOne({ productName: 'Steel Rod 10mm' });
    const bracket = await Product.findOne({ productName: 'CNC Machined Bracket' });

    if (!steelRod || !bracket) {
      console.error('Products not found! Seed first.');
      process.exit(1);
    }

    console.log('Found Raw Material steel rod on hand:', await Inventory.findOne({ productId: steelRod._id }));
    console.log('Found Finished Good CNC bracket on hand:', await Inventory.findOne({ productId: bracket._id }));

    // Cleanup previous runs if any
    await WorkCenter.deleteMany({ workCenterName: 'CNC Milling Section' });
    await Operation.deleteMany({ operationName: 'Mill metal slotting' });
    await BOM.deleteMany({ productId: bracket._id });
    await ManufacturingOrder.deleteMany({ productId: bracket._id });

    // 1. Create Work Center
    console.log('\n--- 1. Creating Work Center ---');
    const wc = await wcService.createWorkCenter({
      workCenterName: 'CNC Milling Section',
      description: 'Primary milling operations for metal products',
      capacityPerDay: 16,
      efficiencyPercentage: 95,
    });
    console.log('Work Center created:', wc.workCenterCode, wc._id);

    // 2. Create Operation
    console.log('\n--- 2. Creating Operation ---');
    const op = await opService.createOperation({
      operationName: 'Mill metal slotting',
      description: 'Milling brackets sequence',
      standardDurationMinutes: 15,
      workCenterId: wc._id,
      sequence: 1,
    });
    console.log('Operation created:', op.operationCode, op._id);

    // 3. Create Bill of Materials (BoM)
    console.log('\n--- 3. Creating BoM ---');
    let bom = await BoMService.createBOM({
      productId: bracket._id,
      version: '1.0',
      description: 'BoM version for bracket production',
      components: [
        {
          productId: steelRod._id,
          quantityRequired: 5,
          unit: 'Units',
        }
      ],
      operations: [
        {
          operationId: op._id,
          sequence: 1,
        }
      ]
    }, adminId);
    console.log('BoM created:', bom.bomCode, 'Status:', bom.status);

    // Activate BoM
    bom = await BoMService.activateBOM(bom._id);
    console.log('BoM activated! Status:', bom.status);

    // 4. Create Manufacturing Order (Draft)
    console.log('\n--- 4. Creating Manufacturing Order (Draft) ---');
    let mo = await ManufacturingOrderService.createManufacturingOrder({
      productId: bracket._id,
      bomId: bom._id,
      quantityToProduce: 2, // will require 2 * 5 = 10 steel rods
      remarks: 'Automated test run',
    }, adminId);
    console.log('MO created:', mo.moNumber, 'Status:', mo.status);

    // 5. Confirm MO (Component reservation + Work Order generation)
    console.log('\n--- 5. Confirming MO (Reserve + Generate Work Orders) ---');
    mo = await ManufacturingOrderService.confirmManufacturingOrder(mo._id, adminId);
    console.log('MO confirmed! Status:', mo.status);
    console.log('Component requirements snapshot:', JSON.stringify(mo.componentRequirements, null, 2));

    const steelRodInv = await Inventory.findOne({ productId: steelRod._id });
    console.log('Steel rod inventory after reservation (reserved should be +10):', steelRodInv);

    const wos = await WorkOrderService.getWorkOrdersForMO(mo._id);
    console.log('Generated Work Orders count:', wos.length);
    wos.forEach(w => console.log(`WO: ${w.workOrderNumber}, Seq: ${w.sequence}, Status: ${w.status}`));

    // 6. Start MO & Work Order Execution
    console.log('\n--- 6. Starting MO & Work Order Execution ---');
    mo = await ManufacturingOrderService.startManufacturingOrder(mo._id);
    console.log('MO started! Status:', mo.status);

    let activeWOs = await WorkOrderService.getWorkOrdersForMO(mo._id);
    const targetWO = activeWOs[0];
    console.log(`WO ${targetWO.workOrderNumber} Status:`, targetWO.status);

    // Start Work Order
    console.log('Starting Work Order...');
    await WorkOrderService.startWorkOrder(targetWO._id, adminId);
    console.log('Work Order started!');

    // Complete Work Order
    console.log('Completing Work Order...');
    await WorkOrderService.completeWorkOrder(targetWO._id, { actualDurationMinutes: 12 }, adminId);
    console.log('Work Order completed!');

    // 7. Complete MO (Consumption + Finished Goods Production)
    console.log('\n--- 7. Completing Manufacturing Order ---');
    mo = await ManufacturingOrderService.completeManufacturingOrder(mo._id, { quantityProduced: 2 }, adminId);
    console.log('MO completed! Status:', mo.status, 'Produced:', mo.quantityProduced);

    const finalSteelRodInv = await Inventory.findOne({ productId: steelRod._id });
    console.log('Final steel rod inventory (onHand should decrease by 10, reserved should decrease by 10):', finalSteelRodInv);

    const finalBracketInv = await Inventory.findOne({ productId: bracket._id });
    console.log('Final bracket inventory (onHand should increase by 2):', finalBracketInv);

    // Print latest movements
    const movements = await InventoryMovement.find({
      referenceId: mo._id,
    }).sort({ createdAt: 1 });
    console.log('\nLedger Transactions recorded:');
    movements.forEach(m => {
      console.log(`- Type: ${m.movementType}, Qty: ${m.quantity}, Remarks: ${m.remarks}`);
    });

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Mongoose connection closed.');
  }
}

run();
