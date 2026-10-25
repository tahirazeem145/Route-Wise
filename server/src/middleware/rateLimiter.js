const config = require('../config');
const { errorResponse } = require('../utils/response');

const requestLog = new Map();

// Evict expired entries to prevent memory leaks over long uptime
function pruneExpiredEntries(windowStart) {
  for (const [key, tsList] of requestLog.entries()) {
    const active = tsList.filter(ts => ts > windowStart);
    if (active.length === 0) {
      requestLog.delete(key);
    } else if (active.length !== tsList.length) {
      requestLog.set(key, active);
    }
  }
}

function rateLimiter(req, res, next) {
  // Use API key prefix if authenticated, otherwise client IP
  const clientIdentifier = (req.apiKey && req.apiKey.prefix) || req.ip || 'global';
  const now = Date.now();
  const windowStart = now - config.rateLimit.windowMs;

  // Periodic pruning when map exceeds threshold
  if (requestLog.size > 100) {
    pruneExpiredEntries(windowStart);
  }

  const timestamps = (requestLog.get(clientIdentifier) || []).filter(ts => ts > windowStart);

  if (timestamps.length >= config.rateLimit.max) {
    const oldestTimestamp = timestamps[0];
    const retryAfterSeconds = Math.ceil((oldestTimestamp + config.rateLimit.windowMs - now) / 1000);
    res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));

    return errorResponse(
      res,
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded: Maximum ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 1000}s. Please retry in ${retryAfterSeconds}s.`,
      429
    );
  }

  timestamps.push(now);
  requestLog.set(clientIdentifier, timestamps);
  next();
}

function clearRateLimits() {
  requestLog.clear();
}

module.exports = {
  rateLimiter,
  clearRateLimits
};
