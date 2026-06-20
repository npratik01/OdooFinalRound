'use strict';

const deliveryService = require('../services/delivery.service');
const { sendSuccess, sendCreated } = require('../utils/responseHelper');

const processDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.processDelivery(req.body, req.user._id);
    return sendCreated(res, delivery, 'Delivery dispatched successfully, inventory deducted');
  } catch (error) {
    next(error);
  }
};

const getAllDeliveries = async (req, res, next) => {
  try {
    const { deliveries, meta } = await deliveryService.getAllDeliveries(req.query);
    return res.status(200).json({
      success: true,
      message: 'Deliveries fetched successfully',
      data: deliveries,
      meta
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processDelivery,
  getAllDeliveries
};
