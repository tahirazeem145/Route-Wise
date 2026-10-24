import React from 'react';

export default function TrafficLegend() {
  return (
    <div className="glass-panel p-2 px-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Route Line Distinction */}
        <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
          <span className="text-light fw-bold d-flex align-items-center gap-1">
            <span style={{ color: 'var(--accent-cyan)' }}>◈</span> Route Tiers:
          </span>
          <div className="d-flex align-items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 14, height: 6, backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
            />
            <span className="fw-semibold text-light" style={{ fontSize: '0.72rem' }}>Recommended (#1)</span>
          </div>
          <div className="d-flex align-items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 14, height: 6, backgroundColor: '#eab308', boxShadow: '0 0 6px #eab308' }}
            />
            <span className="text-light-subtle" style={{ fontSize: '0.72rem', color: '#fde68a' }}>Moderate Delay</span>
          </div>
          <div className="d-flex align-items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 14, height: 6, backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }}
            />
            <span className="text-light-subtle" style={{ fontSize: '0.72rem', color: '#fca5a5' }}>Severe Congestion</span>
          </div>
        </div>

        {/* Live Heatmap Street Flow Colors */}
        <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: '0.72rem' }}>
          <span className="text-secondary border-start ps-2" style={{ borderColor: 'var(--glass-border) !important' }}>
            Live Heatmap:
          </span>
          <span className="badge rounded-pill" style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac' }}>
            Free Flow
          </span>
          <span className="badge rounded-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fde047' }}>
            Slow
          </span>
          <span className="badge rounded-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
            Jammed
          </span>
          <div className="d-flex align-items-center gap-1 ms-1 text-light-50" style={{ color: '#94a3b8' }}>
            <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span>Origin A</span>
            <span className="rounded-circle d-inline-block ms-2" style={{ width: 8, height: 8, backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <span>Dest B</span>
          </div>
        </div>
      </div>
    </div>
  );
}
