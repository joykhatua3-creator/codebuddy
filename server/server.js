const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const app = express();

// Trust reverse proxy (Render, Cloudflare, Vercel) for accurate client IP detection
app.set('trust proxy', 1);

// Disable X-Powered-By header for security and footprint reduction
app.disable('x-powered-by');

// Enable HTTP response compression (gzip / deflate) for faster response delivery
app.use(compression());

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, Postman, SSR)
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, '');

      // Always permit localhost, vercel deployments, or explicitly configured client URLs
      const isAllowed =
        allowedOrigins.includes(normalized) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized) ||
        /\.vercel\.app$/.test(normalized) ||
        normalized === 'https://vercel.app';

      if (isAllowed || process.env.NODE_ENV !== 'production' || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      // Permissive fallback so legitimate client deployments are not blocked
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limit: 1000 requests per 15 minutes in production (skipped in development or health check)
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 1000,
  skip: (req) =>
    process.env.NODE_ENV === 'development' ||
    req.path === '/api/health' ||
    req.path === '/api/health/ai' ||
    req.path === '/health',
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalRateLimit);

// ─── Body & Cookie Parsing ───────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get(['/api/health', '/health'], (req, res) => {
  const mongoose = require('mongoose');
  const { getAiHealthInfo } = require('./services/aiService');
  res.json({
    success: true,
    data: {
      status: 'running',
      dbConnected: mongoose.connection.readyState === 1,
      ai: getAiHealthInfo(),
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    },
  });
});

app.get('/api/health/ai', (req, res) => {
  const { getAiHealthInfo } = require('./services/aiService');
  const ai = getAiHealthInfo();
  res.json({
    success: true,
    data: {
      status: ai.apiKeySet ? 'configured' : 'missing_api_key',
      ...ai,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/assignments', require('./routes/assignments'));

// ─── 404 & Error Handling ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
