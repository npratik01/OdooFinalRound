'use strict';

const WorkCenter = require('../models/WorkCenter.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─── AUTO-GENERATE WORK CENTER CODE ──────────────────────────────────────────

const generateWorkCenterCode = async (name) => {
  const prefix = name.toUpperCase().replace(/\s+/g, '_').slice(0, 6);
  const count  = await WorkCenter.countDocuments({
    workCenterCode: { $regex: `^${prefix}` },
  });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// ─── CREATE WORK CENTER ───────────────────────────────────────────────────────

const createWorkCenter = async (data) => {
  const code = await generateWorkCenterCode(data.workCenterName);

  const wc = new WorkCenter({
    workCenterCode:      code,
    workCenterName:      data.workCenterName,
    description:         data.description         || '',
    capacityPerDay:      data.capacityPerDay       ?? 8,
    efficiencyPercentage:data.efficiencyPercentage ?? 85,
    isActive:            true,
  });

  await wc.save();
  logger.info(`Work Center created: ${code}`);
  return wc;
};

// ─── GET ALL WORK CENTERS ─────────────────────────────────────────────────────

const getAllWorkCenters = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) filter.workCenterName = new RegExp(query.search, 'i');

  const [workCenters, total] = await Promise.all([
    WorkCenter.find(filter).sort(sort || { createdAt: -1 }).skip(skip).limit(limit),
    WorkCenter.countDocuments(filter),
  ]);

  return { workCenters, meta: buildPaginationMeta(total, page, limit) };
};

// ─── GET WORK CENTER BY ID ────────────────────────────────────────────────────

const getWorkCenterById = async (id) => {
  const wc = await WorkCenter.findById(id);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };
  return wc;
};

// ─── UPDATE WORK CENTER ───────────────────────────────────────────────────────

const updateWorkCenter = async (id, data) => {
  const wc = await WorkCenter.findById(id);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };

  if (data.workCenterName      !== undefined) wc.workCenterName      = data.workCenterName;
  if (data.description         !== undefined) wc.description         = data.description;
  if (data.capacityPerDay      !== undefined) wc.capacityPerDay      = data.capacityPerDay;
  if (data.efficiencyPercentage!== undefined) wc.efficiencyPercentage= data.efficiencyPercentage;

  await wc.save();
  return wc;
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────

const toggleWorkCenterStatus = async (id) => {
  const wc = await WorkCenter.findById(id);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };

  wc.isActive = !wc.isActive;
  await wc.save();
  logger.info(`Work Center ${wc.workCenterCode} status toggled: ${wc.isActive}`);
  return wc;
};

module.exports = {
  createWorkCenter,
  getAllWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterStatus,
};
