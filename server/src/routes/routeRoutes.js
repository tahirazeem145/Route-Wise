const express = require('express');
const apiKeyAuth = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateRouteRequest } = require('../middleware/validate');
const { recommendRoutes, refreshRoutes, searchLocations } = require('../controllers/routeController');

const router = express.Router();

// GET /api/routes/locations/search?q=... (Autocomplete & Location Search)
router.get('/locations/search', rateLimiter, searchLocations);

// POST /api/routes/recommend
router.post('/recommend', apiKeyAuth, rateLimiter, validateRouteRequest, recommendRoutes);

// POST /api/routes/refresh
router.post('/refresh', apiKeyAuth, rateLimiter, validateRouteRequest, refreshRoutes);

module.exports = router;

