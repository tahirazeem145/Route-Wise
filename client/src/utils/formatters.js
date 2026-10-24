export function formatDistance(meters) {
  if (!meters && meters !== 0) return '0 km';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '0 min';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDelay(seconds) {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.round(seconds / 60);
  if (mins === 0) return null;
  return `+${mins} min delay`;
}

export function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return String(isoString);
  }
}

/**
 * Calculates comparative reasoning for a route against all other evaluated alternatives.
 * Explains why Route #1 is recommended over others, and why #2 or #3 were placed lower.
 */
export function getRouteComparison(route, allRoutes = []) {
  if (!route) {
    return {
      badge: 'Route Option',
      badgeColor: '#94a3b8',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      headline: 'Route Details',
      summary: 'Route option evaluated by multi-criteria ranking model.',
      comparisonChips: [],
      bulletReasons: []
    };
  }

  if (!Array.isArray(allRoutes) || allRoutes.length <= 1) {
    return {
      badge: '★ Sole Route',
      badgeColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      headline: 'Single Available Corridor',
      summary: 'Only available driving corridor returned by provider for this origin and destination.',
      comparisonChips: [
        { label: 'Time', value: formatDuration(route.estimatedDurationSeconds), type: 'neutral' },
        { label: 'Distance', value: formatDistance(route.distanceMeters), type: 'neutral' }
      ],
      bulletReasons: [
        'Sole driving corridor available between origin and destination',
        `${formatDistance(route.distanceMeters)} total distance with ${formatDuration(route.estimatedDurationSeconds)} transit time`
      ]
    };
  }

  // Sort routes by rank to ensure consistent ordering
  const sorted = [...allRoutes].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  const topRoute = sorted.find(r => r.rank === 1 || r.isRecommended) || sorted[0];
  const isTop = route.id === topRoute.id || route.rank === 1;

  const curDurMins = Math.round((route.estimatedDurationSeconds || 0) / 60);
  const curDistKm = Number(((route.distanceMeters || 0) / 1000).toFixed(1));
  const curDelayMins = Math.round((route.trafficDelaySeconds || 0) / 60);

  const topDurMins = Math.round((topRoute.estimatedDurationSeconds || 0) / 60);
  const topDistKm = Number(((topRoute.distanceMeters || 0) / 1000).toFixed(1));
  const topDelayMins = Math.round((topRoute.trafficDelaySeconds || 0) / 60);

  if (isTop) {
    // Compare Top (#1) against Route #2 and Route #3
    const alt2 = sorted.find(r => r.id !== topRoute.id);
    const alt3 = sorted.filter(r => r.id !== topRoute.id)[1];

    const chips = [];
    const bulletReasons = [];
    let summary = '';
    let headline = 'Fastest & Most Direct Route';

    if (alt2) {
      const alt2DurMins = Math.round((alt2.estimatedDurationSeconds || 0) / 60);
      const alt2DistKm = Number(((alt2.distanceMeters || 0) / 1000).toFixed(1));
      const alt2DelayMins = Math.round((alt2.trafficDelaySeconds || 0) / 60);

      const timeSavedVs2 = alt2DurMins - curDurMins;
      const distSavedVs2 = Number((alt2DistKm - curDistKm).toFixed(1));
      const delaySavedVs2 = alt2DelayMins - curDelayMins;

      if (timeSavedVs2 > 0) {
        chips.push({ label: 'vs Route #2', value: `${timeSavedVs2}m faster`, type: 'positive' });
      }
      if (distSavedVs2 > 0) {
        chips.push({ label: 'vs Route #2', value: `${distSavedVs2} km shorter`, type: 'positive' });
      } else if (distSavedVs2 < 0) {
        chips.push({ label: 'vs Route #2', value: `+${Math.abs(distSavedVs2)} km detour`, type: 'warning' });
      }
      if (delaySavedVs2 >= 2) {
        chips.push({ label: 'Traffic', value: `Avoids ${delaySavedVs2}m jam`, type: 'positive' });
      }

      if (timeSavedVs2 > 0 && distSavedVs2 > 0) {
        bulletReasons.push(`Saves ${timeSavedVs2} mins travel time & ${distSavedVs2} km shorter distance than Route #2 (${formatDuration(route.estimatedDurationSeconds)} vs ${formatDuration(alt2.estimatedDurationSeconds)})`);
      } else if (timeSavedVs2 > 0) {
        bulletReasons.push(`${timeSavedVs2} mins faster arrival than Route #2 (${formatDuration(route.estimatedDurationSeconds)} vs ${formatDuration(alt2.estimatedDurationSeconds)})`);
      } else if (distSavedVs2 > 0) {
        bulletReasons.push(`${distSavedVs2} km shorter driving distance than Route #2`);
      }

      if (delaySavedVs2 >= 2) {
        bulletReasons.push(`Avoids ${delaySavedVs2} mins of traffic congestion bottlenecks compared to Route #2`);
      }

      let vs3Text = '';
      if (alt3) {
        const alt3DurMins = Math.round((alt3.estimatedDurationSeconds || 0) / 60);
        const alt3DistKm = Number(((alt3.distanceMeters || 0) / 1000).toFixed(1));
        const timeSavedVs3 = alt3DurMins - curDurMins;
        const distSavedVs3 = Number((alt3DistKm - curDistKm).toFixed(1));

        if (timeSavedVs3 > 0) {
          chips.push({ label: 'vs Route #3', value: `${timeSavedVs3}m faster`, type: 'positive' });
          vs3Text = ` (${timeSavedVs3}m faster than Route #3)`;
          bulletReasons.push(`${timeSavedVs3} mins faster arrival & ${distSavedVs3 > 0 ? `${distSavedVs3} km shorter` : 'direct path'} than Route #3 (${formatDuration(route.estimatedDurationSeconds)} vs ${formatDuration(alt3.estimatedDurationSeconds)})`);
        }
      }

      bulletReasons.push(`Highest composite AI efficiency score (${route.rankingScore || 85}/100) combining duration, distance, and free-flow traffic`);

      if (delaySavedVs2 >= 3) {
        summary = `Avoids ${delaySavedVs2}m traffic delay & arrives ${timeSavedVs2 > 0 ? `${timeSavedVs2}m faster` : 'earlier'} than Route #2${vs3Text}`;
      } else if (timeSavedVs2 > 0 && distSavedVs2 > 0) {
        summary = `Saves ${timeSavedVs2}m travel time & is ${distSavedVs2} km shorter than Route #2${vs3Text}`;
      } else if (timeSavedVs2 > 0) {
        summary = `Arrives ${timeSavedVs2}m faster than Route #2${vs3Text}`;
      } else {
        summary = `Optimal and most direct corridor among all ${allRoutes.length} available alternatives`;
      }
    } else {
      summary = 'Optimal driving route balancing duration and distance';
      bulletReasons.push('Optimal driving route balancing duration and distance');
    }

    return {
      badge: '★ Why Suggested #1',
      badgeColor: '#4ade80',
      badgeBg: 'rgba(34, 197, 94, 0.18)',
      headline,
      summary: route.comparisonSummary || summary,
      comparisonChips: chips,
      bulletReasons: route.recommendationReasons?.length ? route.recommendationReasons : bulletReasons,
      isTop: true
    };
  } else {
    // Non-top route: compare against Route #1 and other alternatives
    const timeAddedVsTop = curDurMins - topDurMins;
    const distDiffVsTop = Number((curDistKm - topDistKm).toFixed(1));
    const delayAddedVsTop = curDelayMins - topDelayMins;

    const chips = [];
    const bulletReasons = [];

    if (timeAddedVsTop > 0) {
      chips.push({ label: 'vs Route #1', value: `+${timeAddedVsTop}m slower`, type: 'negative' });
    }
    if (distDiffVsTop > 0) {
      chips.push({ label: 'vs Route #1', value: `+${distDiffVsTop} km longer`, type: 'negative' });
    } else if (distDiffVsTop < 0) {
      chips.push({ label: 'vs Route #1', value: `${Math.abs(distDiffVsTop)} km shorter`, type: 'positive' });
    }
    if (delayAddedVsTop >= 2) {
      chips.push({ label: 'Traffic vs #1', value: `+${delayAddedVsTop}m delay`, type: 'negative' });
    }

    if (timeAddedVsTop > 0 && distDiffVsTop > 0) {
      bulletReasons.push(`Takes +${timeAddedVsTop} mins longer and +${distDiffVsTop} km additional distance compared to Route #1 (${formatDuration(route.estimatedDurationSeconds)} vs ${formatDuration(topRoute.estimatedDurationSeconds)})`);
    } else if (timeAddedVsTop > 0) {
      bulletReasons.push(`Takes +${timeAddedVsTop} mins longer travel time compared to Route #1 (${formatDuration(route.estimatedDurationSeconds)} vs ${formatDuration(topRoute.estimatedDurationSeconds)})`);
    } else if (distDiffVsTop > 0) {
      bulletReasons.push(`Requires +${distDiffVsTop} km longer driving distance than Route #1`);
    }

    if (delayAddedVsTop >= 2) {
      bulletReasons.push(`Faces +${delayAddedVsTop} mins higher congestion delay compared to Route #1`);
    }

    // Compare with the other alternative (e.g. #2 vs #3, or #3 vs #2)
    const otherAlts = sorted.filter(r => r.id !== topRoute.id && r.id !== route.id);
    let vsOtherText = '';
    if (otherAlts.length > 0) {
      const other = otherAlts[0];
      const otherDurMins = Math.round((other.estimatedDurationSeconds || 0) / 60);
      const otherDistKm = Number(((other.distanceMeters || 0) / 1000).toFixed(1));
      const diffWithOtherTime = otherDurMins - curDurMins;
      const diffWithOtherDist = Number((otherDistKm - curDistKm).toFixed(1));

      if (diffWithOtherTime > 0) {
        chips.push({ label: `vs Route #${other.rank || 3}`, value: `${diffWithOtherTime}m faster`, type: 'positive' });
        vsOtherText = ` (but ${diffWithOtherTime}m faster than Route #${other.rank || 3})`;
        bulletReasons.push(`${diffWithOtherTime} mins faster arrival than Route #${other.rank || 3}${diffWithOtherDist > 0 ? ` & ${diffWithOtherDist} km shorter` : ''}`);
      } else if (diffWithOtherTime < 0) {
        chips.push({ label: `vs Route #${other.rank || 2}`, value: `${Math.abs(diffWithOtherTime)}m slower`, type: 'negative' });
        vsOtherText = ` (and ${Math.abs(diffWithOtherTime)}m slower than Route #${other.rank || 2})`;
        bulletReasons.push(`${Math.abs(diffWithOtherTime)} mins slower arrival than Route #${other.rank || 2}${diffWithOtherDist < 0 ? ` (+${Math.abs(diffWithOtherDist)} km longer)` : ''}`);
      }
    }

    const isRank2 = route.rank === 2;
    if (isRank2) {
      bulletReasons.push(`Viable secondary alternative (AI Score: ${route.rankingScore || 59}/100) if Route #1 encounters unexpected incidents or lane closures`);
    } else {
      bulletReasons.push(`Tertiary bypass corridor (AI Score: ${route.rankingScore || 15}/100) with substantial travel time and distance penalty`);
    }

    let summary = '';
    if (delayAddedVsTop >= 3) {
      summary = `+${delayAddedVsTop}m more traffic delay than Route #1, taking +${timeAddedVsTop}m total`;
    } else if (timeAddedVsTop > 0 && distDiffVsTop > 0) {
      summary = `+${timeAddedVsTop}m longer travel time & +${distDiffVsTop} km extra distance vs Route #1${vsOtherText}`;
    } else if (timeAddedVsTop > 0) {
      summary = `+${timeAddedVsTop}m longer arrival than Route #1 (${distDiffVsTop < 0 ? `${Math.abs(distDiffVsTop)} km shorter` : 'same distance'})${vsOtherText}`;
    } else {
      summary = `Alternative corridor with secondary ranking score vs Route #1`;
    }

    return {
      badge: isRank2 ? '⇄ Why Ranked #2' : `⚠️ Why Ranked #${route.rank || 3}`,
      badgeColor: isRank2 ? '#38bdf8' : '#f87171',
      badgeBg: isRank2 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(239, 68, 68, 0.16)',
      headline: isRank2 ? `Secondary Alternative (+${timeAddedVsTop}m vs #1)` : `Longest Corridor (+${timeAddedVsTop}m vs #1)`,
      summary: route.comparisonSummary || summary,
      comparisonChips: chips,
      bulletReasons: route.recommendationReasons?.length ? route.recommendationReasons : bulletReasons,
      isTop: false
    };
  }
}

