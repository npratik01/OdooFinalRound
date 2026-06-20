const authService = require("../services/auth.service");
const { formatSuccessResponse } = require("../utils/responseHelper");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return formatSuccessResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "Logged in",
    );
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const payload = req.body;
    const result = await authService.register(payload);
    return formatSuccessResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "Registered",
    );
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    return formatSuccessResponse(res, { user: req.user });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    return formatSuccessResponse(
      res,
      { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      "Tokens refreshed",
    );
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    await authService.revokeRefreshToken(refreshToken);
    return formatSuccessResponse(res, {}, "Logged out");
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, me, refresh, logout };
