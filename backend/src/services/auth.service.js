const crypto = require('crypto');
const User = require("../models/user.model");
const RefreshToken = require('../models/refreshToken.model');
const { sign } = require("../utils/jwt");
const config = require('../config');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + msFromString(config.refreshTokenExpiresIn));
  await RefreshToken.create({ userId, tokenHash, expiresAt });
  return token;
}

function msFromString(str) {
  // supports simple formats like '15m', '7d'
  const num = parseInt(str.slice(0, -1), 10);
  const unit = str.slice(-1);
  if (unit === 'm') return num * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  return num;
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive)
    throw { status: 401, message: "Invalid credentials" };
  const valid = await user.comparePassword(password);
  if (!valid) throw { status: 401, message: "Invalid credentials" };
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const accessToken = sign(payload);
  const refreshToken = await createRefreshToken(user._id);
  return { user: user.toObject(), accessToken, refreshToken };
}

async function register(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) throw { status: 400, message: "Email already exists" };
  const user = await User.create(payload);
  const payloadToken = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const accessToken = sign(payloadToken);
  const refreshToken = await createRefreshToken(user._id);
  return { user: user.toObject(), accessToken, refreshToken };
}

async function refreshTokens(providedToken) {
  if (!providedToken) throw { status: 400, message: 'Refresh token required' };
  const tokenHash = hashToken(providedToken);
  const rt = await RefreshToken.findOne({ tokenHash });
  if (!rt || rt.revoked) throw { status: 401, message: 'Invalid refresh token' };
  if (rt.expiresAt < new Date()) throw { status: 401, message: 'Refresh token expired' };
  const user = await User.findById(rt.userId);
  if (!user) throw { status: 401, message: 'Invalid refresh token' };
  const payload = { userId: user._id.toString(), email: user.email, role: user.role };
  const accessToken = sign(payload);
  // Optionally rotate refresh token: revoke old and create new
  rt.revoked = true;
  await rt.save();
  const newRefreshToken = await createRefreshToken(user._id);
  return { accessToken, refreshToken: newRefreshToken };
}

async function revokeRefreshToken(providedToken) {
  if (!providedToken) return;
  const tokenHash = hashToken(providedToken);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
}

module.exports = { login, register, refreshTokens, revokeRefreshToken };
