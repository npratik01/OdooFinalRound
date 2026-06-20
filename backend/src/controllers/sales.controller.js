'use strict';

const salesService = require('../services/sales.service');
const salesDashboardService = require('../services/salesDashboard.service');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');

const createSalesOrder = async (req, res, next) => {
  try {
    const order = await salesService.createSalesOrder(req.body, req.user.userId);
    return sendCreated(res, order, 'Sales Order created successfully in Draft status');
  } catch (error) {
    next(error);
  }
};

const getSalesOrderById = async (req, res, next) => {
  try {
    const order = await salesService.getSalesOrderById(req.params.id);
    return sendSuccess(res, order, 'Sales Order details fetched successfully');
  } catch (error) {
    next(error);
  }
};

const updateSalesOrder = async (req, res, next) => {
  try {
    const order = await salesService.updateSalesOrder(req.params.id, req.body);
    return sendSuccess(res, order, 'Sales Order updated successfully');
  } catch (error) {
    next(error);
  }
};

const confirmSalesOrder = async (req, res, next) => {
  try {
    const order = await salesService.confirmSalesOrder(req.params.id, req.user.userId);
    return sendSuccess(res, order, 'Sales Order confirmed successfully, stock reserved');
  } catch (error) {
    next(error);
  }
};

const cancelSalesOrder = async (req, res, next) => {
  try {
    const order = await salesService.cancelSalesOrder(req.params.id, req.user.userId);
    return sendSuccess(res, order, 'Sales Order cancelled successfully, stock reservation released');
  } catch (error) {
    next(error);
  }
};

const getAllSalesOrders = async (req, res, next) => {
  try {
    const { orders, meta } = await salesService.getAllSalesOrders(req.query);
    return res.status(200).json({
      success: true,
      message: 'Sales Orders fetched successfully',
      data: orders,
      meta
    });
  } catch (error) {
    next(error);
  }
};

const getSalesStats = async (req, res, next) => {
  try {
    const stats = await salesDashboardService.getSalesStats();
    return sendSuccess(res, stats, 'Sales stats fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getSalesAnalytics = async (req, res, next) => {
  try {
    const analytics = await salesDashboardService.getSalesAnalytics();
    return sendSuccess(res, analytics, 'Sales analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSalesOrder,
  getSalesOrderById,
  updateSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
  getAllSalesOrders,
  getSalesStats,
  getSalesAnalytics
};
