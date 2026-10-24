/**
 * Traffic Severity Classification Service
 * 
 * Classifies traffic conditions into standard categories:
 * - low (Green #22c55e): minimal delay (<15% of free-flow time)
 * - moderate (Yellow #eab308): moderate slowdowns (15% to 40% of free-flow time)
 * - heavy (Red #ef4444): severe congestion (>=40% of free-flow time)
 * 
 * NOTE: This is strictly traffic severity, separate from the route recommendation ranking.
 */

const SEVERITY_LEVELS = {
  LOW: {
    severity: 'low',
    color: '#22c55e',
    label: 'Low Traffic',
    maxRatio: 0.15
  },
  MODERATE: {
    severity: 'moderate',
    color: '#eab308',
    label: 'Moderate Traffic',
    maxRatio: 0.40
  },
  HEAVY: {
    severity: 'heavy',
    color: '#ef4444',
    label: 'Heavy Congestion'
  }
};

function classifyTrafficSeverity(estimatedDurationSeconds = 0, trafficDelaySeconds = 0) {
  const duration = Math.max(0, Number(estimatedDurationSeconds) || 0);
  const delay = Math.max(0, Number(trafficDelaySeconds) || 0);

  if (duration === 0 || delay === 0) {
    return {
      severity: SEVERITY_LEVELS.LOW.severity,
      color: SEVERITY_LEVELS.LOW.color,
      label: SEVERITY_LEVELS.LOW.label,
      delayRatio: 0,
      delayMinutes: 0
    };
  }

  // Free flow time is total estimated duration minus traffic delay
  const freeFlowTime = Math.max(1, duration - delay);
  const delayRatio = Number((delay / freeFlowTime).toFixed(3));
  const delayMinutes = Math.round(delay / 60);

  let resultLevel;
  if (delayRatio < SEVERITY_LEVELS.LOW.maxRatio) {
    resultLevel = SEVERITY_LEVELS.LOW;
  } else if (delayRatio < SEVERITY_LEVELS.MODERATE.maxRatio) {
    resultLevel = SEVERITY_LEVELS.MODERATE;
  } else {
    resultLevel = SEVERITY_LEVELS.HEAVY;
  }

  return {
    severity: resultLevel.severity,
    color: resultLevel.color,
    label: resultLevel.label,
    delayRatio,
    delayMinutes
  };
}

module.exports = {
  classifyTrafficSeverity,
  SEVERITY_LEVELS
};
