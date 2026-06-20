'use strict';

const SalesOrder = require('../models/SalesOrder.model');
const Customer = require('../models/Customer.model');

/**
 * Get overall Sales KPI Summary metrics.
 * Returns keys that match the frontend SalesAnalyticsPage expectations:
 * totalOrders, totalRevenue, draftOrders, confirmedOrders,
 * partialOrders, deliveredOrders, cancelledOrders
 */
const getSalesStats = async () => {
  const [
    totalOrders,
    draftOrders,
    confirmedOrders,
    partialOrders,
    deliveredOrders,
    cancelledOrders,
    revenueAgg,
    totalCustomers,
  ] = await Promise.all([
    SalesOrder.countDocuments(),
    SalesOrder.countDocuments({ status: 'Draft' }),
    SalesOrder.countDocuments({ status: 'Confirmed' }),
    SalesOrder.countDocuments({ status: 'Partially Delivered' }),
    SalesOrder.countDocuments({ status: 'Fully Delivered' }),
    SalesOrder.countDocuments({ status: 'Cancelled' }),
    SalesOrder.aggregate([
      { $match: { status: { $in: ['Fully Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Customer.countDocuments({ isActive: true }),
  ]);

  const totalRevenue = revenueAgg[0] ? Math.round(revenueAgg[0].total * 100) / 100 : 0;

  return {
    totalOrders,
    totalRevenue,
    draftOrders,
    confirmedOrders,
    partialOrders,
    deliveredOrders,
    cancelledOrders,
    pendingDeliveries: confirmedOrders + partialOrders,
    totalCustomers,
  };
};

/**
 * Get detailed analytics: monthly trend, top customers, top products, recent orders.
 * Matches the fields expected by SalesAnalyticsPage.jsx.
 */
const getSalesAnalytics = async () => {
  // ── 1. Monthly Revenue Trend (last 6 months) ──────────────────────────────
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const trendRaw = await SalesOrder.aggregate([
    {
      $match: {
        status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] },
        orderDate: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const monthlyTrend = trendRaw.map(item => ({
    year:    item._id.year,
    month:   item._id.month,
    revenue: Math.round(item.revenue * 100) / 100,
    count:   item.count,
  }));

  // ── 2. Top Customers by revenue ───────────────────────────────────────────
  const topCustomers = await SalesOrder.aggregate([
    { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
    {
      $group: {
        _id: '$customerId',
        totalRevenue: { $sum: '$totalAmount' },
        totalOrders:  { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        customerName: { $ifNull: ['$customer.customerName', 'Unknown Customer'] },
        customerCode: { $ifNull: ['$customer.customerCode', 'N/A'] },
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalOrders:  1
      }
    }
  ]);

  // ── 3. Top Products by quantity delivered ─────────────────────────────────
  const topProducts = await SalesOrder.aggregate([
    { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalQty:     { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { totalQty: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        productName:  { $ifNull: ['$product.productName', 'Unknown Product'] },
        sku:          { $ifNull: ['$product.sku', 'N/A'] },
        totalQty:     1,
        totalRevenue: { $round: ['$totalRevenue', 2] }
      }
    }
  ]);

  // ── 4. Recent Orders (last 10) ────────────────────────────────────────────
  const recentOrders = await SalesOrder.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customerId', 'customerName customerCode')
    .select('soNumber status totalAmount orderDate items customerId')
    .lean();

  // ── 5. Yearly Sales ───────────────────────────────────────────────────────
  const yearlySales = await SalesOrder.aggregate([
    { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
    {
      $group: {
        _id: { year: { $year: '$orderDate' } },
        revenue: { $sum: '$totalAmount' },
        orders:  { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1 } },
    {
      $project: {
        _id: 0,
        year:    '$_id.year',
        revenue: { $round: ['$revenue', 2] },
        orders:  1
      }
    }
  ]);

  return {
    monthlyTrend,
    topCustomers,
    topProducts,
    recentOrders,
    yearlySales,
  };
};

module.exports = {
  getSalesStats,
  getSalesAnalytics,
};
