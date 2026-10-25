/**
 * Google Maps Directions Handoff Engine
 * 
 * Implements Section 6 of RouteWise Implementation Change Specification:
 * - Web/PWA link behavior using https://www.google.com/maps/dir/?api=1
 * - Preserves route identity for every alternative using up to 3 non-straight-line decision anchor waypoints
 * - Enforces Google's 2,048-character URL length safety limit
 * - Clear disclosure that Google Maps recalculates exact street paths between anchors
 */

export const MAX_WAYPOINTS = 3;
export const MAX_URL_LENGTH = 2048;
export const BASE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1';

const HANDOFF_DISCLAIMER =
  'Best-effort corridor handoff: Google Maps will navigate using these corridor anchors. Exact street routing between anchors is recalculated by Google Maps.';

/**
 * Calculates distance between two coordinates in meters
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalizes coordinate point representation to [lat, lng]
 */
function normalizePoint(pt) {
  if (!pt) return null;
  if (Array.isArray(pt) && pt.length >= 2) {
    const lat = Number(pt[0]);
    const lng = Number(pt[1]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  } else if (typeof pt === 'object' && pt.lat != null && pt.lng != null) {
    const lat = Number(pt.lat);
    const lng = Number(pt.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return null;
}

/**
 * Extract up to 3 characteristic decision anchors where the selected route
 * diverges from other candidate alternatives.
 */
export function extractDecisionAnchors(route, allRoutes = []) {
  if (!route || !Array.isArray(route.geometry) || route.geometry.length < 3) {
    return [];
  }

  const rawPoints = route.geometry.map(normalizePoint).filter(Boolean);
  if (rawPoints.length < 3) {
    return [];
  }

  // Filter other candidate alternatives that have valid geometry
  const otherRoutes = allRoutes
    .filter(r => r && r.id !== route.id && Array.isArray(r.geometry) && r.geometry.length > 2)
    .map(r => r.geometry.map(normalizePoint).filter(Boolean));

  // Identify divergent points where minimum distance to any other corridor is > 200m
  let candidatePoints = [];

  if (otherRoutes.length > 0) {
    // Only inspect intermediate points (skip first and last 10% to avoid common junctions)
    const startIdx = Math.floor(rawPoints.length * 0.10);
    const endIdx = Math.floor(rawPoints.length * 0.90);
    const intermediate = rawPoints.slice(startIdx, endIdx);

    const divergentIndices = [];
    intermediate.forEach((pt, localIdx) => {
      const [lat, lng] = pt;
      let minDistanceToOthers = Infinity;

      for (const otherPts of otherRoutes) {
        for (const oPt of otherPts) {
          const d = haversineDistanceMeters(lat, lng, oPt[0], oPt[1]);
          if (d < minDistanceToOthers) {
            minDistanceToOthers = d;
          }
        }
      }

      if (minDistanceToOthers > 200) {
        divergentIndices.push(startIdx + localIdx);
      }
    });

    if (divergentIndices.length > 0) {
      // Pick up to 3 ordered progression anchors from divergent section
      const count = Math.min(MAX_WAYPOINTS, divergentIndices.length);
      const step = Math.floor(divergentIndices.length / count);
      for (let i = 0; i < count; i++) {
        const idx = divergentIndices[Math.min(divergentIndices.length - 1, i * step + Math.floor(step / 2))];
        candidatePoints.push(rawPoints[idx]);
      }
    }
  }

  // Fallback: If no distinct divergence identified, sample intermediate progression anchors
  if (candidatePoints.length === 0) {
    const len = rawPoints.length;
    if (len >= 6) {
      candidatePoints = [
        rawPoints[Math.floor(len * 0.25)],
        rawPoints[Math.floor(len * 0.50)],
        rawPoints[Math.floor(len * 0.75)]
      ];
    } else if (len >= 4) {
      candidatePoints = [
        rawPoints[Math.floor(len * 0.33)],
        rawPoints[Math.floor(len * 0.66)]
      ];
    } else {
      candidatePoints = [rawPoints[1]];
    }
  }

  // Deduplicate and round to 5 decimal places (~1.1 meter accuracy)
  const uniqueAnchors = [];
  const seen = new Set();

  for (const pt of candidatePoints.slice(0, MAX_WAYPOINTS)) {
    const lat = Number(pt[0].toFixed(5));
    const lng = Number(pt[1].toFixed(5));
    const key = `${lat},${lng}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAnchors.push({ lat, lng });
    }
  }

  return uniqueAnchors;
}

/**
 * Builds the complete, validated Google Maps directions handoff URL
 */
export function buildGoogleMapsHandoff(route, options = {}) {
  const { origin, destination, allRoutes = [], travelMode = 'driving' } = options;

  let originLat, originLng, destLat, destLng;

  // Resolve origin coordinates
  if (origin && origin.lat != null && origin.lng != null) {
    originLat = Number(origin.lat);
    originLng = Number(origin.lng);
  } else if (route?.geometry?.length > 0) {
    const first = normalizePoint(route.geometry[0]);
    if (first) {
      originLat = first[0];
      originLng = first[1];
    }
  }

  // Resolve destination coordinates
  if (destination && destination.lat != null && destination.lng != null) {
    destLat = Number(destination.lat);
    destLng = Number(destination.lng);
  } else if (route?.geometry?.length > 0) {
    const last = normalizePoint(route.geometry[route.geometry.length - 1]);
    if (last) {
      destLat = last[0];
      destLng = last[1];
    }
  }

  // Safe fallback if origin or destination coordinates are unavailable
  if (originLat == null || originLng == null || destLat == null || destLng == null) {
    return {
      url: `${BASE_MAPS_URL}&travelmode=${encodeURIComponent(travelMode)}`,
      routeId: route?.id || 'unknown',
      waypoints: [],
      travelMode,
      isSafe: false,
      charLength: 0,
      disclaimer: HANDOFF_DISCLAIMER,
      warning: 'Origin or destination coordinates unavailable; unable to construct navigation link.'
    };
  }

  const hasValidGeometry = Array.isArray(route?.geometry) && route.geometry.length >= 3;
  let waypoints = hasValidGeometry ? extractDecisionAnchors(route, allRoutes) : [];
  let warning = hasValidGeometry ? null : 'Corridor geometry unavailable; falling back to direct origin/destination navigation.';

  const validMode = (travelMode === 'two-wheeler') ? 'two-wheeler' : 'driving';

  // Construct URL helper
  const constructUrl = (wps) => {
    let u = `${BASE_MAPS_URL}&origin=${originLat.toFixed(5)}%2C${originLng.toFixed(5)}&destination=${destLat.toFixed(5)}%2C${destLng.toFixed(5)}&travelmode=${validMode}`;
    if (wps.length > 0) {
      const wpParam = wps.map(w => `${w.lat}%2C${w.lng}`).join('%7C');
      u += `&waypoints=${wpParam}`;
    }
    return u;
  };

  let url = constructUrl(waypoints);

  // Safety check: ensure URL never exceeds 2,048 characters
  while (url.length > MAX_URL_LENGTH && waypoints.length > 0) {
    waypoints.pop();
    url = constructUrl(waypoints);
  }

  return {
    url,
    routeId: route?.id || 'route',
    waypoints,
    travelMode: validMode,
    isSafe: true,
    charLength: url.length,
    disclaimer: HANDOFF_DISCLAIMER,
    warning
  };
}
