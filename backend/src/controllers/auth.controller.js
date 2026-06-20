'use strict';

const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, {
      message: 'Login successful',
      data: { token: result.token, user: result.user },
    });
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, { statusCode: err.statusCode, message: err.message });
    }
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    return sendSuccess(res, { message: 'User fetched successfully', data: user });
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, { statusCode: err.statusCode, message: err.message });
    }
    next(err);
  }
};

const logout = (req, res) => {
  // JWT is stateless; logout is handled client-side by deleting the token.
  // Future: implement token blacklist with Redis for production.
  return sendSuccess(res, { message: 'Logged out successfully' });
};

module.exports = { login, getMe, logout };
