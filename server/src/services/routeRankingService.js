const config = require('../config');
const { classifyTrafficSeverity } = require('./trafficSeverityService');

/**
 * Route Ranking Engine
 * 
 * Implements Section 5 of RouteWise Implementation Change Specification:
 * 1. Base candidate ETAs reflect provider travel time (which already incorporates traffic delay).
 * 2. Verified incidents not yet reflected in provider ETA add one documented adjustment to affected routes.
 * 3. Candidate routes are ranked primarily by Adjusted ETA (earlier arrival).
 *    Congestion ratio and distance act as transparent tie-breakers.
 * 4. Switch Threshold: An alternative route is recommended over the main route ONLY when:
 *      timeSaved >= max(180 seconds [3 mins], 10% of main route ETA)
 *    Otherwise, Route 1 (main route) remains recommended to avoid frivolous switching.
 * 5. Unverified community reports are kept separate and explicitly disclaimed.
 */

function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => 0.0);
  }
  return values.map(v => (v - min) / (max - min));
}

function rankRoutes(rawRoutes, optionsOrWeights = {}) {
  // Support both legacy rankRoutes(routes, weights) and rankRoutes(routes, { customWeights, verifiedIncidents, unverifiedReports })
  let customWeights = {};
  let verifiedIncidents = [];
  let unverifiedReports = [];

  if (optionsOrWeights && typeof optionsOrWeights === 'object') {
    if (optionsOrWeights.customWeights || optionsOrWeights.verifiedIncidents || optionsOrWeights.unverifiedReports) {
      customWeights = optionsOrWeights.customWeights || {};
      verifiedIncidents = Array.isArray(optionsOrWeights.verifiedIncidents) ? optionsOrWeights.verifiedIncidents : [];
      unverifiedReports = Array.isArray(optionsOrWeights.unverifiedReports) ? optionsOrWeights.unverifiedReports : [];
    } else {
      customWeights = optionsOrWeights;
    }
  }

  const unverifiedDisclaimer = (unverifiedReports && unverifiedReports.length > 0)
    ? 'Unverified community reports are displayed for informational awareness only and did not determine the route recommendation.'
    : '';

  if (!Array.isArray(rawRoutes) || rawRoutes.length === 0) {
    return {
      recommendedRouteId: null,
      routes: [],
      switchThreshold: {
        thresholdSeconds: 0,
        timeSavedSeconds: 0,
        switched: false,
        reason: 'No routes available.'
      },
      unverifiedReports,
      unverifiedDisclaimer
    };
  }

  // Handle single route directly
  if (rawRoutes.length === 1) {
    const route = rawRoutes[0];
    const duration = Math.max(0, Number(route.estimatedDurationSeconds) || 0);
    const delay = Math.max(0, Number(route.trafficDelaySeconds) || 0);
    const distance = Math.max(0, Number(route.distanceMeters) || 0);
    const routeId = route.id || 'route-1';

    let unreflectedIncidentDelay = 0;
    const incidentsApplied = [];
    if (Array.isArray(verifiedIncidents)) {
      for (const inc of verifiedIncidents) {
        const affects = !inc.affectsRouteIds || inc.affectsRouteIds.includes(routeId);
        if (affects && !inc.alreadyReflectedInProvider) {
          const impactSec = Math.max(0, (Number(inc.estimatedImpactMinutes) || 0) * 60);
          unreflectedIncidentDelay += impactSec;
          incidentsApplied.push({ ...inc, impactSeconds: impactSec });
        }
      }
    }

    const adjustedDuration = duration + unreflectedIncidentDelay;
    const trafficInfo = classifyTrafficSeverity(adjustedDuration, delay + unreflectedIncidentDelay);

    return {
      recommendedRouteId: routeId,
      switchThreshold: {
        thresholdSeconds: 0,
        timeSavedSeconds: 0,
        switched: false,
        reason: 'Sole available route; switch threshold does not apply.'
      },
      unverifiedReports,
      unverifiedDisclaimer,
      routes: [{
        ...route,
        id: routeId,
        rank: 1,
        isRecommended: true,
        rankingScore: 100,
        costScore: 0,
        trafficSeverity: trafficInfo.severity,
        trafficColor: trafficInfo.color,
        trafficLabel: trafficInfo.label,
        distanceMeters: distance,
        estimatedDurationSeconds: duration,
        adjustedDurationSeconds: adjustedDuration,
        incidentDelayAppliedSeconds: unreflectedIncidentDelay,
        incidentsApplied,
        trafficDelaySeconds: delay,
        recommendationReasons: [
          'Sole available driving route returned by routing provider',
          `${Math.round(distance / 1000)} km total distance (${Math.round(adjustedDuration / 60)} mins estimated)`
        ],
        geometry: Array.isArray(route.geometry) ? route.geometry : []
      }]
    };
  }

  // 1. Process candidate routes and apply verified incidents
  const preparedRoutes = rawRoutes.map((route, idx) => {
    const duration = Math.max(0, Number(route.estimatedDurationSeconds) || 0);
    const delay = Math.max(0, Number(route.trafficDelaySeconds) || 0);
    const distance = Math.max(0, Number(route.distanceMeters) || 0);
    const routeId = route.id || `route-${idx + 1}`;
    const isMain = route.isMainRoute === true || (idx === 0 && !rawRoutes.some(r => r.isMainRoute));

    let unreflectedIncidentDelay = 0;
    const incidentsApplied = [];
    if (Array.isArray(verifiedIncidents)) {
      for (const inc of verifiedIncidents) {
        const affects = !inc.affectsRouteIds || inc.affectsRouteIds.includes(routeId);
        if (affects && !inc.alreadyReflectedInProvider) {
          const impactSec = Math.max(0, (Number(inc.estimatedImpactMinutes) || 0) * 60);
          unreflectedIncidentDelay += impactSec;
          incidentsApplied.push({ ...inc, impactSeconds: impactSec });
        }
      }
    }

    const adjustedDuration = duration + unreflectedIncidentDelay;
    const congestionRatio = adjustedDuration > 0 ? (delay / adjustedDuration) : 0;
    const trafficInfo = classifyTrafficSeverity(adjustedDuration, delay + unreflectedIncidentDelay);

    return {
      ...route,
      id: routeId,
      isMainRoute: isMain,
      distanceMeters: distance,
      estimatedDurationSeconds: duration,
      adjustedDurationSeconds: adjustedDuration,
      incidentDelayAppliedSeconds: unreflectedIncidentDelay,
      incidentsApplied,
      trafficDelaySeconds: delay,
      congestionRatio,
      trafficSeverity: trafficInfo.severity,
      trafficColor: trafficInfo.color,
      trafficLabel: trafficInfo.label,
      rawMetrics: {
        durationMins: Math.round(adjustedDuration / 60),
        providerDurationMins: Math.round(duration / 60),
        delayMins: Math.round(delay / 60),
        distanceKm: Number((distance / 1000).toFixed(1))
      }
    };
  });

  // 2. Sort candidate routes by Adjusted ETA (lowest arrival time is best)
  // Tie-breakers: lower congestion ratio, then shorter distance
  preparedRoutes.sort((a, b) => {
    if (a.adjustedDurationSeconds !== b.adjustedDurationSeconds) {
      return a.adjustedDurationSeconds - b.adjustedDurationSeconds;
    }
    if (a.congestionRatio !== b.congestionRatio) {
      return a.congestionRatio - b.congestionRatio;
    }
    return a.distanceMeters - b.distanceMeters;
  });

  // 3. Compute normalized AI ranking scores (0-100)
  const minDuration = preparedRoutes[0].adjustedDurationSeconds;
  const maxDuration = Math.max(...preparedRoutes.map(r => r.adjustedDurationSeconds));
  const durRange = maxDuration - minDuration || 1;

  preparedRoutes.forEach((r) => {
    const timePenalty = ((r.adjustedDurationSeconds - minDuration) / durRange) * 35;
    const congestionPenalty = Math.min(25, r.congestionRatio * 40);
    const score = Math.max(10, Math.min(100, Math.round(100 - timePenalty - congestionPenalty)));
    r.rankingScore = score;
    r.costScore = Number(((r.adjustedDurationSeconds - minDuration) / 60).toFixed(2));
  });

  // 4. Switch Threshold Evaluation (Section 5.5)
  const mainRoute = preparedRoutes.find(r => r.isMainRoute) || preparedRoutes[0];
  const fastestRoute = preparedRoutes[0];

  const mainDuration = mainRoute.adjustedDurationSeconds;
  // Threshold: max(3 minutes [180s], 10% of main route duration)
  const switchThresholdSeconds = Math.max(180, Math.round(0.10 * mainDuration));
  const timeSavedSeconds = mainDuration - fastestRoute.adjustedDurationSeconds;

  let recommendedRouteId;
  let switchThresholdInfo;

  if (fastestRoute.id === mainRoute.id) {
    recommendedRouteId = mainRoute.id;
    switchThresholdInfo = {
      thresholdSeconds: switchThresholdSeconds,
      timeSavedSeconds: 0,
      switched: false,
      reason: 'Main route is already the fastest path with direct arterial corridor flow.'
    };
  } else {
    // Alternative is faster: check if it clears switchThresholdSeconds
    if (timeSavedSeconds >= switchThresholdSeconds) {
      recommendedRouteId = fastestRoute.id;
      const timeSavedMins = Math.round(timeSavedSeconds / 60);
      const threshMins = Math.round(switchThresholdSeconds / 60);
      const pctSaved = Math.round((timeSavedSeconds / mainDuration) * 100);
      switchThresholdInfo = {
        thresholdSeconds: switchThresholdSeconds,
        timeSavedSeconds,
        switched: true,
        reason: `Alternative corridor clears the switch threshold of ${threshMins}m (saves ${timeSavedMins}m, ${pctSaved}% of travel time).`
      };
    } else {
      // Below threshold: Route 1 remains recommended
      recommendedRouteId = mainRoute.id;
      const timeSavedMins = Math.round(timeSavedSeconds / 60);
      const threshMins = Math.round(switchThresholdSeconds / 60);
      switchThresholdInfo = {
        thresholdSeconds: switchThresholdSeconds,
        timeSavedSeconds,
        switched: false,
        reason: `Alternative corridor saves only ${timeSavedMins}m (${timeSavedSeconds}s), which does not clear the ${threshMins}m stability threshold. Main route remains recommended.`
      };
    }
  }

  // 5. Generate ranks, recommendation flags, and detailed comparison explanations
  const rankedRoutes = preparedRoutes.map((route, rankIdx) => {
    const isRecommended = (route.id === recommendedRouteId);
    const reasons = [];
    let comparisonSummary = '';
    let comparisonBadge = '';

    const durMins = Math.round(route.adjustedDurationSeconds / 60);
    const distKm = Number((route.distanceMeters / 1000).toFixed(1));
    const delayMins = Math.round(route.trafficDelaySeconds / 60);

    const mainDurMins = Math.round(mainRoute.adjustedDurationSeconds / 60);
    const mainDistKm = Number((mainRoute.distanceMeters / 1000).toFixed(1));
    const mainDelayMins = Math.round(mainRoute.trafficDelaySeconds / 60);

    if (isRecommended) {
      comparisonBadge = route.isMainRoute ? '★ #1 Main Route' : '★ #1 Recommended Alternative';

      if (switchThresholdInfo.switched && route.id !== mainRoute.id) {
        const timeSavedMins = Math.round(switchThresholdInfo.timeSavedSeconds / 60);
        const distDiff = Number((distKm - mainDistKm).toFixed(1));
        reasons.push(`Saves ${timeSavedMins} mins travel time (> ${Math.round(switchThresholdInfo.thresholdSeconds / 60)}m threshold) vs Route 1`);
        if (distDiff > 0) {
          reasons.push(`+${distDiff} km detour to bypass severe traffic on Route 1`);
        } else if (distDiff < 0) {
          reasons.push(`${Math.abs(distDiff)} km shorter driving distance than Route 1`);
        }
        comparisonSummary = `Saves ${timeSavedMins}m arrival time vs Route 1 (> ${Math.round(switchThresholdInfo.thresholdSeconds / 60)}m stability threshold)`;
      } else if (!switchThresholdInfo.switched && route.id === mainRoute.id && switchThresholdInfo.timeSavedSeconds > 0) {
        reasons.push(`Main route remains recommended: Alternative corridor saves only ${Math.round(switchThresholdInfo.timeSavedSeconds / 60)}m (${switchThresholdInfo.timeSavedSeconds}s), which does not clear the ${Math.round(switchThresholdInfo.thresholdSeconds / 60)}m stability threshold`);
        reasons.push('Direct primary arterial route without detour complications');
        comparisonSummary = `Main route remains recommended (alternative saves < ${Math.round(switchThresholdInfo.thresholdSeconds / 60)}m switch threshold)`;
      } else {
        reasons.push('Fastest estimated arrival time among all candidate routes');
        reasons.push(`Direct corridor with optimal arterial flow (${distKm} km, ${durMins} mins)`);
        comparisonSummary = `Fastest and most efficient route among all candidate corridors`;
      }

      if (route.incidentsApplied.length > 0) {
        route.incidentsApplied.forEach(inc => {
          reasons.push(`Reflects verified ${inc.type} (+${Math.round(inc.impactSeconds / 60)}m unreflected delay)`);
        });
      }

      reasons.push(`AI composite score: ${route.rankingScore}/100`);
    } else {
      comparisonBadge = rankIdx === 0 ? 'Fastest (Below Threshold)' : `Alternative #${rankIdx + 1}`;

      const recRoute = preparedRoutes.find(r => r.id === recommendedRouteId) || preparedRoutes[0];
      const recDurMins = Math.round(recRoute.adjustedDurationSeconds / 60);
      const recDistKm = Number((recRoute.distanceMeters / 1000).toFixed(1));

      const timeDiff = durMins - recDurMins;
      const distDiff = Number((distKm - recDistKm).toFixed(1));

      if (route.id === fastestRoute.id && !switchThresholdInfo.switched) {
        reasons.push(`Marginally faster by ${switchThresholdInfo.timeSavedSeconds}s (${Math.round(switchThresholdInfo.timeSavedSeconds / 60)}m), but below the ${Math.round(switchThresholdInfo.thresholdSeconds / 60)}m switch threshold`);
        comparisonSummary = `Saves only ${switchThresholdInfo.timeSavedSeconds}s; does not justify route switch`;
      } else {
        if (timeDiff > 0) {
          reasons.push(`+${timeDiff} mins longer travel time than recommended route`);
        }
        if (distDiff > 0) {
          reasons.push(`+${distDiff} km longer driving distance`);
        } else if (distDiff < 0) {
          reasons.push(`${Math.abs(distDiff)} km shorter distance, but delayed by traffic`);
        }
        comparisonSummary = `+${Math.max(0, timeDiff)}m arrival delta vs recommended route`;
      }

      if (route.incidentsApplied.length > 0) {
        route.incidentsApplied.forEach(inc => {
          reasons.push(`Affected by verified ${inc.type} (+${Math.round(inc.impactSeconds / 60)}m unreflected delay)`);
        });
      }

      if (reasons.length === 0) {
        reasons.push(`Viable secondary corridor (Score ${route.rankingScore}/100)`);
      }
    }

    return {
      id: route.id,
      name: route.name || route.summary || (route.isMainRoute ? 'Primary Arterial Route' : `Alternative Route #${rankIdx + 1}`),
      isMainRoute: route.isMainRoute,
      rank: rankIdx + 1,
      isRecommended,
      rankingScore: route.rankingScore,
      costScore: route.costScore,
      distanceMeters: route.distanceMeters,
      estimatedDurationSeconds: route.estimatedDurationSeconds,
      adjustedDurationSeconds: route.adjustedDurationSeconds,
      incidentDelayAppliedSeconds: route.incidentDelayAppliedSeconds,
      incidentsApplied: route.incidentsApplied,
      trafficDelaySeconds: route.trafficDelaySeconds,
      congestionRatio: Number(route.congestionRatio.toFixed(3)),
      trafficSeverity: route.trafficSeverity,
      trafficColor: route.trafficColor,
      trafficLabel: route.trafficLabel,
      recommendationReasons: reasons,
      comparisonSummary,
      comparisonBadge,
      geometry: route.geometry || []
    };
  });

  return {
    recommendedRouteId,
    switchThreshold: switchThresholdInfo,
    unverifiedReports,
    unverifiedDisclaimer,
    routes: rankedRoutes.slice(0, 3)
  };
}

module.exports = {
  rankRoutes,
  minMaxNormalize
};
