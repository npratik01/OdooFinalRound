'use strict';

const userService = require('../services/user.service');
const { sendSuccess, sendCreated, sendError } = require('../utils/apiResponse');

const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query);
    return sendSuccess(res, { message: 'Users fetched successfully', data: result.users, meta: result.meta });
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, { message: 'User fetched successfully', data: user });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    return sendCreated(res, { message: 'User created successfully', data: user });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendSuccess(res, { message: 'User updated successfully', data: user });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, { statusCode: 400, message: 'isActive must be a boolean value' });
    }
    const user = await userService.updateUserStatus(req.params.id, isActive, req.user.userId);
    return sendSuccess(res, {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.userId);
    return sendSuccess(res, { message: 'User deactivated successfully' });
  } catch (err) {
    if (err.statusCode) return sendError(res, { statusCode: err.statusCode, message: err.message });
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser };
