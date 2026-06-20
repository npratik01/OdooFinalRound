'use strict';

const Product = require('../models/Product.model');
const Inventory = require('../models/Inventory.model');
const { STOCK_STATUS } = require('../constants/stockStatus');

/**
 * Dashboard KPI statistics.
 */
const getStats = async () => {
  const [
    totalProducts,
    activeProducts,
    totalInventoryRecords,
    lowStockCount,
    inventoryRecords,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Inventory.countDocuments({}),
    Inventory.countDocuments({ stockStatus: STOCK_STATUS.LOW_STOCK }),
    Inventory.find({}).populate('productId', 'costPrice salesPrice isActive productType'),
  ]);

  let totalInventoryValue = 0;
  let totalSalesValue = 0;
  inventoryRecords.forEach((inv) => {
    if (inv.productId && inv.productId.isActive) {
      totalInventoryValue += (inv.onHandQty || 0) * (inv.productId.costPrice || 0);
      totalSalesValue += (inv.onHandQty || 0) * (inv.productId.salesPrice || 0);
    }
  });

  return {
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalInventoryRecords,
    lowStockCount,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    totalSalesValue: Math.round(totalSalesValue * 100) / 100,
  };
};

/**
 * Inventory charts data.
 */
const getInventoryStatus = async () => {
  const [normalCount, lowStockCount] = await Promise.all([
    Inventory.countDocuments({ stockStatus: STOCK_STATUS.NORMAL }),
    Inventory.countDocuments({ stockStatus: STOCK_STATUS.LOW_STOCK }),
  ]);

  const productTypeBreakdown = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$productType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Stock value by product type
  const stockValueByType = await Inventory.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    { $match: { 'product.isActive': true } },
    {
      $group: {
        _id: '$product.productType',
        totalValue: { $sum: { $multiply: ['$onHandQty', '$product.costPrice'] } },
        totalQty: { $sum: '$onHandQty' },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  const topProducts = await Inventory.find({})
    .sort({ onHandQty: -1 })
    .limit(10)
    .populate('productId', 'productName sku productType costPrice');

  const filteredTopProducts = topProducts
    .filter((inv) => inv.productId)
    .map((inv) => {
      const freeToUseQty = Math.max(0, (inv.onHandQty || 0) - (inv.reservedQty || 0));
      return {
        productName: inv.productId.productName,
        sku: inv.productId.sku,
        productType: inv.productId.productType,
        onHandQty: inv.onHandQty,
        freeToUseQty,
        stockStatus: inv.stockStatus,
      };
    });

  return {
    stockStatusBreakdown: [
      { name: 'Normal', value: normalCount, color: '#10b981' },
      { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
    ],
    productTypeBreakdown: productTypeBreakdown.map((item) => ({
      name: item._id,
      value: item.count,
    })),
    stockValueByType: stockValueByType.map((item) => ({
      name: item._id,
      value: Math.round(item.totalValue * 100) / 100,
      qty: item.totalQty,
    })),
    topProducts: filteredTopProducts,
  };
};

/**
 * Recent Products — last 10 products created.
 */
const getRecentProducts = async () => {
  const products = await Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('createdBy', 'name')
    .populate('inventory');

  return products.map((p) => {
    const obj = p.toObject({ virtuals: true });
    if (obj.inventory) {
      obj.inventory.freeToUseQty = Math.max(
        0,
        (obj.inventory.onHandQty || 0) - (obj.inventory.reservedQty || 0)
      );
    }
    return obj;
  });
};

/**
 * Low Stock Products — for dashboard table.
 */
const getLowStockProducts = async () => {
  const items = await Inventory.find({ stockStatus: STOCK_STATUS.LOW_STOCK })
    .sort({ onHandQty: 1 })
    .populate({
      path: 'productId',
      select: 'productName sku productType vendor costPrice salesPrice isActive',
      match: { isActive: true },
    });

  return items
    .filter((item) => item.productId !== null)
    .map((item) => ({
      _id: item._id,
      productId: item.productId._id,
      productName: item.productId.productName,
      sku: item.productId.sku,
      productType: item.productId.productType,
      vendor: item.productId.vendor,
      costPrice: item.productId.costPrice,
      onHandQty: item.onHandQty,
      reservedQty: item.reservedQty,
      freeToUseQty: Math.max(0, (item.onHandQty || 0) - (item.reservedQty || 0)),
      minimumStockLevel: item.minimumStockLevel,
      deficit: Math.max(0, item.minimumStockLevel - item.onHandQty),
    }));
};

module.exports = {
  getStats,
  getInventoryStatus,
  getRecentProducts,
  getLowStockProducts,
};
