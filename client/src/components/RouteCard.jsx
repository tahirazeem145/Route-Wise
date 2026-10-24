import React, { useState } from 'react';
import { formatDistance, formatDuration, formatDelay } from '../utils/formatters';

export default function RouteCard({ route, isSelected, onSelect }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const isRecommended = route.isRecommended;
  const delayText = formatDelay(route.trafficDelaySeconds);
  const forecast = route.predictiveForecast;

  // Build card classes
  let cardClass = 'route-card-modern p-3';
  if (isSelected) cardClass += ' is-selected';
  if (isRecommended) cardClass += ' is-recommended';

  // Primary highlight advantage (first reason or generated)
  const primaryAdvantage = route.recommendationReasons?.[0] || (isRecommended ? 'Optimal balance of transit time and free flow' : 'Alternative corridor bypass');

  return (
    <div
      className={cardClass}
      onClick={() => onSelect(route.id)}
      style={{
        borderLeft: isSelected ? '4px solid var(--accent-cyan)' : (isRecommended ? '4px solid #22c55e' : '4px solid rgba(255, 255, 255, 0.15)')
      }}
    >
      {/* Header Row: Rank Badge, Traffic Status, Score */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          {isRecommended ? (
            <span
              className="badge rounded-pill fw-bold"
              style={{
                background: 'rgba(34, 197, 94, 0.22)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.45)',
                fontSize: '0.70rem',
                padding: '4px 10px',
                boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)'
              }}
            >
              ★ #1 RECOMMENDED
            </span>
          ) : (
            <span
              className="badge rounded-pill"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                fontSize: '0.70rem',
                padding: '4px 9px'
              }}
            >
              #{route.rank} ALTERNATIVE
            </span>
          )}

          <span
            className="badge rounded-pill"
            style={{
              backgroundColor: `${route.trafficColor || '#64748b'}20`,
              color: route.trafficColor || '#94a3b8',
              border: `1px solid ${route.trafficColor || '#ffffff'}40`,
              fontSize: '0.68rem',
              padding: '3px 8px'
            }}
          >
            ● {route.trafficLabel || 'Normal'}
          </span>
        </div>

        {/* Score Pill */}
        <div className="d-flex align-items-center gap-1 font-monospace" style={{ fontSize: '0.70rem' }}>
          <span className="text-secondary">Score:</span>
          <span
            className="fw-bold px-1 rounded"
            style={{
              color: isRecommended ? '#4ade80' : 'var(--accent-cyan)',
              background: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            {route.rankingScore}
          </span>
          <span className="text-muted">/100</span>
        </div>
      </div>

      {/* Main Metrics: Large Duration, Distance, Delay */}
      <div className="d-flex align-items-baseline justify-content-between mb-2">
        <div className="d-flex align-items-baseline gap-2">
          <span className="fs-3 fw-bold text-white font-monospace" style={{ letterSpacing: '-0.5px' }}>
            {formatDuration(route.estimatedDurationSeconds)}
          </span>
          <span className="text-secondary small font-monospace">
            • {formatDistance(route.distanceMeters)}
          </span>
        </div>

        {delayText ? (
          <span
            className="badge rounded-pill font-monospace"
            style={{
              fontSize: '0.70rem',
              background: 'rgba(239, 68, 68, 0.18)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.35)'
            }}
          >
            {delayText}
          </span>
        ) : (
          <span
            className="badge rounded-pill font-monospace"
            style={{
              fontSize: '0.70rem',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#86efac',
              border: '1px solid rgba(34, 197, 94, 0.35)'
            }}
          >
            ✓ Free Flow
          </span>
        )}
      </div>

      {/* Clean Single-Line Highlight Advantage */}
      <div className="d-flex align-items-center gap-1 mb-2 text-light" style={{ fontSize: '0.74rem' }}>
        <span style={{ color: isRecommended ? '#4ade80' : 'var(--accent-cyan)' }}>✦</span>
        <span style={{ color: '#cbd5e1' }}>{primaryAdvantage}</span>
      </div>

      {/* 15-Min ML Predictive Forecast Strip */}
      {forecast && (
        <div
          className="p-2 rounded-3 mt-2"
          style={{
            background: 'rgba(11, 17, 32, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>⚡</span>
              <strong className="text-light">+15m ML Trend:</strong>
              <span
                className="badge font-monospace px-1 py-0.5 rounded"
                style={{
                  backgroundColor: `${forecast.trendBadgeColor}25`,
                  color: forecast.trendBadgeColor,
                  border: `1px solid ${forecast.trendBadgeColor}40`,
                  fontSize: '0.66rem'
                }}
              >
                {forecast.trendLabel}
              </span>
              <span className="text-secondary font-monospace" style={{ fontSize: '0.66rem' }}>
                (+{forecast.predictedDelayMinutes}m)
              </span>
            </div>

            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none"
              style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeline(!showTimeline);
              }}
            >
              {showTimeline ? '▲ Less' : '▼ Timeline'}
            </button>
          </div>

          {/* Expandable Timeline Sparkline */}
          {showTimeline && Array.isArray(forecast.timeline) && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex justify-content-between gap-1">
                {forecast.timeline.map((step) => {
                  const isTarget = step.offsetMinutes === 15;
                  return (
                    <div
                      key={step.offsetMinutes}
                      className={`timeline-node text-center flex-fill ${isTarget ? 'highlight-target' : ''}`}
                    >
                      <div className="text-secondary" style={{ fontSize: '0.60rem' }}>{step.label}</div>
                      <div
                        className="fw-bold font-monospace"
                        style={{
                          fontSize: '0.72rem',
                          color: step.delayMinutes > 25 ? '#fca5a5' : (step.delayMinutes > 10 ? '#fde047' : '#86efac')
                        }}
                      >
                        +{step.delayMinutes}m
                      </div>
                      <div className="text-muted font-monospace" style={{ fontSize: '0.56rem' }}>
                        {step.averageSpeedKmph} km/h
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 text-secondary text-end font-monospace" style={{ fontSize: '0.62rem' }}>
                Confidence: <span className="text-info">{Math.round(forecast.confidenceScore * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Selection Status Pill */}
      <div className="d-flex align-items-center justify-content-between mt-2 pt-1">
        <span className="font-monospace" style={{ fontSize: '0.68rem', color: isSelected ? 'var(--accent-cyan)' : '#64748b' }}>
          {isSelected ? '● Active on Map' : 'Click to highlight route'}
        </span>
        {isSelected && (
          <span
            className="badge rounded-pill"
            style={{
              background: 'rgba(56, 189, 248, 0.18)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              fontSize: '0.64rem',
              padding: '2px 7px'
            }}
          >
            SELECTED
          </span>
        )}
      </div>
    </div>
  );
}
