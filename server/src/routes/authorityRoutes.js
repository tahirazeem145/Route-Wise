/**
 * Authority Routes (F5)
 * Protected routes for municipal traffic managers and police dispatchers.
 */

const express = require('express');
const router = express.Router();
const authorityAuth = require('../middleware/authorityAuth');
const authorityController = require('../controllers/authorityController');

// All authority endpoints require admin authorization
router.use(authorityAuth);

router.get('/hotspots', authorityController.getHotspots);
router.post('/reports/:id/resolve', authorityController.resolveIncident);

module.exports = router;
