const { errorResponse } = require('../utils/response');

function isValidCoordinate(coord) {
  if (!coord) return false;
  if (Array.isArray(coord)) {
    if (coord.length < 2) return false;
    const lat = Number(coord[0]);
    const lng = Number(coord[1]);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  if (typeof coord === 'object') {
    const lat = Number(coord.lat ?? coord.latitude);
    const lng = Number(coord.lng ?? coord.longitude ?? coord.lon);
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
  return false;
}

function isValidLocationInput(val) {
  if (!val) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  }
  if (typeof val === 'object') {
    return isValidCoordinate(val);
  }
  return false;
}

function validateRouteRequest(req, res, next) {
  const { source, destination } = req.body || {};

  if (!source && !destination) {
    return errorResponse(
      res,
      'INVALID_REQUEST_BODY',
      'Both "source" and "destination" fields are required in the request body.',
      400
    );
  }

  if (!source) {
    return errorResponse(
      res,
      'MISSING_SOURCE',
      'The "source" location is required.',
      400
    );
  }

  if (!destination) {
    return errorResponse(
      res,
      'MISSING_DESTINATION',
      'The "destination" location is required.',
      400
    );
  }

  if (!isValidLocationInput(source)) {
    return errorResponse(
      res,
      'INVALID_SOURCE',
      'Source must be a location name (2-100 characters) or valid coordinate object { lat, lng }.',
      400
    );
  }

  if (!isValidLocationInput(destination)) {
    return errorResponse(
      res,
      'INVALID_DESTINATION',
      'Destination must be a location name (2-100 characters) or valid coordinate object { lat, lng }.',
      400
    );
  }

  // Prevent identical source and destination
  if (typeof source === 'string' && typeof destination === 'string') {
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return errorResponse(
        res,
        'IDENTICAL_LOCATIONS',
        'Source and destination locations cannot be identical.',
        400
      );
    }
  }

  next();
}

module.exports = {
  validateRouteRequest,
  isValidCoordinate,
  isValidLocationInput
};
