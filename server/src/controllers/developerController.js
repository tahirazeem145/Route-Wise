const config = require('../config');
const { successResponse } = require('../utils/response');

function getDeveloperStatus(req, res) {
  // Safe status - Never leak actual secrets or raw keys
  return successResponse(res, {
    status: 'operational',
    service: 'SmartRoute AI Developer Gateway',
    environment: config.nodeEnv,
    auth: {
      mechanism: 'Header Authentication',
      requiredHeader: 'X-API-Key',
      authenticated: Boolean(req.apiKey),
      keyLabel: req.apiKey?.label || 'Unauthenticated Session',
      keyPrefix: req.apiKey?.prefix || 'none'
    },
    rateLimiting: {
      windowSeconds: config.rateLimit.windowMs / 1000,
      maxRequestsPerWindow: config.rateLimit.max
    },
    routingEngine: {
      provider: 'TomTom Routing & Traffic API',
      keyConfigured: config.tomtom.hasKey,
      rankingWeights: {
        travelTime: config.ranking.weightTime,
        trafficDelay: config.ranking.weightDelay,
        distance: config.ranking.weightDistance
      }
    }
  });
}

module.exports = {
  getDeveloperStatus
};
