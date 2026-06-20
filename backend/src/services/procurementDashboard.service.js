'use strict';

const Vendor = require('../models/Vendor.model');
const { PurchaseOrder, PO_STATUS } = require('../models/PurchaseOrder.model');
const GoodsReceipt = require('../models/GoodsReceipt.model');
const { getLowStockItems } = require('./inventory.service');

// ─────────────────────────────────────────────────────────────────────────────
// PROCUREMENT KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────

const getProcurementStats = async () => {
  const [
    totalVendors,
    activeVendors,
    totalPOs,
    draftPOs,
    confirmedPOs,
    partialPOs,
    completedPOs,
    cancelledPOs,
    totalSpendAgg,
    totalReceipts,
  ] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ isActive: true }),
    PurchaseOrder.countDocuments(),
    PurchaseOrder.countDocuments({ status: PO_STATUS.DRAFT }),
    PurchaseOrder.countDocuments({ status: PO_STATUS.CONFIRMED }),
    PurchaseOrder.countDocuments({ status: PO_STATUS.PARTIALLY_RECEIVED }),
    PurchaseOrder.countDocuments({ status: PO_STATUS.FULLY_RECEIVED }),
    PurchaseOrder.countDocuments({ status: PO_STATUS.CANCELLED }),
    PurchaseOrder.aggregate([
      { $match: { status: { $in: [PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.FULLY_RECEIVED] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    GoodsReceipt.countDocuments(),
  ]);

  const totalSpend = totalSpendAgg[0] ? Math.round(totalSpendAgg[0].total * 100) / 100 : 0;
  const pendingReceipts = confirmedPOs + partialPOs;

  return {
    totalVendors,
    activeVendors,
    totalPOs,
    draftPOs,
    confirmedPOs,
    partialPOs,
    completedPOs,
    cancelledPOs,
    pendingReceipts,
    totalSpend,
    totalReceipts,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PROCUREMENT ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

const getProcurementAnalytics = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // 1. Monthly Purchase Trend (last 6 months)
  const trendRaw = await PurchaseOrder.aggregate([
    {
      $match: {
        status: { $in: [PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.FULLY_RECEIVED] },
        orderDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } },
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthlyTrend = trendRaw.map((item) => ({
    year: item._id.year,
    month: item._id.month,
    totalAmount: Math.round(item.totalAmount * 100) / 100,
    count: item.count,
  }));

  // 2. Vendor-wise Purchase Amount (top 10)
  const vendorWisePurchases = await PurchaseOrder.aggregate([
    { $match: { status: { $in: [PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.FULLY_RECEIVED] } } },
    {
      $group: {
        _id: '$vendorId',
        totalAmount: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        vendorName:  { $ifNull: ['$vendor.vendorName',  'Unknown Vendor'] },
        vendorCode:  { $ifNull: ['$vendor.vendorCode',  'N/A'] },
        totalAmount: { $round: ['$totalAmount', 2] },
        totalOrders: 1,
      },
    },
  ]);

  // 3. PO Status Distribution
  const statusDistribution = await PurchaseOrder.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  // 4. Top Purchased Products (by quantity received across all GRs)
  const topProducts = await GoodsReceipt.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalReceived: { $sum: '$items.quantityReceived' },
        receiptCount: { $sum: 1 },
      },
    },
    { $sort: { totalReceived: -1 } },
    { $limit: 10 },
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
        productName:   { $ifNull: ['$product.productName', 'Unknown Product'] },
        sku:           { $ifNull: ['$product.sku', 'N/A'] },
        totalReceived: 1,
        receiptCount:  1,
      },
    },
  ]);

  // 5. Recent Purchase Orders
  const recentOrders = await PurchaseOrder.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('vendorId', 'vendorName vendorCode')
    .select('poNumber status totalAmount orderDate vendorId')
    .lean();

  return {
    monthlyTrend,
    vendorWisePurchases,
    statusDistribution,
    topProducts,
    recentOrders,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────

const getSupplierPerformance = async () => {
  const vendors = await Vendor.find({ isActive: true }).lean();

  const performanceData = await Promise.all(
    vendors.map(async (vendor) => {
      const [allOrders, completedOrders, cancelledOrders] = await Promise.all([
        PurchaseOrder.find({ vendorId: vendor._id }).lean(),
        PurchaseOrder.find({ vendorId: vendor._id, status: PO_STATUS.FULLY_RECEIVED }).lean(),
        PurchaseOrder.find({ vendorId: vendor._id, status: PO_STATUS.CANCELLED }).lean(),
      ]);

      const totalOrders = allOrders.length;
      const completed   = completedOrders.length;
      const cancelled   = cancelledOrders.length;

      // Calculate delayed orders (actual receipt after expected delivery date)
      let delayedOrders = 0;
      for (const po of completedOrders) {
        if (po.expectedDeliveryDate) {
          // Find the last receipt date for this PO
          const lastReceipt = await GoodsReceipt.findOne({ poId: po._id }).sort({ receiptDate: -1 }).lean();
          if (lastReceipt && lastReceipt.receiptDate > po.expectedDeliveryDate) {
            delayedOrders++;
          }
        }
      }

      const fulfillmentRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0;

      // Calculate total spend from this vendor
      const spendAgg = await PurchaseOrder.aggregate([
        {
          $match: {
            vendorId: vendor._id,
            status: { $in: [PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED, PO_STATUS.FULLY_RECEIVED] },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
      const totalSpend = spendAgg[0] ? Math.round(spendAgg[0].total * 100) / 100 : 0;

      return {
        vendorId:        vendor._id,
        vendorCode:      vendor.vendorCode,
        vendorName:      vendor.vendorName,
        contactPerson:   vendor.contactPerson,
        email:           vendor.email,
        rating:          vendor.rating,
        leadTimeDays:    vendor.leadTimeDays,
        paymentTerms:    vendor.paymentTerms,
        totalOrders,
        completedOrders: completed,
        cancelledOrders: cancelled,
        delayedOrders,
        onTimeOrders:    completed - delayedOrders,
        fulfillmentRate,
        totalSpend,
        activeOrders:    allOrders.filter(o => [PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED].includes(o.status)).length,
      };
    })
  );

  // Sort by fulfillment rate desc, then by total spend desc
  performanceData.sort((a, b) => b.fulfillmentRate - a.fulfillmentRate || b.totalSpend - a.totalSpend);

  return performanceData;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOW STOCK REPLENISHMENT INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────

const getLowStockInsights = async () => {
  const lowStockItems = await getLowStockItems();

  // For each low-stock item, suggest reorder quantity and find associated vendors
  const insights = await Promise.all(
    lowStockItems.map(async (item) => {
      const suggestedQty = Math.max(
        (item.minimumStockLevel || 0) * 2 - (item.onHandQty || 0),
        10
      );

      // Find the most recent PO for this product to suggest a vendor
      const lastPO = await PurchaseOrder.findOne({
        'items.productId': item.productId._id || item.productId,
        status: { $ne: PO_STATUS.CANCELLED },
      })
        .sort({ createdAt: -1 })
        .populate('vendorId', 'vendorCode vendorName leadTimeDays rating')
        .lean();

      return {
        product: item.productId,
        onHandQty: item.onHandQty,
        reservedQty: item.reservedQty,
        freeToUseQty: item.freeToUseQty,
        minimumStockLevel: item.minimumStockLevel,
        suggestedPurchaseQty: suggestedQty,
        stockStatus: item.stockStatus,
        recommendedVendor: lastPO ? lastPO.vendorId : null,
        lastPONumber: lastPO ? lastPO.poNumber : null,
      };
    })
  );

  return insights;
};

module.exports = {
  getProcurementStats,
  getProcurementAnalytics,
  getSupplierPerformance,
  getLowStockInsights,
};
