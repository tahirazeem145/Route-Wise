const config = require('../config');
const logger = require('../utils/logger');

// Verified fallback coordinates for common cities, transit junctions, and corridors
const KNOWN_LOCATIONS = {
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli, Tamil Nadu, India' },
  'trichy': { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli, Tamil Nadu, India' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, name: 'Coimbatore, Tamil Nadu, India' },
  'kovai': { lat: 11.0168, lng: 76.9558, name: 'Coimbatore, Tamil Nadu, India' },
  'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu, India' },
  'madras': { lat: 13.0827, lng: 80.2707, name: 'Chennai, Tamil Nadu, India' },
  'madurai': { lat: 9.9252, lng: 78.1198, name: 'Madurai, Tamil Nadu, India' },
  'salem': { lat: 11.6643, lng: 78.1460, name: 'Salem, Tamil Nadu, India' },
  'tiruppur': { lat: 11.1085, lng: 77.3411, name: 'Tiruppur, Tamil Nadu, India' },
  'erode': { lat: 11.3410, lng: 77.7172, name: 'Erode, Tamil Nadu, India' },
  'thanjavur': { lat: 10.7870, lng: 79.1378, name: 'Thanjavur, Tamil Nadu, India' },
  'tanjore': { lat: 10.7870, lng: 79.1378, name: 'Thanjavur, Tamil Nadu, India' },
  'dindigul': { lat: 10.3673, lng: 77.9803, name: 'Dindigul, Tamil Nadu, India' },
  'tirunelveli': { lat: 8.7139, lng: 77.7567, name: 'Tirunelveli, Tamil Nadu, India' },
  'nellai': { lat: 8.7139, lng: 77.7567, name: 'Tirunelveli, Tamil Nadu, India' },
  'vellore': { lat: 12.9165, lng: 79.1325, name: 'Vellore, Tamil Nadu, India' },
  'pondicherry': { lat: 11.9416, lng: 79.8083, name: 'Puducherry, India' },
  'puducherry': { lat: 11.9416, lng: 79.8083, name: 'Puducherry, India' },
  'hosur': { lat: 12.7409, lng: 77.8253, name: 'Hosur, Tamil Nadu, India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka, India' },
  'mysuru': { lat: 12.2958, lng: 76.6394, name: 'Mysuru, Karnataka, India' },
  'mysore': { lat: 12.2958, lng: 76.6394, name: 'Mysuru, Karnataka, India' },
  'mangaluru': { lat: 12.9141, lng: 74.8560, name: 'Mangaluru, Karnataka, India' },
  'mangalore': { lat: 12.9141, lng: 74.8560, name: 'Mangaluru, Karnataka, India' },
  'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala, India' },
  'cochin': { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala, India' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala, India' },
  'trivandrum': { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala, India' },
  'kozhikode': { lat: 11.2588, lng: 75.7804, name: 'Kozhikode, Kerala, India' },
  'calicut': { lat: 11.2588, lng: 75.7804, name: 'Kozhikode, Kerala, India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana, India' },
  'vijayawada': { lat: 16.5062, lng: 80.6480, name: 'Vijayawada, Andhra Pradesh, India' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam, Andhra Pradesh, India' },
  'vizag': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam, Andhra Pradesh, India' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
  'bombay': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra, India' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra, India' },
  'nagpur': { lat: 21.1458, lng: 79.0882, name: 'Nagpur, Maharashtra, India' },
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi, India' },
  'newdelhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi, India' },
  'noida': { lat: 28.5355, lng: 77.3910, name: 'Noida, Uttar Pradesh, India' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana, India' },
  'gurugram': { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana, India' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat, India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal, India' },
  'calcutta': { lat: 22.5726, lng: 88.3639, name: 'Kolkata, West Bengal, India' },
  'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan, India' }
};

function parseCoordinateString(query) {
  if (typeof query !== 'string') return null;
  const cleaned = query.replace(/[()[\]{}a-zA-Z:]/g, ' ').trim();
  const match = cleaned.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      };
    }
  }
  return null;
}

/**
 * Resolve an arbitrary location query (string, array, or object) to coordinates.
 */
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

  // 2. Direct coordinate object input ({ lat, lng } or nested coordinates)
  if (typeof input === 'object' && input !== null) {
    let lat = input.lat ?? input.latitude;
    let lng = input.lng ?? input.longitude ?? input.lon;

    if (lat === undefined && input.coordinates) {
      lat = input.coordinates.lat ?? input.coordinates.latitude;
      lng = input.coordinates.lng ?? input.coordinates.longitude ?? input.coordinates.lon;
    }
    if (lat === undefined && input.position) {
      lat = input.position.lat ?? input.position.latitude;
      lng = input.position.lon ?? input.position.lng ?? input.position.longitude;
    }

    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!isNaN(nLat) && !isNaN(nLng) && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180) {
      return {
        lat: Number(nLat.toFixed(5)),
        lng: Number(nLng.toFixed(5)),
        name: input.name || `Location (${nLat.toFixed(4)}, ${nLng.toFixed(4)})`
      };
    }
  }


  if (typeof input !== 'string') {
    throw new Error('Invalid location query format.');
  }

  const query = input.trim();

  // 3. Comma-separated coordinates check
  const directCoords = parseCoordinateString(query);
  if (directCoords) {
    return directCoords;
  }

  const normalizedKey = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 4. Exact match in validated coordinate database (instant & deterministic for key cities & aliases)
  if (KNOWN_LOCATIONS[normalizedKey]) {
    logger.info(`Geocoded "${query}" using validated coordinate database.`);
    return { ...KNOWN_LOCATIONS[normalizedKey] };
  }

  // 5. TomTom Fuzzy Search API (with Indian regional bias primary, global fallback)
  if (config.tomtom.hasKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.tomtom.timeoutMs);

    try {
      // Primary: Search within India with typeahead enabled for junctions, POIs, streets & localities
      let endpoint = `${config.tomtom.baseUrl}/search/2/search/${encodeURIComponent(query)}.json?key=${config.tomtom.apiKey}&countrySet=IN&limit=1&typeahead=true`;
      let response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      let data = response.ok ? await response.json() : null;
      let firstResult = data && data.results && data.results[0];

      // Secondary: If no result found in India, try global fuzzy search (allows international routes)
      if (!firstResult) {
        endpoint = `${config.tomtom.baseUrl}/search/2/search/${encodeURIComponent(query)}.json?key=${config.tomtom.apiKey}&limit=1&typeahead=true`;
        response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          data = await response.json();
          firstResult = data && data.results && data.results[0];
        }
      }

      if (firstResult && firstResult.position) {
        const placeName = firstResult.poi?.name
          ? `${firstResult.poi.name}, ${firstResult.address?.freeformAddress || query}`
          : (firstResult.address?.freeformAddress || query);

        return {
          lat: Number(firstResult.position.lat.toFixed(5)),
          lng: Number(firstResult.position.lon.toFixed(5)),
          name: placeName
        };
      }
    } catch (err) {
      logger.warn(`TomTom geocoding search error for "${query}": ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 6. Substring / Prefix match in fallback dictionary (requires >= 4 chars to prevent false positives)
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    const isPrefix = key.startsWith(normalizedKey);
    const isContainingCity = normalizedKey.includes(key);
    const isSub = normalizedKey.length >= 4 && key.includes(normalizedKey);

    if (isPrefix || isContainingCity || isSub) {
      logger.info(`Geocoded "${query}" using validated coordinate database.`);
      return { ...value };
    }
  }

  throw new Error(`Location "${query}" could not be resolved to coordinates. Please enter a recognized city or "lat, lng" coordinates.`);
}

/**
 * Autocomplete location search: returns up to `limit` suggestions matching query
 */
async function searchLocations(query, limit = 5) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim();
  if (q.length < 2) return [];

  const direct = parseCoordinateString(q);
  if (direct) {
    return [{
      name: direct.name,
      lat: direct.lat,
      lng: direct.lng,
      municipality: 'Coordinates',
      country: ''
    }];
  }

  const results = [];

  // 1. Check TomTom Search API if live key available
  if (config.tomtom.hasKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.tomtom.timeoutMs);

    try {
      // Search with Indian regional bias
      let endpoint = `${config.tomtom.baseUrl}/search/2/search/${encodeURIComponent(q)}.json?key=${config.tomtom.apiKey}&countrySet=IN&limit=${limit}&typeahead=true`;
      let response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      let data = response.ok ? await response.json() : null;

      // Fallback to global search if no India results found
      if (!data || !data.results || data.results.length === 0) {
        endpoint = `${config.tomtom.baseUrl}/search/2/search/${encodeURIComponent(q)}.json?key=${config.tomtom.apiKey}&limit=${limit}&typeahead=true`;
        response = await fetch(endpoint, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        data = response.ok ? await response.json() : null;
      }

      if (data && data.results) {
        data.results.forEach(r => {
          if (r.position) {
            results.push({
              name: r.poi?.name ? `${r.poi.name}, ${r.address?.freeformAddress || ''}` : (r.address?.freeformAddress || q),
              lat: Number(r.position.lat.toFixed(5)),
              lng: Number(r.position.lon.toFixed(5)),
              municipality: r.address?.municipality || r.address?.countrySubdivision || '',
              country: r.address?.country || 'India'
            });
          }
        });
      }
    } catch (err) {
      logger.warn(`TomTom autocomplete error for "${q}": ${err.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 2. Supplement or fallback with verified known locations matching query
  const normalized = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  const seenNames = new Set(results.map(r => r.name.toLowerCase()));

  for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
    if (results.length >= limit) break;
    if ((key.includes(normalized) || loc.name.toLowerCase().includes(normalized)) && !seenNames.has(loc.name.toLowerCase())) {
      seenNames.add(loc.name.toLowerCase());
      results.push({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        municipality: loc.name.split(',')[0],
        country: 'India'
      });
    }
  }

  return results.slice(0, limit);
}

module.exports = {
  geocodeLocation,
  searchLocations,
  KNOWN_LOCATIONS
};
