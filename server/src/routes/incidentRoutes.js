const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Submit structured incident report
router.post('/', incidentController.createReport);

// Retrieve nearby active reports with distance and status
router.get('/nearby', incidentController.getNearbyReports);

// Cast confirmation / denial vote on an incident report
router.post('/:id/votes', incidentController.voteReport);

module.exports = router;
