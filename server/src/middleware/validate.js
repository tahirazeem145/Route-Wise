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
    let lat = coord.lat ?? coord.latitude;
    let lng = coord.lng ?? coord.longitude ?? coord.lon;

    if (lat === undefined && coord.coordinates) {
      lat = coord.coordinates.lat ?? coord.coordinates.latitude;
      lng = coord.coordinates.lng ?? coord.coordinates.longitude ?? coord.coordinates.lon;
    }
    if (lat === undefined && coord.position) {
      lat = coord.position.lat ?? coord.position.latitude;
      lng = coord.position.lon ?? coord.position.lng ?? coord.position.longitude;
    }

    const nLat = Number(lat);
    const nLng = Number(lng);
    return (
      !isNaN(nLat) &&
      !isNaN(nLng) &&
      nLat >= -90 &&
      nLat <= 90 &&
      nLng >= -180 &&
      nLng <= 180
    );
  }
  return false;
}

function isValidLocationInput(val) {
  if (!val) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Allow valid coordinate strings or freeform location/address names up to 500 characters
    return trimmed.length >= 2 && trimmed.length <= 500;
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
      'Source must be a location name (2-500 characters) or valid coordinate object { lat, lng }.',
      400
    );
  }

  if (!isValidLocationInput(destination)) {
    return errorResponse(
      res,
      'INVALID_DESTINATION',
      'Destination must be a location name (2-500 characters) or valid coordinate object { lat, lng }.',
      400
    );
  }


  // Prevent identical source and destination (both strings or both coordinates)
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

  // Check if both are coordinate objects/arrays with identical lat/lng
  const extractCoord = (val) => {
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val) && val.length >= 2) return [Number(val[0]), Number(val[1])];
      const lat = Number(val.lat ?? val.latitude);
      const lng = Number(val.lng ?? val.longitude ?? val.lon);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
  };

  const srcCoord = extractCoord(source);
  const dstCoord = extractCoord(destination);
  if (srcCoord && dstCoord && srcCoord[0] === dstCoord[0] && srcCoord[1] === dstCoord[1]) {
    return errorResponse(
      res,
      'IDENTICAL_LOCATIONS',
      'Source and destination coordinates cannot be identical.',
      400
    );
  }

  next();
}

module.exports = {
  validateRouteRequest,
  isValidCoordinate,
  isValidLocationInput
};
