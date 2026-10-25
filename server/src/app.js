const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const { errorResponse } = require('./utils/response');

const healthRoutes = require('./routes/healthRoutes');
const developerRoutes = require('./routes/developerRoutes');
const routeRoutes = require('./routes/routeRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const authorityRoutes = require('./routes/authorityRoutes');
const docRoutes = require('./routes/docRoutes');

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: true, // Seamlessly accepts requests from any external client, mobile app, or origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'Accept', 'X-Authority-Role', 'X-Authority-Officer-Id']
}));

app.use(express.json({ limit: '100kb' }));

// Request logging (sanitized)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Documentation & Hackathon Deliverables Hub (MRD & PRD)
app.use('/docs', docRoutes);

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/reports', incidentRoutes);
app.use('/api/authority', authorityRoutes);

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'MALFORMED_JSON', 'Malformed JSON in request body.', 400);
  }

  logger.error('Unhandled server exception:', err.message);
  return errorResponse(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal server error occurred.',
    500,
    err.stack
  );
});

module.exports = app;
