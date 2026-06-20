'use strict';

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return sendSuccess(res, {
      message: 'Login successful',
      data: { token: result.accessToken, user: result.user },
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await authService.register(payload);
    return sendSuccess(res, {
      message: 'Registered successfully',
      data: { token: result.accessToken, user: result.user },
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      message: 'User fetched successfully',
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    return sendSuccess(res, {
      message: 'Tokens refreshed',
      data: { token: tokens.accessToken, refreshToken: tokens.refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    await authService.revokeRefreshToken(refreshToken);
    return sendSuccess(res, {
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, me, refresh, logout };

