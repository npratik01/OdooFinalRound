'use strict';

const User = require('../models/User.model');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const getUsers = async (query = {}) => {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;
  if (query.role) filter.role = query.role;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).select('-password -__v'),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-password -__v');
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user;
};

const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw { statusCode: 409, message: 'A user with this email already exists' };
  const user = await User.create(data);
  return User.findById(user._id).select('-password -__v');
};

const updateUser = async (id, data) => {
  const user = await User.findById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };

  if (data.password) {
    user.password = data.password;
    delete data.password;
  }

  // Prevent email modification if provided (use as immutable)
  delete data.email;

  Object.assign(user, data);
  await user.save();
  return User.findById(user._id).select('-password -__v');
};

/**
 * PATCH /api/users/:id/status — toggle isActive
 */
const updateUserStatus = async (id, isActive, requestingUserId) => {
  if (id === requestingUserId && isActive === false) {
    throw { statusCode: 400, message: 'You cannot deactivate your own account' };
  }

  const user = await User.findById(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });
  return User.findById(user._id).select('-password -__v');
};

const deleteUser = async (id, requestingUserId) => {
  return updateUserStatus(id, false, requestingUserId);
};

module.exports = { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser };
