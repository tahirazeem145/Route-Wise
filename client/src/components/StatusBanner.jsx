import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';

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
            <AlertCircle size={18} color="#ef4444" className="flex-shrink-0" />
            <div className="small">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button type="button" className="glass-close-btn" onClick={onDismissError} aria-label="Close">✕</button>
        </div>
      )}

      {isStale && !error && (
        <div className="glass-alert-warning p-3 mb-2 small d-flex align-items-center gap-2 shadow-sm" role="alert">
          <AlertTriangle size={18} color="#f59e0b" className="flex-shrink-0" />
          <div>
            <strong>Stale Data:</strong> Periodic traffic refresh encountered a network delay. Displaying last successfully evaluated routes.
          </div>
        </div>
      )}

      {dataSource === 'tomtom-fallback-demo' && !error && !dismissDemo && (
        <div className="glass-alert-info p-3 mb-0 small d-flex align-items-center justify-content-between flex-wrap gap-2 shadow-sm" role="alert">
          <div className="d-flex align-items-center gap-2">
            <Info size={18} color="var(--accent-cyan)" className="flex-shrink-0" />
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
