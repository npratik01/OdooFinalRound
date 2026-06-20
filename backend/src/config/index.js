/**
 * Centralised application configuration loaded from environment variables.
 */
const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,

  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/mini-erp",

  jwtSecret: process.env.JWT_SECRET || "fallback_secret_key_change_in_prod",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

module.exports = config;
