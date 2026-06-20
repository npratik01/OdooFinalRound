'use strict';

const dashService = require('../services/manufacturingDashboard.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getDashboardSummary = async (req, res) => {
  try {
    const summary = await dashService.getDashboardSummary();
    sendSuccess(res, 'Manufacturing dashboard summary retrieved', { summary });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getAnalytics = async (req, res) => {
  try {
    const [
      trend,
      statusDistribution,
      topProducts,
      workCenterUtilization,
      productionEfficiency,
    ] = await Promise.all([
      dashService.getMonthlyProductionTrend(),
      dashService.getMOStatusDistribution(),
      dashService.getTopManufacturedProducts(),
      dashService.getWorkCenterUtilization(),
      dashService.getProductionEfficiency(),
    ]);

    sendSuccess(res, 'Manufacturing analytics retrieved', {
      trend,
      statusDistribution,
      topProducts,
      workCenterUtilization,
      productionEfficiency,
    });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

const getWorkCenterUtilization = async (req, res) => {
  try {
    const utilization = await dashService.getWorkCenterUtilization();
    sendSuccess(res, 'Work Center utilization retrieved', { utilization });
  } catch (err) {
    sendError(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  getDashboardSummary,
  getAnalytics,
  getWorkCenterUtilization,
};
