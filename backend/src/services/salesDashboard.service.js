'use strict';

const SalesOrder = require('../models/SalesOrder.model');
const Customer = require('../models/Customer.model');
const Product = require('../models/Product.model');

/**
 * Get overall Sales KPI Summary metrics.
 */
const getSalesStats = async () => {
  const [
    totalOrdersCount,
    statusBreakdown,
    totalSalesAggregation,
    customerCount
  ] = await Promise.all([
    SalesOrder.countDocuments({ status: { $ne: 'Cancelled' } }),
    SalesOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    SalesOrder.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Customer.countDocuments({ isActive: true })
  ]);

  const totalSalesRevenue = totalSalesAggregation[0] ? totalSalesAggregation[0].total : 0;

  // Convert status breakdown array to object map
  const statusCounts = {
    Draft: 0,
    Confirmed: 0,
    'Partially Delivered': 0,
    'Fully Delivered': 0,
    Cancelled: 0
  };
  statusBreakdown.forEach(item => {
    if (statusCounts[item._id] !== undefined) {
      statusCounts[item._id] = item.count;
    }
  });

  return {
    totalOrdersCount,
    totalSalesRevenue: Math.round(totalSalesRevenue * 100) / 100,
    activeCustomerCount: customerCount,
    statusCounts
  };
};

/**
 * Get detailed analytics, trends, top customers/products.
 */
const getSalesAnalytics = async () => {
  // 1. Top Customers by revenue/volume
  const topCustomers = await SalesOrder.aggregate([
    { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
    { $group: { _id: '$customerId', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerName: '$customer.customerName',
        customerCode: '$customer.customerCode',
        totalSpent: 1,
        orderCount: 1
      }
    }
  ]);

  // 2. Top Selling Products
  const topProducts = await SalesOrder.aggregate([
    { $match: { status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalQty: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' }
      }
    },
    { $sort: { totalQty: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productName: '$product.productName',
        sku: '$product.sku',
        totalQty: 1,
        totalRevenue: 1
      }
    }
  ]);

  // 3. Sales Monthly Trend (for last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const salesTrend = await SalesOrder.aggregate([
    {
      $match: {
        status: { $in: ['Confirmed', 'Partially Delivered', 'Fully Delivered'] },
        orderDate: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$orderDate' },
          month: { $month: '$orderDate' }
        },
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedTrend = salesTrend.map(item => {
    return {
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: Math.round(item.revenue * 100) / 100,
      orders: item.orderCount
    };
  });

  return {
    topCustomers,
    topProducts,
    salesTrend: formattedTrend
  };
};

module.exports = {
  getSalesStats,
  getSalesAnalytics
};
