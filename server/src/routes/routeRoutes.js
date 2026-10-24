const express = require('express');
const apiKeyAuth = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateRouteRequest } = require('../middleware/validate');
const { recommendRoutes, refreshRoutes } = require('../controllers/routeController');

const router = express.Router();

// POST /api/routes/recommend
router.post('/recommend', apiKeyAuth, rateLimiter, validateRouteRequest, recommendRoutes);

// POST /api/routes/refresh
router.post('/refresh', apiKeyAuth, rateLimiter, validateRouteRequest, refreshRoutes);

module.exports = router;
