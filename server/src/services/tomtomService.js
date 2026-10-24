const config = require('../config');
const logger = require('../utils/logger');

/**
 * Generate smooth multi-waypoint polyline curve for demo fallback
 */
function generateCurvedPolyline(start, end, curvature = 0, numPoints = 25) {
  const points = [];
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  
  // Normal vector for curve offset
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const perpLat = -dLng * curvature;
  const perpLng = dLat * curvature;

  const controlLat = midLat + perpLat;
  const controlLng = midLng + perpLng;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier curve
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlLng + t * t * end.lng;
    points.push([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
  }
  return points;
}

/**
 * Haversine formula to approximate direct distance
 */
function haversineDistanceMeters(start, end) {
  const R = 6371e3;
  const phi1 = (start.lat * Math.PI) / 180;
  const phi2 = (end.lat * Math.PI) / 180;
  const deltaPhi = ((end.lat - start.lat) * Math.PI) / 180;
  const deltaLambda = ((end.lng - start.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Generates transparent fallback routes when TomTom API key is not supplied or returns auth error
 */
function generateFallbackRoutes(source, destination) {
  const straightDist = haversineDistanceMeters(source, destination);
  const baseDrivingDist = Math.max(1000, Math.round(straightDist * 1.25)); // Real roads are ~25% longer than straight line
  const avgSpeedMps = 16.6; // ~60 km/h average driving speed
  const baseDurationSecs = Math.max(120, Math.round(baseDrivingDist / avgSpeedMps));

  // Route 1: Primary Highway Route (Fastest, low delay, Green #22c55e)
  const route1Delay = Math.max(300, Math.round(baseDurationSecs * 0.06)); // 6% delay -> Low Traffic
  const route1 = {
    id: 'route-1',
    name: 'Primary Express Highway',
    distanceMeters: baseDrivingDist,
    estimatedDurationSeconds: baseDurationSecs + route1Delay,
    trafficDelaySeconds: route1Delay,
    geometry: generateCurvedPolyline(source, destination, 0.12, 35)
  };

  // Route 2: City Arterial Corridor (High congestion bottleneck, Red #ef4444)
  const route2Dist = Math.round(baseDrivingDist * 0.95);
  const route2FreeFlow = Math.round(route2Dist / (avgSpeedMps * 0.9));
  const route2Delay = Math.round(route2FreeFlow * 0.48); // 48% delay -> Heavy Congestion (Red)
  const route2 = {
    id: 'route-2',
    name: 'City Arterial Corridor',
    distanceMeters: route2Dist,
    estimatedDurationSeconds: route2FreeFlow + route2Delay,
    trafficDelaySeconds: route2Delay,
    geometry: generateCurvedPolyline(source, destination, -0.15, 35)
  };

  // Route 3: Outer Ring Alternate (Moderate slowdown, Yellow #eab308)
  const route3Dist = Math.round(baseDrivingDist * 1.15);
  const route3FreeFlow = Math.round(route3Dist / avgSpeedMps);
  const route3Delay = Math.round(route3FreeFlow * 0.22); // 22% delay -> Moderate Traffic (Yellow)
  const route3 = {
    id: 'route-3',
    name: 'Outer Ring Alternate',
    distanceMeters: route3Dist,
    estimatedDurationSeconds: route3FreeFlow + route3Delay,
    trafficDelaySeconds: route3Delay,
    geometry: generateCurvedPolyline(source, destination, 0.28, 35)
  };

  return [route1, route2, route3];
}

async function fetchTomTomRoutes(source, destination) {
  if (!config.tomtom.hasKey) {
    logger.info('TOMTOM_API_KEY is not set. Generating high-fidelity fallback routes with live coordinates.');
    return {
      dataSource: 'tomtom-fallback-demo',
      routes: generateFallbackRoutes(source, destination)
    };
  }

  const locationsParam = `${source.lat},${source.lng}:${destination.lat},${destination.lng}`;
  const url = `${config.tomtom.baseUrl}/routing/1/calculateRoute/${locationsParam}/json?` +
    new URLSearchParams({
      key: config.tomtom.apiKey,
      maxAlternatives: '2',
      computeTravelTimeFor: 'all',
      routeType: 'fastest',
      traffic: 'true'
    }).toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.tomtom.timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.status === 429) {
      const err = new Error('TomTom Routing API rate limit exceeded.');
      err.code = 'PROVIDER_RATE_LIMIT';
      err.status = 429;
      throw err;
    }

    if (response.status === 403 || response.status === 401) {
      logger.warn(`TomTom authentication failed (${response.status}). Falling back to fallback routes.`);
      return {
        dataSource: 'tomtom-fallback-demo',
        routes: generateFallbackRoutes(source, destination)
      };
    }

    if (!response.ok) {
      const errBody = await response.text();
      logger.warn(`TomTom Routing returned HTTP ${response.status}: ${errBody.slice(0, 150)}. Using resilient fallback routes.`);
      return {
        dataSource: 'tomtom-fallback-demo',
        routes: generateFallbackRoutes(source, destination)
      };
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      return {
        dataSource: 'tomtom',
        routes: []
      };
    }

    // Normalize TomTom route output
    const normalizedRoutes = data.routes.map((r, index) => {
      const summary = r.summary || {};
      const legs = r.legs || [];
      const points = [];

      for (const leg of legs) {
        if (Array.isArray(leg.points)) {
          for (const pt of leg.points) {
            points.push([Number(pt.latitude.toFixed(5)), Number(pt.longitude.toFixed(5))]);
          }
        }
      }

      return {
        id: `route-${index + 1}`,
        name: `Route Alternative ${index + 1}`,
        distanceMeters: summary.lengthInMeters || 0,
        estimatedDurationSeconds: summary.travelTimeInSeconds || 0,
        trafficDelaySeconds: summary.trafficDelayInSeconds || 0,
        geometry: points
      };
    });

    return {
      dataSource: 'tomtom',
      routes: normalizedRoutes
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      logger.warn(`TomTom routing request timed out after ${config.tomtom.timeoutMs}ms. Serving resilient fallback routes.`);
      return {
        dataSource: 'tomtom-fallback-demo',
        routes: generateFallbackRoutes(source, destination)
      };
    }

    if (error.code && error.code !== 'PROVIDER_TIMEOUT') {
      throw error;
    }

    logger.warn('TomTom communication error, serving resilient fallback routes:', error.message);
    return {
      dataSource: 'tomtom-fallback-demo',
      routes: generateFallbackRoutes(source, destination)
    };
  }
}

module.exports = {
  fetchTomTomRoutes,
  generateFallbackRoutes,
  haversineDistanceMeters
};
