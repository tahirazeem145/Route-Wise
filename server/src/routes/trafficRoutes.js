const express = require('express');
const {
  getTrafficFlowTile,
  getTrafficIncidentsTile,
  getTrafficStatus,
  setTomTomKey,
  removeTomTomKey
} = require('../controllers/trafficController');

const router = express.Router();

// GET /api/traffic/status
router.get('/status', getTrafficStatus);

// POST /api/traffic/key - Verify and set TomTom provider key
router.post('/key', setTomTomKey);

// DELETE /api/traffic/key - Clear TomTom key and revert to demo simulation
router.delete('/key', removeTomTomKey);

// GET /api/traffic/tiles/:z/:x/:y.png - Live traffic flow overlay
router.get('/tiles/:z/:x/:y.png', getTrafficFlowTile);

// GET /api/traffic/incidents/:z/:x/:y.png - Road closures & hazard symbols
router.get('/incidents/:z/:x/:y.png', getTrafficIncidentsTile);

module.exports = router;
