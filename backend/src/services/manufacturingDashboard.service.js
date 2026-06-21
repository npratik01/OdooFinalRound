'use strict';

const { ManufacturingOrder, MO_STATUS } = require('../models/ManufacturingOrder.model');
const InventoryMovement = require('../models/InventoryMovement.model');

// ─── Manufacturing Dashboard Service ─────────────────────────────────────────

const getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // ─── MO counts by status ──────────────────────────────────────────────────
  const statusCounts = await ManufacturingOrder.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const byStatus = {};
  for (const s of Object.values(MO_STATUS)) byStatus[s] = 0;
  statusCounts.forEach(({ _id, count }) => {
    byStatus[_id] = count;
  });
  const totalMOs = Object.values(byStatus).reduce((a, b) => a + b, 0);

  // ─── Production output this month ─────────────────────────────────────────
  const monthlyOutput = await ManufacturingOrder.aggregate([
    {
      $match: {
        status: MO_STATUS.DONE,
        completedDate: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalProduced: { $sum: '$producedQty' },
        ordersCompleted: { $sum: 1 },
      },
    },
  ]);

  const prevMonthOutput = await ManufacturingOrder.aggregate([
    {
      $match: {
        status: MO_STATUS.DONE,
        completedDate: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalProduced: { $sum: '$producedQty' },
        ordersCompleted: { $sum: 1 },
      },
    },
  ]);

  const thisMonthProduced = monthlyOutput[0]?.totalProduced || 0;
  const prevMonthProduced = prevMonthOutput[0]?.totalProduced || 0;
  const thisMonthCompleted = monthlyOutput[0]?.ordersCompleted || 0;

  const outputGrowth =
    prevMonthProduced === 0
      ? thisMonthProduced > 0 ? 100 : 0
      : Math.round(((thisMonthProduced - prevMonthProduced) / prevMonthProduced) * 100);

  // ─── Top produced products (all time) ────────────────────────────────────
  const topProducts = await ManufacturingOrder.aggregate([
    { $match: { status: MO_STATUS.DONE } },
    {
      $group: {
        _id: '$productId',
        totalProduced: { $sum: '$producedQty' },
        moCount: { $sum: 1 },
      },
    },
    { $sort: { totalProduced: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        productName: '$product.productName',
        sku: '$product.sku',
        totalProduced: 1,
        moCount: 1,
      },
    },
  ]);

  // ─── Weekly production trend (last 8 weeks) ───────────────────────────────
  const weeklyTrend = await ManufacturingOrder.aggregate([
    {
      $match: {
        status: MO_STATUS.DONE,
        completedDate: {
          $gte: new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $group: {
        _id: {
          week: { $week: '$completedDate' },
          year: { $year: '$completedDate' },
        },
        totalProduced: { $sum: '$producedQty' },
        ordersCompleted: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  // ─── Active MOs (IN_PROGRESS) ─────────────────────────────────────────────
  const activeMOs = await ManufacturingOrder.find({ status: MO_STATUS.IN_PROGRESS })
    .sort({ scheduledDate: 1 })
    .limit(5)
    .populate('productId', 'productName sku')
    .populate('workCenterId', 'code name')
    .lean();

  const activeMOsWithVirtuals = activeMOs.map((mo) => ({
    ...mo,
    remainingQty: Math.max(0, mo.plannedQty - mo.producedQty),
    completionPercentage: mo.plannedQty
      ? Math.round((mo.producedQty / mo.plannedQty) * 100)
      : 0,
  }));

  // ─── Pending MO Queue (DRAFT status — awaiting confirmation / rejection) ──
  const pendingQueue = await ManufacturingOrder.find({ status: MO_STATUS.DRAFT })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('productId', 'productName sku')
    .populate('workCenterId', 'code name')
    .lean();

  const pendingQueueWithMeta = pendingQueue.map((mo) => ({
    ...mo,
    remainingQty: Math.max(0, mo.plannedQty - mo.producedQty),
    completionPercentage: 0,
  }));

  // ─── Automation statistics ─────────────────────────────────────────────────
  const [autoCreatedTotal, pendingApprovalCount] = await Promise.all([
    ManufacturingOrder.countDocuments({ createdAutomatically: true }),
    ManufacturingOrder.countDocuments({ createdAutomatically: true, status: MO_STATUS.DRAFT }),
  ]);

  const automationStats = {
    autoCreatedTotal,
    manuallyCreatedTotal: totalMOs - autoCreatedTotal,
    pendingApprovalCount,
  };

  return {
    summary: {
      totalMOs,
      byStatus,
      thisMonthProduced,
      thisMonthCompleted,
      outputGrowth,
      prevMonthProduced,
    },
    topProducts,
    weeklyTrend,
    activeMOs: activeMOsWithVirtuals,
    pendingQueue: pendingQueueWithMeta,
    automationStats,
  };
};

module.exports = { getDashboardStats };
