const config = require('../config');
const logger = require('../utils/logger');

// Verified fallback coordinates for common demo locations
const KNOWN_LOCATIONS = {
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli, Tamil Nadu, India' },
  'trichy': { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli, Tamil Nadu, India' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, name: 'Coimbatore, Tamil Nadu, India' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu, India' },
  'madurai': { lat: 9.9252, lng: 78.1198, name: 'Madurai, Tamil Nadu, India' },
  'salem': { lat: 11.6643, lng: 78.1460, name: 'Salem, Tamil Nadu, India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
  'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala, India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana, India' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi, India' }
};

function parseCoordinateString(query) {
  if (typeof query !== 'string') return null;
  const match = query.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    }
  }
  return null;
}

async function geocodeLocation(input) {
  // 1. Direct coordinate array [lat, lng]
  if (Array.isArray(input) && input.length >= 2) {
    const lat = Number(input[0]);
    const lng = Number(input[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    }
  }

  // 2. Direct coordinate object input ({ lat, lng } or { latitude, longitude })
  if (typeof input === 'object' && input !== null) {
    const lat = Number(input.lat ?? input.latitude);
    const lng = Number(input.lng ?? input.longitude ?? input.lon);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        name: input.name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    }
  }

  if (typeof input !== 'string') {
    throw new Error('Invalid location query format.');
  }

  const query = input.trim();

  // 2. Comma-separated coordinates check
  const directCoords = parseCoordinateString(query);
  if (directCoords) {
    return directCoords;
  }

  // 3. TomTom Geocoding API if key configured
  if (config.tomtom.hasKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.tomtom.timeoutMs);

      const endpoint = `${config.tomtom.baseUrl}/search/2/geocode/${encodeURIComponent(query)}.json?key=${config.tomtom.apiKey}&limit=1`;
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const firstResult = data.results && data.results[0];
        if (firstResult && firstResult.position) {
          return {
            lat: Number(firstResult.position.lat.toFixed(5)),
            lng: Number(firstResult.position.lon.toFixed(5)),
            name: firstResult.address?.freeformAddress || query
          };
        }
      } else {
        logger.warn(`TomTom geocoding failed with status ${response.status} for query "${query}"`);
      }
    } catch (err) {
      logger.warn(`TomTom geocoding request error for "${query}": ${err.message}`);
    }
  }

  // 4. Known offline / fallback dictionary
  const normalizedKey = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      logger.info(`Geocoded "${query}" using validated coordinate database.`);
      return { ...value };
    }
  }

  throw new Error(`Location "${query}" could not be resolved to coordinates. Please enter a recognized city or "lat, lng" coordinates.`);
}

module.exports = {
  geocodeLocation,
  KNOWN_LOCATIONS
};
