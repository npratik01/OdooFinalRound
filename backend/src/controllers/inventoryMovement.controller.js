'use strict';

const movementService = require('../services/inventoryMovement.service');

const getAllMovements = async (req, res, next) => {
  try {
    const { movements, meta } = await movementService.getAllMovements(req.query);
    return res.status(200).json({
      success: true,
      message: 'Inventory movements fetched successfully',
      data: movements,
      meta
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMovements
};
