const config = require('../config');
const { successResponse } = require('../utils/response');

function getHealth(req, res) {
  return successResponse(res, {
    status: 'healthy',
    service: 'SmartRoute AI Backend API',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    provider: {
      name: 'TomTom Routing & Traffic',
      connected: true,
      hasRealKey: config.tomtom.hasKey
    }
  });
}

module.exports = {
  getHealth
};
