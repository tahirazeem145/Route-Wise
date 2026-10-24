const config = require('../config');
const { classifyTrafficSeverity } = require('./trafficSeverityService');

/**
 * Route Ranking Engine
 * 
 * Evaluates candidate routes using a multi-criteria cost function:
 *   Normalized Cost = (w_time * norm_time) + (w_delay * norm_delay) + (w_dist * norm_dist)
 * 
 * Lower overall cost translates to a higher ranking (Rank #1 is the Recommended Route).
 * 
 * Implementation Note:
 * This algorithm is a transparent, deterministic multi-criteria baseline ranking model.
 * It does not use pseudo-random outputs or claim unverified ML model inferences.
 */

function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    // If all alternatives have identical values, normalized cost is equal
    return values.map(() => 0.5);
  }
  return values.map(v => (v - min) / (max - min));
}

function rankRoutes(rawRoutes, customWeights = {}) {
  if (!Array.isArray(rawRoutes) || rawRoutes.length === 0) {
    return {
      recommendedRouteId: null,
      routes: []
    };
  }

  // Handle single route directly
  if (rawRoutes.length === 1) {
    const route = rawRoutes[0];
    const duration = Number(route.estimatedDurationSeconds) || 0;
    const delay = Number(route.trafficDelaySeconds) || 0;
    const distance = Number(route.distanceMeters) || 0;
    const trafficInfo = classifyTrafficSeverity(duration, delay);

    return {
      recommendedRouteId: route.id || 'route-1',
      routes: [{
        ...route,
        id: route.id || 'route-1',
        rank: 1,
        isRecommended: true,
        rankingScore: 100, // perfect score as only choice
        costScore: 0,
        trafficSeverity: trafficInfo.severity,
        trafficColor: trafficInfo.color,
        trafficLabel: trafficInfo.label,
        trafficDelaySeconds: delay,
        recommendationReasons: [
          'Sole available driving route returned by routing provider',
          `${Math.round(distance / 1000)} km total distance (${Math.round(duration / 60)} mins estimated)`
        ],
        geometry: Array.isArray(route.geometry) ? route.geometry : []
      }]
    };
  }

  // Resolve weights (fall back to server config)
  const wTime = customWeights.weightTime ?? config.ranking.weightTime;
  const wDelay = customWeights.weightDelay ?? config.ranking.weightDelay;
  const wDist = customWeights.weightDistance ?? config.ranking.weightDistance;

  // Normalize weights so they sum to 1.0
  const totalWeight = (wTime + wDelay + wDist) || 1.0;
  const weightTime = wTime / totalWeight;
  const weightDelay = wDelay / totalWeight;
  const weightDist = wDist / totalWeight;

  // Extract raw arrays for normalization
  const times = rawRoutes.map(r => Math.max(0, Number(r.estimatedDurationSeconds) || 0));
  const delays = rawRoutes.map(r => Math.max(0, Number(r.trafficDelaySeconds) || 0));
  const distances = rawRoutes.map(r => Math.max(0, Number(r.distanceMeters) || 0));

  const normTimes = minMaxNormalize(times);
  const normDelays = minMaxNormalize(delays);
  const normDistances = minMaxNormalize(distances);

  // Compute composite cost for each candidate
  const scoredRoutes = rawRoutes.map((route, idx) => {
    const duration = times[idx];
    const delay = delays[idx];
    const distance = distances[idx];
    const trafficInfo = classifyTrafficSeverity(duration, delay);

    // Composite cost: lower is better (0.0 = best possible among alternatives, 1.0 = worst)
    const cost = (normTimes[idx] * weightTime) +
                 (normDelays[idx] * weightDelay) +
                 (normDistances[idx] * weightDist);

    // Convert cost to 0-100 ranking score where 100 is best
    const rankingScore = Math.round((1 - cost) * 100);

    return {
      ...route,
      id: route.id || `route-${idx + 1}`,
      distanceMeters: distance,
      estimatedDurationSeconds: duration,
      trafficDelaySeconds: delay,
      trafficSeverity: trafficInfo.severity,
      trafficColor: trafficInfo.color,
      trafficLabel: trafficInfo.label,
      costScore: Number(cost.toFixed(4)),
      rankingScore,
      rawMetrics: {
        durationMins: Math.round(duration / 60),
        delayMins: Math.round(delay / 60),
        distanceKm: Number((distance / 1000).toFixed(1))
      }
    };
  });

  // Sort primarily by lowest cost score (asc), secondarily by lowest duration, tertiarily by lowest distance
  scoredRoutes.sort((a, b) => {
    if (a.costScore !== b.costScore) {
      return a.costScore - b.costScore;
    }
    if (a.estimatedDurationSeconds !== b.estimatedDurationSeconds) {
      return a.estimatedDurationSeconds - b.estimatedDurationSeconds;
    }
    return a.distanceMeters - b.distanceMeters;
  });

  // Assign ranks, recommendation flags, and detailed explanations
  const minDuration = Math.min(...times);
  const minDelay = Math.min(...delays);
  const minDistance = Math.min(...distances);

  const topRoute = scoredRoutes[0];
  const topDuration = topRoute.estimatedDurationSeconds;
  const topDistance = topRoute.distanceMeters;
  const topDelay = topRoute.trafficDelaySeconds;

  const rankedRoutes = scoredRoutes.map((route, rankIdx) => {
    const isRecommended = rankIdx === 0;
    const reasons = [];
    let comparisonSummary = '';
    let comparisonBadge = '';

    const durMins = Math.round(route.estimatedDurationSeconds / 60);
    const distKm = Number((route.distanceMeters / 1000).toFixed(1));
    const delayMins = Math.round(route.trafficDelaySeconds / 60);

    const topDurMins = Math.round(topDuration / 60);
    const topDistKm = Number((topDistance / 1000).toFixed(1));
    const topDelayMins = Math.round(topDelay / 60);

    if (isRecommended) {
      comparisonBadge = '★ Why #1 Pick';
      const alt2 = scoredRoutes[1];
      const alt3 = scoredRoutes[2];

      if (alt2) {
        const alt2DurMins = Math.round(alt2.estimatedDurationSeconds / 60);
        const alt2DistKm = Number((alt2.distanceMeters / 1000).toFixed(1));
        const alt2DelayMins = Math.round(alt2.trafficDelaySeconds / 60);

        const timeSavedVs2 = alt2DurMins - topDurMins;
        const distSavedVs2 = Number((alt2DistKm - topDistKm).toFixed(1));
        const delayAvoidedVs2 = alt2DelayMins - topDelayMins;

        if (timeSavedVs2 > 0 && distSavedVs2 > 0) {
          reasons.push(`Saves ${timeSavedVs2} mins travel time and ${distSavedVs2} km shorter distance than Route #2`);
        } else {
          if (timeSavedVs2 > 0) {
            reasons.push(`${timeSavedVs2} mins faster arrival than Route #2`);
          }
          if (distSavedVs2 > 0) {
            reasons.push(`${distSavedVs2} km shorter driving distance than Route #2`);
          } else if (distSavedVs2 < 0 && delayAvoidedVs2 >= 3) {
            reasons.push(`+${Math.abs(distSavedVs2)} km detour to bypass severe traffic gridlock`);
          }
        }

        if (delayAvoidedVs2 >= 2) {
          reasons.push(`Avoids ${delayAvoidedVs2} mins of traffic congestion compared to Route #2`);
        }

        if (alt3) {
          const alt3DurMins = Math.round(alt3.estimatedDurationSeconds / 60);
          const alt3DistKm = Number((alt3.distanceMeters / 1000).toFixed(1));
          const timeSavedVs3 = alt3DurMins - topDurMins;
          const distSavedVs3 = Number((alt3DistKm - topDistKm).toFixed(1));
          if (timeSavedVs3 > 0) {
            reasons.push(`${timeSavedVs3} mins faster arrival than Route #3${distSavedVs3 > 0 ? ` & ${distSavedVs3} km shorter` : ''}`);
          }
        }

        reasons.push(`Highest overall AI score (${route.rankingScore}/100) balancing travel time, distance, and congestion`);

        // Build one-line comparison summary
        if (delayAvoidedVs2 >= 3) {
          comparisonSummary = `Saves ${delayAvoidedVs2}m traffic delay & arrives ${timeSavedVs2 > 0 ? `${timeSavedVs2}m faster` : 'earlier'} vs Alt #2${distSavedVs2 < 0 ? ` (+${Math.abs(distSavedVs2)} km detour)` : ''}`;
        } else if (timeSavedVs2 > 0 && distSavedVs2 > 0) {
          const vs3 = alt3 ? ` (${Math.round((alt3.estimatedDurationSeconds - topDuration) / 60)}m faster than #3)` : '';
          comparisonSummary = `Saves ${timeSavedVs2}m travel time & ${distSavedVs2} km shorter vs Alt #2${vs3}`;
        } else if (timeSavedVs2 > 0) {
          comparisonSummary = `${timeSavedVs2}m faster arrival than Alt #2${distSavedVs2 < 0 ? ` (+${Math.abs(distSavedVs2)} km detour)` : ''}`;
        } else if (distSavedVs2 > 0) {
          comparisonSummary = `${distSavedVs2} km shorter distance than Alt #2 with equal travel time`;
        } else {
          comparisonSummary = `Fastest and most efficient route among all ${scoredRoutes.length} alternatives`;
        }
      } else {
        reasons.push('Best overall weighted score balancing duration, congestion, and distance');
        comparisonSummary = 'Fastest and most efficient route for this journey';
      }

      if (reasons.length === 0) {
        reasons.push('Fastest estimated travel time among all candidate routes');
      }
    } else {
      comparisonBadge = rankIdx === 1 ? 'Why Ranked #2' : `Why Ranked #${rankIdx + 1}`;
      const timeAddedVsTop = durMins - topDurMins;
      const distDiffVsTop = Number((distKm - topDistKm).toFixed(1));
      const delayAddedVsTop = delayMins - topDelayMins;

      if (timeAddedVsTop > 0 && distDiffVsTop > 0) {
        reasons.push(`+${timeAddedVsTop} mins longer travel time & +${distDiffVsTop} km additional distance compared to Route #1`);
      } else {
        if (timeAddedVsTop > 0) {
          reasons.push(`+${timeAddedVsTop} mins longer travel time compared to Route #1`);
        }
        if (distDiffVsTop > 0) {
          reasons.push(`+${distDiffVsTop} km additional distance compared to Route #1`);
        } else if (distDiffVsTop < 0) {
          reasons.push(`${Math.abs(distDiffVsTop)} km shorter distance, but delayed by traffic vs Route #1`);
        }
      }

      if (delayAddedVsTop >= 2) {
        reasons.push(`+${delayAddedVsTop} mins higher congestion delay compared to Route #1`);
      }

      // Check relative to other alternatives
      const otherAlts = scoredRoutes
        .map((r, i) => ({ ...r, rankNumber: i + 1 }))
        .filter((_, idx) => idx !== 0 && idx !== rankIdx);
      let vsOtherText = '';
      if (otherAlts.length > 0) {
        const other = otherAlts[0];
        const otherDurMins = Math.round(other.estimatedDurationSeconds / 60);
        const diffWithOther = otherDurMins - durMins;
        if (diffWithOther > 0) {
          reasons.push(`${diffWithOther} mins faster arrival than Route #${other.rankNumber}`);
          vsOtherText = ` (but ${diffWithOther}m faster than #${other.rankNumber})`;
        } else if (diffWithOther < 0) {
          reasons.push(`${Math.abs(diffWithOther)} mins slower arrival than Route #${other.rankNumber}`);
          vsOtherText = ` (and ${Math.abs(diffWithOther)}m slower than #${other.rankNumber})`;
        }
      }

      // Add contextual role description
      if (rankIdx === 1) {
        reasons.push(`Viable secondary bypass option (Score ${route.rankingScore}/100) if Route #1 encounters unexpected congestion`);
      } else {
        reasons.push(`Substantial detour corridor (Score ${route.rankingScore}/100); lowest overall route efficiency`);
      }

      // One line summary
      if (delayAddedVsTop >= 3) {
        comparisonSummary = `+${delayAddedVsTop}m more traffic delay than #1, taking +${timeAddedVsTop}m total`;
      } else if (timeAddedVsTop > 0 && distDiffVsTop > 0) {
        comparisonSummary = `+${timeAddedVsTop}m longer & +${distDiffVsTop} km extra distance vs #1${vsOtherText}`;
      } else if (timeAddedVsTop > 0) {
        comparisonSummary = `+${timeAddedVsTop}m longer travel time than #1 (${distDiffVsTop < 0 ? `${Math.abs(distDiffVsTop)} km shorter` : 'same distance'})`;
      } else if (distDiffVsTop > 0) {
        comparisonSummary = `+${distDiffVsTop} km longer distance than #1 with equal travel time`;
      } else {
        comparisonSummary = `Viable alternative route with secondary ranking cost`;
      }

      if (reasons.length === 0) {
        reasons.push('Viable alternative route with secondary ranking cost');
      }
    }

    return {
      id: route.id,
      rank: rankIdx + 1,
      isRecommended,
      rankingScore: route.rankingScore,
      distanceMeters: route.distanceMeters,
      estimatedDurationSeconds: route.estimatedDurationSeconds,
      trafficDelaySeconds: route.trafficDelaySeconds,
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
    recommendedRouteId: rankedRoutes[0]?.id || null,
    routes: rankedRoutes.slice(0, 3) // Return up to three alternatives
  };
}

module.exports = {
  rankRoutes,
  minMaxNormalize
};
