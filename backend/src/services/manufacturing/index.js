'use strict';

/**
 * Manufacturing Services — Public Index
 *
 * All controllers, routes, and external services import from this file.
 * Never import individual service files directly from outside this directory.
 *
 * Service Responsibilities:
 *   BoMService                — Bill of Materials CRUD and lifecycle
 *   ManufacturingOrderService — MO orchestration (confirms, starts, completes, cancels)
 *   WorkOrderService          — WO generation, sequencing, state machine
 *   ProductionExecutionService — Inventory engines (reserve, consume, produce)
 *   CapacityPlanningService   — Load analysis, scheduling suggestions (Phase 5 capacity check)
 *
 * Phase 5 Entry Point:
 *   ManufacturingOrderService.scheduleFromSalesOrder(salesOrderId, lineItem, userId)
 */

const BoMService                 = require('./BoMService');
const ManufacturingOrderService  = require('./ManufacturingOrderService');
const WorkOrderService           = require('./WorkOrderService');
const ProductionExecutionService = require('./ProductionExecutionService');
const CapacityPlanningService    = require('./CapacityPlanningService');

module.exports = {
  BoMService,
  ManufacturingOrderService,
  WorkOrderService,
  ProductionExecutionService,
  CapacityPlanningService,
};
