'use strict';

const procurementService = require('../services/procurementDashboard.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const getDashboard = async (req, res) => {
  try {
    const stats = await procurementService.getProcurementStats();
    return sendSuccess(res, { data: stats, message: 'Procurement dashboard data retrieved' });
  } catch (err) {
    logger.error('getProcurementDashboard error:', err);
    return sendError(res, { message: 'Failed to retrieve procurement dashboard' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const analytics = await procurementService.getProcurementAnalytics();
    return sendSuccess(res, { data: analytics, message: 'Procurement analytics retrieved' });
  } catch (err) {
    logger.error('getProcurementAnalytics error:', err);
    return sendError(res, { message: 'Failed to retrieve procurement analytics' });
  }
};

const getSupplierPerformance = async (req, res) => {
  try {
    const performance = await procurementService.getSupplierPerformance();
    return sendSuccess(res, { data: performance, message: 'Supplier performance data retrieved' });
  } catch (err) {
    logger.error('getSupplierPerformance error:', err);
    return sendError(res, { message: 'Failed to retrieve supplier performance' });
  }
};

const getLowStockInsights = async (req, res) => {
  try {
    const insights = await procurementService.getLowStockInsights();
    return sendSuccess(res, { data: insights, message: 'Low stock insights retrieved' });
  } catch (err) {
    logger.error('getLowStockInsights error:', err);
    return sendError(res, { message: 'Failed to retrieve low stock insights' });
  }
};

module.exports = { getDashboard, getAnalytics, getSupplierPerformance, getLowStockInsights };
