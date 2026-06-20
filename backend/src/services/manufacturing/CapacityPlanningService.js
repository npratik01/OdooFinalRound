'use strict';

/**
 * CapacityPlanningService
 * Single responsibility: Work center load analysis, duration estimation,
 * and scheduling suggestions for Manufacturing Orders.
 *
 * Phase 5 Integration:
 *   `checkCapacityForMO(bomId, qty, desiredStartDate)` is the entry point
 *   called by ManufacturingOrderService.scheduleFromSalesOrder() to determine
 *   if an auto-MO can be scheduled immediately or must be queued.
 *
 *   `suggestSchedulingDates(bomId, qty)` returns a recommended start/end
 *   date window based on current work center queue depth.
 */

const WorkCenter = require('../../models/WorkCenter.model');
const Operation  = require('../../models/Operation.model');
const { BOM }    = require('../../models/BOM.model');
const { WorkOrder, WO_STATUS } = require('../../models/WorkOrder.model');
const logger     = require('../../utils/logger');

// ─── ESTIMATE MO Duration ─────────────────────────────────────────────────────
// Returns total planned duration in minutes for one MO unit.
// Accounts for work center efficiency so duration is realistic.

const estimateMODuration = async (bomId, qty = 1) => {
  const bom = await BOM.findById(bomId).populate('operations.operationId');
  if (!bom) throw { statusCode: 404, message: 'BoM not found for capacity estimation' };

  let totalMinutes = 0;

  for (const bomOp of bom.operations || []) {
    const op = bomOp.operationId;
    if (!op || !op.standardDurationMinutes) continue;

    const wc = await WorkCenter.findById(op.workCenterId);
    const efficiency = wc?.efficiencyPercentage ? wc.efficiencyPercentage / 100 : 1;

    // Realistic duration = planned / efficiency, scaled by qty
    const realistic = Math.ceil((op.standardDurationMinutes * qty) / efficiency);
    totalMinutes += realistic;
  }

  logger.debug(`CapacityPlanningService: estimated ${totalMinutes}m for BOM ${bomId} x${qty}`);
  return totalMinutes;
};

// ─── WORK CENTER UTILIZATION ──────────────────────────────────────────────────
// Returns per-work-center active WO counts and total planned minutes in queue.

const getWorkCenterUtilization = async () => {
  const workCenters = await WorkCenter.find({ isActive: true });

  const utilization = await Promise.all(
    workCenters.map(async (wc) => {
      const activeWOs = await WorkOrder.find({
        workCenterId: wc._id,
        status: { $in: [WO_STATUS.READY, WO_STATUS.IN_PROGRESS] },
      });

      const queuedMinutes = activeWOs.reduce(
        (sum, wo) => sum + (wo.plannedDurationMinutes || 0), 0
      );

      const dailyCapacityMinutes = (wc.capacityPerDay || 8) * 60;
      const utilizationPct = dailyCapacityMinutes > 0
        ? Math.min(100, Math.round((queuedMinutes / dailyCapacityMinutes) * 100))
        : 0;

      return {
        workCenterId:      wc._id,
        workCenterCode:    wc.workCenterCode,
        workCenterName:    wc.workCenterName,
        capacityPerDay:    wc.capacityPerDay,
        efficiencyPct:     wc.efficiencyPercentage,
        activeWorkOrders:  activeWOs.length,
        queuedMinutes,
        utilizationPct,
      };
    })
  );

  return utilization;
};

// ─── SUGGEST Scheduling Dates ─────────────────────────────────────────────────
// Proposes a start date and end date based on estimated duration.
// Currently uses NOW as base; Phase 5 can extend with queue-aware scheduling.

const suggestSchedulingDates = async (bomId, qty = 1) => {
  const estimatedMinutes = await estimateMODuration(bomId, qty);

  const start = new Date();
  const end   = new Date(start.getTime() + estimatedMinutes * 60 * 1000);

  return {
    suggestedStartDate:     start,
    suggestedEndDate:       end,
    estimatedDurationMinutes: estimatedMinutes,
  };
};

// ─── PHASE 5 HOOK: Check Capacity for auto-MO ────────────────────────────────
// Returns whether the BoM's work centers have enough capacity on the desired
// start date to absorb the new MO without overloading.
// Returns { feasible: boolean, bottlenecks: [], suggestedStart: Date }

const checkCapacityForMO = async (bomId, qty, desiredStartDate) => {
  const bom = await BOM.findById(bomId).populate('operations.operationId');
  if (!bom) throw { statusCode: 404, message: 'BoM not found for capacity check' };

  const bottlenecks = [];
  const startDate   = desiredStartDate ? new Date(desiredStartDate) : new Date();

  for (const bomOp of bom.operations || []) {
    const op = bomOp.operationId;
    if (!op) continue;

    const wc = await WorkCenter.findById(op.workCenterId);
    if (!wc || !wc.isActive) {
      bottlenecks.push({
        operationId: op._id,
        reason: `Work center ${op.workCenterId} is inactive or missing`,
      });
      continue;
    }

    // Count active WOs on this work center on the target day
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingLoad = await WorkOrder.countDocuments({
      workCenterId: wc._id,
      status: { $in: [WO_STATUS.PENDING, WO_STATUS.READY, WO_STATUS.IN_PROGRESS] },
    });

    const dailyCapacitySlots = Math.floor(((wc.capacityPerDay || 8) * 60) / (op.standardDurationMinutes || 60));

    if (existingLoad >= dailyCapacitySlots) {
      bottlenecks.push({
        workCenterId:   wc._id,
        workCenterName: wc.workCenterName,
        currentLoad:    existingLoad,
        maxSlots:       dailyCapacitySlots,
        reason: `Work center '${wc.workCenterName}' is at capacity (${existingLoad}/${dailyCapacitySlots} slots used)`,
      });
    }
  }

  // Suggest a next-day start if bottlenecks exist
  const suggestedStart = bottlenecks.length > 0
    ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
    : startDate;

  return {
    feasible:       bottlenecks.length === 0,
    bottlenecks,
    suggestedStart,
    desiredStart:   startDate,
  };
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

module.exports = {
  estimateMODuration,
  getWorkCenterUtilization,
  suggestSchedulingDates,
  checkCapacityForMO,
};
