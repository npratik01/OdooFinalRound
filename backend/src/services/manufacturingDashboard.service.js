'use strict';

const { ManufacturingOrder, MO_STATUS } = require('../models/ManufacturingOrder.model');
const { WorkOrder, WO_STATUS }           = require('../models/WorkOrder.model');
const WorkCenter                         = require('../models/WorkCenter.model');

// ─── SUMMARY CARDS ────────────────────────────────────────────────────────────

const getDashboardSummary = async () => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalMOs,
    draftMOs,
    confirmedMOs,
    inProgressMOs,
    completedMOs,
    cancelledMOs,
    activeWorkOrders,
    completedToday,
  ] = await Promise.all([
    ManufacturingOrder.countDocuments(),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.DRAFT }),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.CONFIRMED }),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.IN_PROGRESS }),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.COMPLETED }),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.CANCELLED }),
    WorkOrder.countDocuments({ status: { $in: [WO_STATUS.PENDING, WO_STATUS.READY, WO_STATUS.IN_PROGRESS] } }),
    ManufacturingOrder.countDocuments({ status: MO_STATUS.COMPLETED, actualEndDate: { $gte: today } }),
  ]);

  // Delayed MOs: plannedEndDate < now and not completed/cancelled
  const delayedMOs = await ManufacturingOrder.countDocuments({
    plannedEndDate: { $lt: now, $ne: null },
    status:         { $nin: [MO_STATUS.COMPLETED, MO_STATUS.CANCELLED] },
  });

  return {
    totalMOs,
    draftMOs,
    confirmedMOs,
    inProgressMOs,
    completedMOs,
    cancelledMOs,
    delayedMOs,
    activeWorkOrders,
    completedToday,
  };
};

// ─── MONTHLY PRODUCTION TREND ─────────────────────────────────────────────────

const getMonthlyProductionTrend = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const trend = await ManufacturingOrder.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total:     { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', MO_STATUS.COMPLETED] }, 1, 0] } },
        produced:  { $sum: '$quantityProduced' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' }, '-',
            { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] },
          ],
        },
        total: 1,
        completed: 1,
        produced: 1,
      },
    },
  ]);

  return trend;
};

// ─── MO STATUS DISTRIBUTION ───────────────────────────────────────────────────

const getMOStatusDistribution = async () => {
  return ManufacturingOrder.aggregate([
    {
      $group: {
        _id:   '$status',
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);
};

// ─── TOP MANUFACTURED PRODUCTS ────────────────────────────────────────────────

const getTopManufacturedProducts = async () => {
  return ManufacturingOrder.aggregate([
    { $match: { status: MO_STATUS.COMPLETED } },
    {
      $group: {
        _id:      '$productId',
        totalMOs: { $sum: 1 },
        totalQty: { $sum: '$quantityProduced' },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from:         'products',
        localField:   '_id',
        foreignField: '_id',
        as:           'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productId:   '$_id',
        productName: '$product.productName',
        sku:         '$product.sku',
        totalMOs:    1,
        totalQty:    1,
      },
    },
  ]);
};

// ─── WORK CENTER UTILIZATION ──────────────────────────────────────────────────

const getWorkCenterUtilization = async () => {
  const utilization = await WorkOrder.aggregate([
    { $match: { status: { $ne: WO_STATUS.CANCELLED } } },
    {
      $group: {
        _id:                '$workCenterId',
        totalWorkOrders:    { $sum: 1 },
        completedOrders:    { $sum: { $cond: [{ $eq: ['$status', WO_STATUS.COMPLETED] }, 1, 0] } },
        totalPlanned:       { $sum: '$plannedDurationMinutes' },
        totalActual:        { $sum: '$actualDurationMinutes' },
      },
    },
    {
      $lookup: {
        from:         'workcenters',
        localField:   '_id',
        foreignField: '_id',
        as:           'workCenter',
      },
    },
    { $unwind: { path: '$workCenter', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        workCenterId:    '$_id',
        workCenterName:  '$workCenter.workCenterName',
        capacityPerDay:  '$workCenter.capacityPerDay',
        totalWorkOrders:  1,
        completedOrders:  1,
        totalPlanned:     1,
        totalActual:      1,
        completionRate: {
          $cond: [
            { $gt: ['$totalWorkOrders', 0] },
            { $multiply: [{ $divide: ['$completedOrders', '$totalWorkOrders'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { totalWorkOrders: -1 } },
  ]);

  return utilization;
};

// ─── PRODUCTION EFFICIENCY ────────────────────────────────────────────────────

const getProductionEfficiency = async () => {
  const completed = await ManufacturingOrder.aggregate([
    { $match: { status: MO_STATUS.COMPLETED } },
    {
      $project: {
        moNumber:         1,
        quantityToProduce:1,
        quantityProduced: 1,
        durationHours: {
          $cond: [
            { $and: ['$actualStartDate', '$actualEndDate'] },
            { $divide: [{ $subtract: ['$actualEndDate', '$actualStartDate'] }, 3600000] },
            null,
          ],
        },
        efficiency: {
          $cond: [
            { $gt: ['$quantityToProduce', 0] },
            { $multiply: [{ $divide: ['$quantityProduced', '$quantityToProduce'] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id:               null,
        avgEfficiency:     { $avg: '$efficiency' },
        avgDurationHours:  { $avg: '$durationHours' },
        totalCompleted:    { $sum: 1 },
        totalPlanned:      { $sum: '$quantityToProduce' },
        totalProduced:     { $sum: '$quantityProduced' },
      },
    },
    {
      $project: {
        _id: 0,
        avgEfficiency:    { $round: ['$avgEfficiency', 1] },
        avgDurationHours: { $round: ['$avgDurationHours', 1] },
        totalCompleted:   1,
        totalPlanned:     1,
        totalProduced:    1,
      },
    },
  ]);

  return completed[0] || {
    avgEfficiency:    0,
    avgDurationHours: 0,
    totalCompleted:   0,
    totalPlanned:     0,
    totalProduced:    0,
  };
};

module.exports = {
  getDashboardSummary,
  getMonthlyProductionTrend,
  getMOStatusDistribution,
  getTopManufacturedProducts,
  getWorkCenterUtilization,
  getProductionEfficiency,
};
