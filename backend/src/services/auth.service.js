'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Generates a signed JWT token for a user.
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Authenticates a user by email and password.
 * @returns {{ user, token }}
 */
const login = async (email, password) => {
  // Find user with password (select: false by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: 'Your account has been deactivated. Contact an administrator.' };
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  // Update lastLogin
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
  };
};

/**
 * Returns current user by ID.
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password -__v');
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  return user;
};

module.exports = { login, getMe, generateToken };
