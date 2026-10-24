import React from 'react';
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
    <div className="d-flex flex-column gap-3 mb-4">
      {/* 1. Header Overview Card */}
      <div className="glass-panel p-3">
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
            <span
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 26,
                height: 26,
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 14 14"/>
              </svg>
            </span>
            <span>Evaluated Route Alternatives</span>
          </h6>
          <span className="badge font-monospace" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
            {routes.length} Options {updatedAt ? `• ${formatTime(updatedAt)}` : ''}
          </span>
        </div>
      </div>

      {/* 2. Each Route Alternative Card (Formatted like Plan & Rank Route Card) */}
      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isRecommended = route.isRecommended;
        const delayText = formatDelay(route.trafficDelaySeconds);
        const comp = getRouteComparison(route, routes);

        // Indicator colors based on rank
        const rankColor = isRecommended ? '#22c55e' : (route.rank === 2 ? '#38bdf8' : '#c084fc');
        const rankBg = isRecommended ? 'rgba(34, 197, 94, 0.2)' : (route.rank === 2 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(192, 132, 252, 0.2)');
        const rankBorder = isRecommended ? 'rgba(34, 197, 94, 0.45)' : (route.rank === 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(192, 132, 252, 0.45)');

        return (
          <div
            key={route.id}
            className={`route-card-glass p-3 ${isSelected ? 'is-active' : ''} ${isRecommended ? 'is-recommended-card' : ''}`}
            onClick={() => onSelectRoute(route.id)}
          >
            {/* Top Card Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <span
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 26,
                    height: 26,
                    background: rankBg,
                    border: `1px solid ${rankBorder}`,
                    color: rankColor,
                    fontSize: '0.80rem',
                    fontWeight: 'bold'
                  }}
                >
                  {isRecommended ? '★' : route.rank}
                </span>
                <span className="text-truncate" style={{ maxWidth: 210 }}>
                  {route.summary || route.name || (isRecommended ? 'Fastest Highway Route' : `Alternative Route #${route.rank}`)}
                </span>
              </h6>

              {/* Top-Right Pill Badge */}
              {isRecommended ? (
                <span
                  className="badge font-monospace"
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(34, 197, 94, 0.22)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.45)'
                  }}
                >
                  ★ FASTEST (#1)
                </span>
              ) : (
                <span
                  className="badge font-monospace"
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.16)'
                  }}
                >
                  #{route.rank} ALTERNATIVE
                </span>
              )}
            </div>

            {/* A: Travel Duration Section */}
            <div className="mb-2">
              <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                  style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#22c55e', fontWeight: 'bold' }}
                >
                  A
                </span>
                <span className="text-light">Estimated Travel Duration</span>
              </label>

              <div className="card-field-box d-flex align-items-center justify-content-between">
                <div className="fs-5 fw-bold text-white lh-1">
                  {formatDuration(route.estimatedDurationSeconds)}
                </div>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: `${route.trafficColor || '#64748b'}20`,
                    color: route.trafficColor || '#94a3b8',
                    border: `1px solid ${route.trafficColor || '#ffffff'}35`,
                    fontSize: '0.68rem',
                    padding: '3px 8px'
                  }}
                >
                  ● {route.trafficLabel || 'Normal'}
                </span>
              </div>
            </div>

            {/* B: Distance & Delay Section */}
            <div className="mb-3">
              <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
                <span
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                  style={{
                    width: 18,
                    height: 18,
                    fontSize: '0.65rem',
                    background: route.trafficDelaySeconds > 600 ? '#ef4444' : '#0284c7',
                    fontWeight: 'bold'
                  }}
                >
                  B
                </span>
                <span className="text-light">Total Distance & Delay</span>
              </label>

              <div className="card-field-box d-flex align-items-center justify-content-between">
                <div className="fw-semibold text-white" style={{ fontSize: '0.88rem' }}>
                  {formatDistance(route.distanceMeters)}
                </div>
                {delayText ? (
                  <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.78rem' }}>
                    {delayText}
                  </span>
                ) : (
                  <span style={{ color: '#86efac', fontWeight: 500, fontSize: '0.78rem' }}>
                    Free flow (0m delay)
                  </span>
                )}
              </div>
            </div>

            {/* Quick Presets / Highlights (Matches Quick Route Presets style) */}
            <div className="mb-3">
              <span className="d-block mb-1.5 fw-semibold" style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                Why AI Ranked This Route:
              </span>
              <div className="d-flex flex-wrap gap-1.5">
                {comp.comparisonChips && comp.comparisonChips.length > 0 ? (
                  comp.comparisonChips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="glass-preset-pill"
                    >
                      {chip.value}
                    </span>
                  ))
                ) : (
                  <span className="glass-preset-pill">
                    {isRecommended ? 'Optimal transit time & flow' : `Corridor Bypass #${route.rank}`}
                  </span>
                )}
                <span
                  className="glass-preset-pill"
                  style={{
                    borderColor: isRecommended ? 'rgba(34, 197, 94, 0.45)' : 'rgba(56, 189, 248, 0.45)',
                    color: isRecommended ? '#86efac' : '#38bdf8'
                  }}
                >
                  AI Score: {route.rankingScore}/100
                </span>
              </div>
            </div>

            {/* Detailed Explanation / Bullets */}
            <div className="text-secondary mb-3" style={{ fontSize: '0.74rem', lineHeight: '1.4' }}>
              {comp.summary}
            </div>

            {/* Footer Status Row (Matches Live Auto-Refresh style) */}
            <div className="d-flex align-items-center justify-content-between pt-2 border-top border-white border-opacity-10">
              <div className="d-flex align-items-center gap-1.5">
                {isSelected ? (
                  <span
                    className="badge rounded-pill text-info d-inline-flex align-items-center gap-1"
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      fontSize: '0.70rem',
                      padding: '3px 9px'
                    }}
                  >
                    ● Active on Live Map
                  </span>
                ) : (
                  <span className="text-secondary small" style={{ fontSize: '0.72rem' }}>
                    Click card to view on map
                  </span>
                )}
              </div>

              <div className="text-end">
                <span className="text-secondary me-1" style={{ fontSize: '0.70rem' }}>Rank:</span>
                <strong style={{ color: isRecommended ? '#4ade80' : 'var(--accent-cyan)', fontSize: '0.82rem' }}>
                  #{route.rank} of {routes.length}
                </strong>
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. Cross-Route Comparison Matrix Card */}
      {routes.length > 1 && (
        <div className="glass-panel p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 26,
                  height: 26,
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5"/>
                  <path d="M4 20L21 3"/>
                  <path d="M21 16v5h-5"/>
                  <path d="M15 15l6 6"/>
                  <path d="M4 4l5 5"/>
                </svg>
              </span>
              <span>Cross-Route Comparison Matrix</span>
            </h6>
            <span className="badge font-monospace" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
              Side-by-Side
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

      {/* 4. 15-Min ML Predictive Forecast Card */}
      {forecast && (
        <div className="glass-panel p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 26,
                  height: 26,
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </span>
              <span>15-Min ML Traffic Forecast</span>
            </h6>

            <a
              href="https://github.com/zemlyansky/arima"
              target="_blank"
              rel="noopener noreferrer"
              className="badge font-monospace text-decoration-none"
              style={{
                fontSize: '0.68rem',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '3px 8px'
              }}
              title="Powered by official open-source ARIMA time-series model (https://github.com/zemlyansky/arima)"
            >
              ARIMA (1,0,1) ↗
            </a>
          </div>

          {/* Section A: Flow Trend & Confidence */}
          <div className="mb-2">
            <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#eab308', fontWeight: 'bold' }}
              >
                A
              </span>
              <span className="text-light">Traffic Trend & Confidence</span>
            </label>

            <div className="card-field-box d-flex align-items-center justify-content-between">
              <span
                className="badge rounded-pill fw-semibold"
                style={{
                  backgroundColor: `${forecast.trendBadgeColor}25`,
                  color: forecast.trendBadgeColor,
                  border: `1px solid ${forecast.trendBadgeColor}40`,
                  fontSize: '0.72rem',
                  padding: '4px 9px'
                }}
              >
                {forecast.trendLabel}
              </span>
              <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                Confidence: <strong className="text-info">{Math.round(forecast.confidenceScore * 100)}%</strong>
              </div>
            </div>
          </div>

          {/* Section B: Multi-Horizon Forecast Timeline */}
          <div className="mb-3">
            <label className="form-label small text-secondary mb-1.5 fw-semibold d-flex align-items-center gap-1">
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#38bdf8', fontWeight: 'bold' }}
              >
                B
              </span>
              <span className="text-light">Predictive Velocity Horizons</span>
            </label>

            {Array.isArray(forecast.timeline) && (
              <div className="d-flex justify-content-between gap-1.5">
                {forecast.timeline.map((step) => {
                  const isTarget = step.offsetMinutes === 15;
                  const isLive = step.offsetMinutes === 0;
                  return (
                    <div
                      key={step.offsetMinutes}
                      className={`timeline-node text-center flex-fill py-2 px-1 ${isTarget ? 'highlight-target' : ''}`}
                      style={{
                        background: isTarget ? 'rgba(56, 189, 248, 0.14)' : 'var(--glass-surface-input)',
                        border: isTarget ? '1px solid rgba(56, 189, 248, 0.50)' : '1px solid var(--glass-border)',
                        borderRadius: '8px'
                      }}
                    >
                      <div className="text-secondary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        {isLive ? 'Current Live' : `+${step.offsetMinutes} min`}
                      </div>
                      <div
                        className="fw-bold my-1"
                        style={{
                          fontSize: '0.82rem',
                          color: step.delayMinutes > 25 ? '#fca5a5' : (step.delayMinutes > 10 ? '#fde047' : '#86efac')
                        }}
                      >
                        {formatDuration(step.durationSeconds)}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.64rem' }}>
                        {step.averageSpeedKmph} km/h
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actionable Recommendation Footer */}
          <div className="d-flex justify-content-between align-items-center pt-2 border-top border-white border-opacity-10 text-secondary" style={{ fontSize: '0.74rem' }}>
            <span>
              {forecast.recommendation ? (
                <strong className="text-light">{forecast.recommendation}</strong>
              ) : (
                <>Predicted Slowdown: <strong className="text-light">+{forecast.predictedDelayMinutes} min</strong></>
              )}
            </span>
            <span className="text-info font-monospace ms-2" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
              ● ML Engine Live
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
