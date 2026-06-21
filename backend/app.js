require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./src/routes");
const { errorHandler } = require("./src/middleware/error.middleware");
const { connectDB } = require("./src/config/db");

const app = express();

app.use(helmet());
// CORS - tighten origin list when provided via env CORS_ORIGINS (comma-separated)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : null;
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || !allowedOrigins) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy: Origin not allowed"), false);
  },
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Rate limiter — generous limits for development; tighten via RATE_LIMIT_MAX env in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 1000, // 1000 req/window per IP (was 100)
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate-limiting for the lightweight /me health-check endpoint
  skip: (req) => req.path === '/api/auth/me',
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
app.use(limiter);



app.use("/api", routes);

app.use(errorHandler);

module.exports = app;
