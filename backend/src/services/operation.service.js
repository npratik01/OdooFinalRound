'use strict';

const Operation = require('../models/Operation.model');
const WorkCenter = require('../models/WorkCenter.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─── AUTO-GENERATE OPERATION CODE ────────────────────────────────────────────

const generateOperationCode = async (name) => {
  const prefix = name.toUpperCase().replace(/\s+/g, '_').slice(0, 6);
  const count  = await Operation.countDocuments({
    operationCode: { $regex: `^${prefix}` },
  });
  return `OPS-${prefix}-${String(count + 1).padStart(3, '0')}`;
};

const populateOperation = (id) =>
  Operation.findById(id).populate('workCenterId', 'workCenterCode workCenterName efficiencyPercentage');

// ─── CREATE OPERATION ─────────────────────────────────────────────────────────

const createOperation = async (data) => {
  const wc = await WorkCenter.findById(data.workCenterId);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };
  if (!wc.isActive) throw { statusCode: 400, message: 'Cannot assign an inactive Work Center' };

  const code = await generateOperationCode(data.operationName);

  const op = new Operation({
    operationCode:          code,
    operationName:          data.operationName,
    description:            data.description             || '',
    standardDurationMinutes:data.standardDurationMinutes ?? 60,
    workCenterId:           data.workCenterId,
    sequence:               data.sequence                ?? 1,
    isActive:               true,
  });

  await op.save();
  logger.info(`Operation created: ${code}`);
  return populateOperation(op._id);
};

// ─── GET ALL OPERATIONS ───────────────────────────────────────────────────────

const getAllOperations = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.isActive    !== undefined) filter.isActive    = query.isActive === 'true';
  if (query.workCenterId) filter.workCenterId = query.workCenterId;
  if (query.search) filter.operationName = new RegExp(query.search, 'i');

  const [operations, total] = await Promise.all([
    Operation.find(filter)
      .sort(sort || { sequence: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('workCenterId', 'workCenterCode workCenterName'),
    Operation.countDocuments(filter),
  ]);

  return { operations, meta: buildPaginationMeta(total, page, limit) };
};

// ─── GET OPERATION BY ID ──────────────────────────────────────────────────────

const getOperationById = async (id) => {
  const op = await populateOperation(id);
  if (!op) throw { statusCode: 404, message: 'Operation not found' };
  return op;
};

// ─── UPDATE OPERATION ─────────────────────────────────────────────────────────

const updateOperation = async (id, data) => {
  const op = await Operation.findById(id);
  if (!op) throw { statusCode: 404, message: 'Operation not found' };

  if (data.workCenterId) {
    const wc = await WorkCenter.findById(data.workCenterId);
    if (!wc) throw { statusCode: 404, message: 'Work Center not found' };
    op.workCenterId = data.workCenterId;
  }

  if (data.operationName          !== undefined) op.operationName          = data.operationName;
  if (data.description            !== undefined) op.description            = data.description;
  if (data.standardDurationMinutes!== undefined) op.standardDurationMinutes= data.standardDurationMinutes;
  if (data.sequence               !== undefined) op.sequence               = data.sequence;
  if (data.isActive               !== undefined) op.isActive               = data.isActive;

  await op.save();
  return populateOperation(op._id);
};

module.exports = {
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperation,
};
