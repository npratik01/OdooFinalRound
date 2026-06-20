'use strict';

// Legacy compatibility layer - redirect to new Service-Oriented architecture
const ManufacturingOrderService = require('./manufacturing/ManufacturingOrderService');
const WorkOrderService = require('./manufacturing/WorkOrderService');

module.exports = {
  ...ManufacturingOrderService,
  ...WorkOrderService,
};
