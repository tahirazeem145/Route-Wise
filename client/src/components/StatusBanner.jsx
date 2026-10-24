import React, { useState } from 'react';

export default function StatusBanner({ error, isStale, dataSource, onDismissError, onOpenTomTomKey }) {
  const [dismissDemo, setDismissDemo] = useState(false);

  if (!error && !isStale && (dataSource !== 'tomtom-fallback-demo' || dismissDemo)) {
    return null;
  }

  return (
    <div className="mb-3">
      {error && (
        <div className="glass-alert-danger p-3 mb-2 d-flex align-items-center justify-content-between gap-3 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ color: '#ef4444' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="small">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button type="button" className="glass-close-btn" onClick={onDismissError} aria-label="Close">✕</button>
        </div>
      )}

      {isStale && !error && (
        <div className="glass-alert-warning p-3 mb-2 small d-flex align-items-center gap-2 shadow-sm" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ color: '#f59e0b' }}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Stale Data:</strong> Periodic traffic refresh encountered a network delay. Displaying last successfully evaluated routes.
          </div>
        </div>
      )}

      {dataSource === 'tomtom-fallback-demo' && !error && !dismissDemo && (
        <div className="glass-alert-info p-3 mb-0 small d-flex align-items-center justify-content-between flex-wrap gap-2 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" style={{ color: 'var(--accent-cyan)' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>
              <strong>Demo Mode:</strong> Running with simulated high-fidelity road geometries and traffic delays.
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {onOpenTomTomKey && (
              <button
                type="button"
                className="glass-btn-primary btn-sm py-1 px-3"
                style={{ fontSize: '0.72rem' }}
                onClick={onOpenTomTomKey}
              >
                ⚡ Connect TomTom Key
              </button>
            )}
            <button
              type="button"
              className="glass-close-btn"
              onClick={() => setDismissDemo(true)}
              aria-label="Dismiss banner"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
