import React from 'react';
import RouteCard from './RouteCard';
import { formatTime, formatDuration, formatDistance, formatDelay, getRouteComparison } from '../utils/formatters';

export default function RouteCardList({
  routes,
  selectedRouteId,
  onSelectRoute,
  updatedAt,
  loading
}) {
  if (loading) {
    return (
      <div className="glass-panel p-4 text-center mb-3">
        <div className="spinner-border text-info mx-auto mb-2" role="status" style={{ width: '2rem', height: '2rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="small text-light fw-semibold">Analyzing Traffic Flow & Computing Recommendations...</div>
        <div className="text-secondary" style={{ fontSize: '0.74rem' }}>Applying multi-criteria ranking model</div>
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="glass-panel p-4 text-center mb-3">
        <div className="text-secondary mb-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
        </div>
        <h6 className="fw-semibold text-white mb-1">No Routes Evaluated Yet</h6>
        <p className="text-secondary small mb-0">
          Enter origin and destination locations above and click <strong>Find & Rank Best Route</strong> to view alternatives.
        </p>
      </div>
    );
  }

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const selectedComp = getRouteComparison(selectedRoute, routes);
  const forecast = selectedRoute?.predictiveForecast;

  return (
    <div className="glass-panel p-3 mb-3">
      {/* Clean Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="d-flex align-items-center gap-2">
          <span style={{ color: 'var(--accent-cyan)' }}>◈</span>
          <span className="fw-bold text-light" style={{ fontSize: '0.90rem', letterSpacing: '0.2px' }}>
            Recommended Routes
          </span>
          <span
            className="badge rounded-pill"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.68rem'
            }}
          >
            {routes.length} Options
          </span>
        </div>

        {updatedAt && (
          <span className="text-secondary small" style={{ fontSize: '0.70rem' }}>
            {formatTime(updatedAt)}
          </span>
        )}
      </div>

      {/* Clean Route Options List */}
      <div className="d-flex flex-column gap-2 mb-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRecommended = route.isRecommended;
          const delayText = formatDelay(route.trafficDelaySeconds);
          const comp = getRouteComparison(route, routes);

          return (
            <div
              key={route.id}
              className={`route-option-row ${isSelected ? 'is-active' : ''} ${isRecommended ? 'is-recommended-row' : ''}`}
              onClick={() => onSelectRoute(route.id)}
            >
              <div className="d-flex align-items-center justify-content-between">
                {/* Left: Radio + Rank + Metrics */}
                <div className="d-flex align-items-center gap-3">
                  <div className="route-radio-indicator">
                    {isSelected && <div className="route-radio-indicator-dot" />}
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fs-5 fw-bold text-white lh-1">
                        {formatDuration(route.estimatedDurationSeconds)}
                      </span>

                      {isRecommended ? (
                        <span
                          className="badge rounded-pill fw-bold"
                          style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            fontSize: '0.66rem',
                            padding: '3px 8px'
                          }}
                        >
                          ★ FASTEST (#1)
                        </span>
                      ) : (
                        <span
                          className="badge rounded-pill"
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            fontSize: '0.66rem',
                            padding: '3px 8px'
                          }}
                        >
                          #{route.rank} ALT
                        </span>
                      )}

                      <span
                        className="badge rounded-pill"
                        style={{
                          backgroundColor: `${route.trafficColor || '#64748b'}20`,
                          color: route.trafficColor || '#94a3b8',
                          border: `1px solid ${route.trafficColor || '#ffffff'}35`,
                          fontSize: '0.66rem',
                          padding: '2px 7px'
                        }}
                      >
                        ● {route.trafficLabel || 'Normal'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.74rem' }}>
                      <span>{formatDistance(route.distanceMeters)}</span>
                      <span>•</span>
                      {delayText ? (
                        <span style={{ color: '#f87171' }}>{delayText}</span>
                      ) : (
                        <span style={{ color: '#86efac' }}>Free flow</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: AI Score */}
                <div className="text-end">
                  <div
                    className="fw-bold fs-6"
                    style={{
                      color: isRecommended ? '#4ade80' : (route.rankingScore > 50 ? 'var(--accent-cyan)' : '#94a3b8')
                    }}
                  >
                    {route.rankingScore}
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.65rem' }}>
                    AI Score
                  </div>
                </div>
              </div>

              {/* Comparative Reason for this route vs other alternatives */}
              <div className="route-comparison-box">
                {/* Header with comparison badge & headline */}
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="d-flex align-items-center gap-1 flex-wrap">
                    <span
                      className="badge rounded-pill fw-semibold"
                      style={{
                        backgroundColor: comp.badgeBg,
                        color: comp.badgeColor,
                        border: `1px solid ${comp.badgeColor}40`,
                        fontSize: '0.62rem',
                        padding: '2px 7px'
                      }}
                    >
                      {comp.badge}
                    </span>
                    <span className="fw-semibold text-light" style={{ fontSize: '0.72rem' }}>
                      {comp.headline}
                    </span>
                  </div>
                </div>

                {/* Plain-English summary comparison sentence */}
                <div className="text-secondary mb-2" style={{ fontSize: '0.73rem', lineHeight: '1.35' }}>
                  {comp.summary}
                </div>

                {/* Comparison Chips / Key Deltas */}
                {comp.comparisonChips && comp.comparisonChips.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                    {comp.comparisonChips.map((chip, idx) => (
                      <span
                        key={idx}
                        className={`comparison-chip comparison-chip-${chip.type}`}
                      >
                        {chip.label && <span className="opacity-75 me-1" style={{ fontSize: '0.58rem' }}>{chip.label}:</span>}
                        {chip.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Detailed comparative breakdown bullet points */}
                {comp.bulletReasons && comp.bulletReasons.length > 0 && (
                  <div className={`mt-2 pt-2 border-top border-secondary border-opacity-25 ${isSelected ? '' : 'd-none d-md-block'}`}>
                    <div className="d-flex flex-column gap-1">
                      {(isSelected ? comp.bulletReasons : comp.bulletReasons.slice(0, 2)).map((reason, idx) => (
                        <div key={idx} className="d-flex align-items-baseline gap-1" style={{ fontSize: '0.69rem' }}>
                          <span style={{ color: comp.badgeColor }}>•</span>
                          <span className="text-light opacity-90">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Matrix for All Evaluated Routes */}
      {routes.length > 1 && (
        <div className="p-2 rounded-3 mb-3" style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex align-items-center justify-content-between mb-2 px-1">
            <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>⇄</span>
              <strong className="text-light">Compare All {routes.length} Routes:</strong>
            </div>
            <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
              Side-by-Side Comparison
            </span>
          </div>

          <div className="table-responsive">
            <table className="comparison-matrix-table mb-0">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Time</th>
                  <th>Distance</th>
                  <th>Delay</th>
                  <th>Score</th>
                  <th>Why AI Ranked It</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => {
                  const rComp = getRouteComparison(r, routes);
                  const isCurrent = r.id === selectedRouteId;
                  const isRec = r.isRecommended;
                  return (
                    <tr
                      key={r.id}
                      className={isCurrent ? 'active-row' : ''}
                      onClick={() => onSelectRoute(r.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span
                          className="badge rounded-pill fw-semibold"
                          style={{
                            backgroundColor: rComp.badgeBg,
                            color: rComp.badgeColor,
                            border: `1px solid ${rComp.badgeColor}40`,
                            fontSize: '0.60rem',
                            padding: '2px 6px'
                          }}
                        >
                          {isRec ? '★ #1 Pick' : `#${r.rank} Alt`}
                        </span>
                      </td>
                      <td className="fw-semibold text-white">
                        {formatDuration(r.estimatedDurationSeconds)}
                      </td>
                      <td className="text-light">
                        {formatDistance(r.distanceMeters)}
                      </td>
                      <td>
                        {r.trafficDelaySeconds > 0 ? (
                          <span style={{ color: '#f87171' }}>+{Math.round(r.trafficDelaySeconds / 60)}m</span>
                        ) : (
                          <span style={{ color: '#86efac' }}>0m</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="fw-bold"
                          style={{
                            color: isRec ? '#4ade80' : (r.rankingScore > 50 ? 'var(--accent-cyan)' : '#94a3b8')
                          }}
                        >
                          {r.rankingScore}
                        </span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: '0.68rem', lineHeight: '1.25' }}>
                        <strong className="text-light">{rComp.headline}: </strong>
                        <span>{rComp.summary}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Route Spotlight & Comparative Analysis HUD */}
      {selectedRoute && (
        <div
          className="p-3 rounded-3"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Comparative Rationale vs Other Routes */}
          <div className="mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.74rem' }}>
                <span style={{ color: selectedRoute.isRecommended ? '#4ade80' : 'var(--accent-cyan)' }}>⇄</span>
                <strong className="text-light">
                  {selectedRoute.isRecommended ? 'Why This Route is #1 Pick:' : `Why Route #${selectedRoute.rank} is Alternative:`}
                </strong>
              </div>
              <span
                className="badge rounded-pill"
                style={{
                  backgroundColor: selectedComp.badgeBg,
                  color: selectedComp.badgeColor,
                  border: `1px solid ${selectedComp.badgeColor}40`,
                  fontSize: '0.62rem'
                }}
              >
                {selectedComp.badge}
              </span>
            </div>

            <div className="text-light mb-2 fw-medium" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
              {selectedComp.summary}
            </div>

            {Array.isArray(selectedRoute.recommendationReasons) && selectedRoute.recommendationReasons.length > 0 && (
              <div className="d-flex flex-column gap-1">
                {selectedRoute.recommendationReasons.map((reason, idx) => (
                  <div key={idx} className="d-flex align-items-baseline gap-1 text-secondary" style={{ fontSize: '0.71rem' }}>
                    <span style={{ color: selectedRoute.isRecommended ? '#4ade80' : 'var(--accent-cyan)' }}>•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 15-Min ML Predictive Forecast HUD */}
          {forecast && (
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>⚡</span>
                  <strong className="text-light">15-Min ML Traffic Forecast:</strong>
                  <span
                    className="badge rounded-pill ms-1"
                    style={{
                      backgroundColor: `${forecast.trendBadgeColor}25`,
                      color: forecast.trendBadgeColor,
                      border: `1px solid ${forecast.trendBadgeColor}40`,
                      fontSize: '0.68rem'
                    }}
                  >
                    {forecast.trendLabel}
                  </span>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.70rem' }}>
                  Confidence: <strong className="text-info">{Math.round(forecast.confidenceScore * 100)}%</strong>
                </div>
              </div>

              {/* 4-Step Forecast Sparkline Nodes */}
              {Array.isArray(forecast.timeline) && (
                <div className="d-flex justify-content-between gap-1 mb-1">
                  {forecast.timeline.map((step) => {
                    const isTarget = step.offsetMinutes === 15;
                    return (
                      <div
                        key={step.offsetMinutes}
                        className={`timeline-node text-center flex-fill py-1 px-1 ${isTarget ? 'highlight-target' : ''}`}
                      >
                        <div className="text-secondary" style={{ fontSize: '0.62rem' }}>{step.label}</div>
                        <div
                          className="fw-bold"
                          style={{
                            fontSize: '0.74rem',
                            color: step.delayMinutes > 25 ? '#fca5a5' : (step.delayMinutes > 10 ? '#fde047' : '#86efac')
                          }}
                        >
                          +{step.delayMinutes}m
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.58rem' }}>
                          {step.averageSpeedKmph} km/h
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mt-2 text-secondary" style={{ fontSize: '0.70rem' }}>
                <span>Predicted Slowdown: <strong className="text-light">+{forecast.predictedDelayMinutes} min</strong></span>
                <span className="text-info">● Active on Map</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
