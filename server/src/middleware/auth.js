const { validateKey } = require('../services/keyManagerService');
const { errorResponse } = require('../utils/response');

function apiKeyAuth(req, res, next) {
  const keyFromHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const keyFromQuery = req.query && (req.query.apiKey || req.query.api_key || req.query.key);

  const keyToTest = keyFromHeader || bearerKey || keyFromQuery;

  if (!keyToTest) {
    return errorResponse(
      res,
      'MISSING_API_KEY',
      'Authentication required: Please provide an API key via X-API-Key header, Authorization Bearer token, or apiKey query parameter.',
      401
    );
  }

  const validation = validateKey(keyToTest);

  if (!validation.valid) {
    return errorResponse(
      res,
      'INVALID_API_KEY',
      'The provided API key is invalid or unrecognized.',
      401
    );
  }

  req.apiKey = {
    label: validation.label,
    prefix: validation.prefix
  };

  next();
}

module.exports = apiKeyAuth;
