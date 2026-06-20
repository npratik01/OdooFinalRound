'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendUnauthorized } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendUnauthorized(res, 'Access token is required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendUnauthorized(res, 'Access token has expired. Please login again.');
      }
      if (err.name === 'JsonWebTokenError') {
        return sendUnauthorized(res, 'Invalid access token');
      }
      throw err;
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('_id name email role isActive');

    if (!user) {
      return sendUnauthorized(res, 'User associated with this token no longer exists');
    }

    if (!user.isActive) {
      return sendUnauthorized(res, 'Your account has been deactivated. Contact an administrator.');
    }

    req.user = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(error);
  }
};

module.exports = { authenticate };
