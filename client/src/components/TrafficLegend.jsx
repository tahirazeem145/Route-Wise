import React from 'react';
import { Layers } from 'lucide-react';

export default function TrafficLegend() {
  return (
    <div className="glass-panel p-3">
      {/* Signature Card Header */}
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
            <Layers size={14} color="#38bdf8" />
          </span>
          <span>Traffic Telemetry & Route Tiers</span>
        </h6>

        <span className="badge font-monospace" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
          Live Legend
        </span>
      </div>

      {/* Row A: Route Line Tiers */}
      <div className="mb-2">
        <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
          <span
            className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
            style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#22c55e', fontWeight: 'bold' }}
          >
            A
          </span>
          <span className="text-light">Route Alternative Tiers</span>
        </label>
        <div className="card-field-box d-flex flex-wrap align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 12, height: 6, backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }}
            />
            <span className="fw-semibold text-light" style={{ fontSize: '0.72rem' }}>Recommended (#1)</span>
          </div>

          <div className="d-flex align-items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 12, height: 6, backgroundColor: '#eab308', boxShadow: '0 0 6px #eab308' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#fde68a' }}>Moderate Delay</span>
          </div>

          <div className="d-flex align-items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
            <span
              className="d-inline-block rounded-pill"
              style={{ width: 12, height: 6, backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>Severe Congestion</span>
          </div>
        </div>
      </div>

      {/* Row B: Live Heatmap Street Flow */}
      <div>
        <label className="form-label small text-secondary mb-1 fw-semibold d-flex align-items-center gap-1">
          <span
            className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
            style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#38bdf8', fontWeight: 'bold' }}
          >
            B
          </span>
          <span className="text-light">Live Heatmap Flow & Waypoints</span>
        </label>
        <div className="card-field-box d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex flex-wrap align-items-center gap-1.5">
            <span className="badge rounded-pill" style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac', fontSize: '0.70rem' }}>
              ● Free Flow
            </span>
            <span className="badge rounded-pill" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fde047', fontSize: '0.70rem' }}>
              ● Slow
            </span>
            <span className="badge rounded-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '0.70rem' }}>
              ● Jammed
            </span>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
            <div className="d-flex align-items-center gap-1">
              <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              <span>Origin A</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              <span>Dest B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
