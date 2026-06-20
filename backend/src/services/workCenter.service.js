'use strict';

const WorkCenter = require('../models/WorkCenter.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

// ─── Auto-generate Work Center Code ──────────────────────────────────────────

const generateWorkCenterCode = async () => {
  const last = await WorkCenter.findOne({}, { code: 1 }, { sort: { code: -1 } });
  let seq = 1;
  if (last && last.code) {
    const match = last.code.match(/WC(\d+)/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `WC${String(seq).padStart(3, '0')}`;
};

// ─── CREATE Work Center ───────────────────────────────────────────────────────

const createWorkCenter = async (data, userId) => {
  const code = await generateWorkCenterCode();

  const workCenter = new WorkCenter({
    code,
    name: data.name,
    description: data.description || '',
    capacity: data.capacity || 0,
    costPerHour: data.costPerHour || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdBy: userId,
  });

  await workCenter.save();
  logger.info(`Work Center created: ${code} — ${data.name}`);
  return WorkCenter.findById(workCenter._id).populate('createdBy', 'name email');
};

// ─── GET ALL Work Centers ─────────────────────────────────────────────────────

const getAllWorkCenters = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);

  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.search) filter.name = new RegExp(query.search, 'i');

  const [workCenters, total] = await Promise.all([
    WorkCenter.find(filter)
      .sort(sort || { name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name'),
    WorkCenter.countDocuments(filter),
  ]);

  return {
    workCenters,
    meta: buildPaginationMeta(total, page, limit),
  };
};

// ─── GET Work Center BY ID ────────────────────────────────────────────────────

const getWorkCenterById = async (id) => {
  const wc = await WorkCenter.findById(id).populate('createdBy', 'name email role');
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };
  return wc;
};

// ─── UPDATE Work Center ───────────────────────────────────────────────────────

const updateWorkCenter = async (id, updateData) => {
  const wc = await WorkCenter.findById(id);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };

  if (updateData.name !== undefined) wc.name = updateData.name;
  if (updateData.description !== undefined) wc.description = updateData.description;
  if (updateData.capacity !== undefined) wc.capacity = updateData.capacity;
  if (updateData.costPerHour !== undefined) wc.costPerHour = updateData.costPerHour;
  if (updateData.isActive !== undefined) wc.isActive = updateData.isActive;

  await wc.save();
  logger.info(`Work Center updated: ${wc.code}`);
  return WorkCenter.findById(wc._id).populate('createdBy', 'name email');
};

// ─── TOGGLE Active ────────────────────────────────────────────────────────────

const toggleWorkCenterActive = async (id) => {
  const wc = await WorkCenter.findById(id);
  if (!wc) throw { statusCode: 404, message: 'Work Center not found' };

  wc.isActive = !wc.isActive;
  await wc.save();
  logger.info(`Work Center ${wc.code} toggled to: ${wc.isActive ? 'active' : 'inactive'}`);
  return WorkCenter.findById(wc._id).populate('createdBy', 'name email');
};

module.exports = {
  createWorkCenter,
  getAllWorkCenters,
  getWorkCenterById,
  updateWorkCenter,
  toggleWorkCenterActive,
};
