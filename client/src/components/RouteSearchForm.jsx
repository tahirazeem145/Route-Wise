import React, { useState } from 'react';

const PRESETS = [
  { label: 'Trichy → Coimbatore', src: 'Tiruchirappalli', dst: 'Coimbatore' },
  { label: 'Salem → Bangalore', src: 'Salem', dst: 'Bangalore' },
  { label: 'Chennai → Madurai', src: 'Chennai', dst: 'Madurai' }
];

export default function RouteSearchForm({
  source,
  setSource,
  destination,
  setDestination,
  onSubmit,
  onRefresh,
  loading,
  refreshing,
  hasResults,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  refreshCountdown,
  weights,
  setWeights
}) {
  const [showWeights, setShowWeights] = useState(false);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handlePreset = (preset) => {
    setSource(preset.src);
    setDestination(preset.dst);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (source.trim() && destination.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="glass-panel p-3 mb-3">
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
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
          </span>
          <span>Plan & Rank Route</span>
        </h6>
        <span className="badge font-monospace" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
          AI Engine
        </span>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Source Input */}
        <div className="mb-2">
          <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
              style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#22c55e', fontWeight: 'bold' }}
            >
              A
            </span>
            <span className="text-light">Origin Location</span>
          </label>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control glass-input"
              placeholder="e.g. Tiruchirappalli or 10.79, 78.70"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
              disabled={loading}
            />
            {source && (
              <button
                type="button"
                className="btn glass-btn-secondary"
                onClick={() => setSource('')}
                title="Clear origin"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Quick Swap Button */}
        <div className="text-center my-2">
          <button
            type="button"
            className="btn glass-swap-btn d-inline-flex align-items-center gap-1.5"
            onClick={handleSwap}
            title="Swap origin and destination"
            disabled={loading}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 10 12 15 17 10"/>
              <polyline points="17 14 12 9 7 14"/>
            </svg>
            <span>Swap</span>
          </button>
        </div>

        {/* Destination Input */}
        <div className="mb-3">
          <label className="form-label small mb-1 fw-semibold d-flex align-items-center gap-1" style={{ color: '#e2e8f0' }}>
            <span
              className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
              style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#ef4444', fontWeight: 'bold' }}
            >
              B
            </span>
            <span className="text-light">Destination Location</span>
          </label>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control glass-input"
              placeholder="e.g. Coimbatore or 11.01, 76.95"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              disabled={loading}
            />
            {destination && (
              <button
                type="button"
                className="btn glass-btn-secondary"
                onClick={() => setDestination('')}
                title="Clear destination"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-3">
          <span className="d-block mb-1 fw-semibold" style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
            Quick Route Presets:
          </span>
          <div className="d-flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="glass-preset-pill"
                onClick={() => handlePreset(p)}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2 mb-3">
          <button
            type="submit"
            className="btn glass-btn-primary d-flex align-items-center justify-content-center gap-2 py-2"
            disabled={loading || !source.trim() || !destination.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Evaluating Live Routes...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                <span>Find & Rank Best Route</span>
              </>
            )}
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn glass-btn-secondary btn-sm d-flex align-items-center justify-content-center gap-2 py-1"
              onClick={onRefresh}
              disabled={refreshing || loading}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Refreshing Delays...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span>Refresh Traffic Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        {hasResults && (
          <div
            className="pt-2 d-flex align-items-center justify-content-between"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="autoRefreshSwitch"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              />
              <label className="form-check-label small text-secondary" htmlFor="autoRefreshSwitch">
                Live Auto-Refresh (60s)
              </label>
            </div>
            {autoRefreshEnabled && (
              <span
                className="badge font-monospace"
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {refreshCountdown}s
              </span>
            )}
          </div>
        )}

        {/* Ranking Weights Toggle */}
        <div className="mt-2 text-center">
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold"
            style={{ fontSize: '0.74rem', color: '#38bdf8' }}
            onClick={() => setShowWeights(!showWeights)}
          >
            {showWeights ? '▲ Hide Ranking Weights' : '⚙ Customize Criteria Weights'}
          </button>
        </div>

        {/* Collapsible Weights Sliders */}
        {showWeights && (
          <div
            className="mt-2 p-3 rounded-3"
            style={{
              background: 'rgba(14, 14, 18, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-white fw-semibold">Multi-Criteria Weights</span>
              <span
                className="badge font-monospace"
                style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.12)', color: '#e2e8f0' }}
              >
                Normalized
              </span>
            </div>

            {/* Travel Time Weight */}
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                <span className="fw-medium">Travel Time</span>
                <span className="text-info fw-bold font-monospace">{Math.round(weights.weightTime * 100)}%</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.weightTime}
                onChange={(e) => setWeights({ ...weights, weightTime: parseFloat(e.target.value) })}
              />
            </div>

            {/* Traffic Delay Weight */}
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                <span className="fw-medium">Traffic Congestion Delay</span>
                <span className="text-warning fw-bold font-monospace">{Math.round(weights.weightDelay * 100)}%</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.weightDelay}
                onChange={(e) => setWeights({ ...weights, weightDelay: parseFloat(e.target.value) })}
              />
            </div>

            {/* Distance Weight */}
            <div>
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                <span className="fw-medium">Geographic Distance</span>
                <span className="text-success fw-bold font-monospace">{Math.round(weights.weightDistance * 100)}%</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.weightDistance}
                onChange={(e) => setWeights({ ...weights, weightDistance: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
