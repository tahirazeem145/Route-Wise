const { geocodeLocation, searchLocations } = require('../services/geocodingService');
const { fetchTomTomRoutes } = require('../services/tomtomService');
const { rankRoutes } = require('../services/routeRankingService');
const { predictRouteTraffic } = require('../services/predictiveTrafficService');
const { getDatabase, haversineDistanceMeters } = require('../models/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

function enrichAndRankRoutes(rawRoutes, weights) {
  const db = getDatabase();
  db.expireStaleReports();
  const activeIncidents = db.listActiveReports();

  // Telemetry speed-drop verification check (Section 4.1):
  // Check if any candidate route with traffic delay >= 3 mins (or heavy severity) crosses an unverified report
  for (const route of rawRoutes) {
    if ((route.trafficDelaySeconds >= 180 || route.trafficSeverity === 'heavy') && Array.isArray(route.geometry)) {
      for (const inc of activeIncidents) {
        if (inc.status === 'Unverified') {
          const isNearRoute = route.geometry.some(pt => {
            const [pLat, pLng] = Array.isArray(pt) ? pt : [pt.lat, pt.lng];
            return haversineDistanceMeters(pLat, pLng, inc.latitude, inc.longitude) <= 300;
          });

          if (isNearRoute) {
            const impactMins = Math.max(3, Math.round((route.trafficDelaySeconds || 0) / 60));
            db.updateReportStatus(inc.id, {
              status: 'Verified',
              verificationReason: 'telemetry_match',
              estimatedImpactMinutes: impactMins
            });
            inc.status = 'Verified';
            inc.verificationReason = 'telemetry_match';
            inc.estimatedImpactMinutes = impactMins;
            logger.info(`[TELEMETRY MATCH] Auto-verified community incident ${inc.id} (${inc.type}) based on TomTom delay (+${impactMins}m)`);
          }
        }
      }
    }
  }

  const verifiedIncidents = activeIncidents.filter(r => r.status === 'Verified');
  const unverifiedReports = activeIncidents.filter(r => r.status === 'Unverified');

  // Rank routes using corrected Section 5 ranking engine
  const rankingResult = rankRoutes(rawRoutes, {
    customWeights: weights,
    verifiedIncidents,
    unverifiedReports
  });

  const enrichedRoutes = rankingResult.routes.map(r => ({
    ...r,
    predictiveForecast: predictRouteTraffic(r)
  }));

  return {
    rankingResult,
    enrichedRoutes
  };
}

async function recommendRoutes(req, res) {
  try {
    const { source, destination, weights } = req.body;

    // 1. Geocode locations
    let resolvedSource;
    let resolvedDestination;
    try {
      resolvedSource = await geocodeLocation(source);
    } catch (err) {
      return errorResponse(res, 'GEOCODING_FAILED_SOURCE', err.message, 400);
    }

    try {
      resolvedDestination = await geocodeLocation(destination);
    } catch (err) {
      return errorResponse(res, 'GEOCODING_FAILED_DESTINATION', err.message, 400);
    }

    const latDiff = Math.abs(resolvedSource.lat - resolvedDestination.lat);
    const lngDiff = Math.abs(resolvedSource.lng - resolvedDestination.lng);
    if ((resolvedSource.lat === resolvedDestination.lat && resolvedSource.lng === resolvedDestination.lng) || (latDiff < 0.0005 && lngDiff < 0.0005)) {
      return errorResponse(res, 'IDENTICAL_LOCATIONS', 'Source and destination locations resolve to the same geographic coordinates.', 400);
    }

    // 2. Fetch routes from routing provider
    const { routes: rawRoutes, dataSource } = await fetchTomTomRoutes(resolvedSource, resolvedDestination);

    if (!rawRoutes || rawRoutes.length === 0) {
      return errorResponse(
        res,
        'NO_ROUTES_FOUND',
        'No drivable route alternatives could be found between the specified locations.',
        404
      );
    }

    // 3. Rank alternatives using multi-criteria cost engine and verified incidents
    const { rankingResult, enrichedRoutes } = enrichAndRankRoutes(rawRoutes, weights);

    // 4. Return structured response
    return successResponse(res, {
      source: {
        name: resolvedSource.name,
        coordinates: {
          lat: resolvedSource.lat,
          lng: resolvedSource.lng
        }
      },
      destination: {
        name: resolvedDestination.name,
        coordinates: {
          lat: resolvedDestination.lat,
          lng: resolvedDestination.lng
        }
      },
      recommendedRouteId: rankingResult.recommendedRouteId,
      switchThreshold: rankingResult.switchThreshold,
      unverifiedReports: rankingResult.unverifiedReports || [],
      unverifiedDisclaimer: rankingResult.unverifiedDisclaimer || '',
      routes: enrichedRoutes,
      totalAlternativesFound: enrichedRoutes.length,
      dataSource,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error during route recommendation:', error.message);
    const statusCode = error.status || 500;
    const errorCode = error.code || 'INTERNAL_ROUTING_ERROR';
    return errorResponse(res, errorCode, error.message || 'An unexpected routing error occurred.', statusCode);
  }
}

async function refreshRoutes(req, res) {
  try {
    const { source, destination, weights } = req.body;

    // Resolves fresh traffic updates for the route query
    let resolvedSource;
    let resolvedDestination;
    try {
      resolvedSource = await geocodeLocation(source);
      resolvedDestination = await geocodeLocation(destination);
    } catch (err) {
      return errorResponse(res, 'GEOCODING_ERROR', err.message, 400);
    }

    const latDiff = Math.abs(resolvedSource.lat - resolvedDestination.lat);
    const lngDiff = Math.abs(resolvedSource.lng - resolvedDestination.lng);
    if ((resolvedSource.lat === resolvedDestination.lat && resolvedSource.lng === resolvedDestination.lng) || (latDiff < 0.0005 && lngDiff < 0.0005)) {
      return errorResponse(res, 'IDENTICAL_LOCATIONS', 'Source and destination locations resolve to the same geographic coordinates.', 400);
    }

    const { routes: rawRoutes, dataSource } = await fetchTomTomRoutes(resolvedSource, resolvedDestination);

    if (!rawRoutes || rawRoutes.length === 0) {
      return errorResponse(res, 'NO_ROUTES_FOUND', 'No updated routes found.', 404);
    }

    const { rankingResult, enrichedRoutes } = enrichAndRankRoutes(rawRoutes, weights);

    return successResponse(res, {
      isRefreshed: true,
      source: {
        name: resolvedSource.name,
        coordinates: { lat: resolvedSource.lat, lng: resolvedSource.lng }
      },
      destination: {
        name: resolvedDestination.name,
        coordinates: { lat: resolvedDestination.lat, lng: resolvedDestination.lng }
      },
      recommendedRouteId: rankingResult.recommendedRouteId,
      switchThreshold: rankingResult.switchThreshold,
      unverifiedReports: rankingResult.unverifiedReports || [],
      unverifiedDisclaimer: rankingResult.unverifiedDisclaimer || '',
      routes: enrichedRoutes,
      totalAlternativesFound: enrichedRoutes.length,
      dataSource,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error during route refresh:', error.message);
    const statusCode = error.status || 500;
    const errorCode = error.code || 'INTERNAL_REFRESH_ERROR';
    return errorResponse(res, errorCode, error.message || 'Unable to refresh routes at this time.', statusCode);
  }
}

async function searchLocationsHandler(req, res) {
  try {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query || query.length < 2) {
      return successResponse(res, { locations: [] });
    }
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const locations = await searchLocations(query, limit);
    return successResponse(res, { locations });
  } catch (error) {
    logger.error('Error during location search:', error.message);
    return errorResponse(res, 'LOCATION_SEARCH_ERROR', 'Unable to search locations at this time.', 500);
  }
}

module.exports = {
  recommendRoutes,
  refreshRoutes,
  searchLocations: searchLocationsHandler
};

