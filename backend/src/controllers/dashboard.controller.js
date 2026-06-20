'use strict';

const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/apiResponse');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, { message: 'Dashboard stats fetched successfully', data: stats });
  } catch (err) { next(err); }
};

const getInventoryStatus = async (req, res, next) => {
  try {
    const data = await dashboardService.getInventoryStatus();
    return sendSuccess(res, { message: 'Inventory status fetched successfully', data });
  } catch (err) { next(err); }
};

const getRecentProducts = async (req, res, next) => {
  try {
    const products = await dashboardService.getRecentProducts();
    return sendSuccess(res, { message: 'Recent products fetched', data: products, meta: { total: products.length } });
  } catch (err) { next(err); }
};

const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await dashboardService.getLowStockProducts();
    return sendSuccess(res, { message: 'Low stock products fetched', data: products, meta: { total: products.length } });
  } catch (err) { next(err); }
};

module.exports = { getStats, getInventoryStatus, getRecentProducts, getLowStockProducts };
