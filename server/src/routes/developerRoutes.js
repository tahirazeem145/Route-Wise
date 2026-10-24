const express = require('express');
const apiKeyAuth = require('../middleware/auth');
const { getDeveloperStatus } = require('../controllers/developerController');

const router = express.Router();

// GET /api/developer/status - Protected by API key
router.get('/status', apiKeyAuth, getDeveloperStatus);

module.exports = router;
