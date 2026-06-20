const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_in_prod";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Sign a payload into a JWT access token.
 * @param {object} payload
 * @returns {string} signed JWT
 */
function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws if token is invalid or expired
 */
function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
