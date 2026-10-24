import React, { useState } from 'react';
import { getStoredApiKey } from '../services/api';

export default function ApiDocsModal({ show, onClose }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const activeKey = getStoredApiKey();

  if (!show) return null;

  const curlRecommend = `curl -X POST http://localhost:5000/api/routes/recommend \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${activeKey}" \\
  -d '{
    "source": "Tiruchirappalli",
    "destination": "Coimbatore"
  }'`;

  const curlRefresh = `curl -X POST http://localhost:5000/api/routes/refresh \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${activeKey}" \\
  -d '{
    "source": "Tiruchirappalli",
    "destination": "Coimbatore"
  }'`;

  const curlHealth = `curl -X GET http://localhost:5000/api/health`;

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="modal show d-block glass-modal-backdrop" tabIndex="-1">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content glass-modal-content border-0">
          <div className="modal-header py-3 px-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h6 className="modal-title fw-bold text-light d-flex align-items-center gap-2">
              <span style={{ color: 'var(--accent-cyan)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </span>
              Developer Integration API Reference
            </h6>
            <button type="button" className="glass-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="modal-body p-4">
            <p className="small mb-4" style={{ color: '#94a3b8' }}>
              SmartRoute AI is built for plug-and-play embedding into logistics, ride-hailing, fleet management, and emergency vehicle dispatch systems. All responses return standardized RFC JSON payloads with latency metrics.
            </p>

            {/* Endpoint 1: Recommend */}
            <div className="p-3 mb-3 rounded-3" style={{ background: 'rgba(0, 0, 0, 0.28)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill px-2" style={{ background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-cyan)', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                    POST
                  </span>
                  <strong className="text-light font-monospace" style={{ fontSize: '0.88rem' }}>/api/routes/recommend</strong>
                </div>
                <button
                  type="button"
                  className="glass-btn-secondary btn-sm py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => copyToClipboard(curlRecommend, 1)}
                >
                  {copiedIndex === 1 ? '✓ Copied' : 'Copy cURL'}
                </button>
              </div>
              <p className="small mb-2" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Evaluates alternative routes, extracts real-time congestion bottlenecks, and scores routes using multi-criteria optimization.
              </p>
              <pre className="p-2 rounded font-monospace small overflow-auto text-light m-0" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                {curlRecommend}
              </pre>
            </div>

            {/* Endpoint 2: Refresh */}
            <div className="p-3 mb-3 rounded-3" style={{ background: 'rgba(0, 0, 0, 0.28)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill px-2" style={{ background: 'rgba(129, 140, 248, 0.2)', color: 'var(--accent-indigo)', border: '1px solid rgba(129, 140, 248, 0.4)' }}>
                    POST
                  </span>
                  <strong className="text-light font-monospace" style={{ fontSize: '0.88rem' }}>/api/routes/refresh</strong>
                </div>
                <button
                  type="button"
                  className="glass-btn-secondary btn-sm py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => copyToClipboard(curlRefresh, 2)}
                >
                  {copiedIndex === 2 ? '✓ Copied' : 'Copy cURL'}
                </button>
              </div>
              <p className="small mb-2" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Re-queries live traffic delays along the existing geometry without regenerating route geometry.
              </p>
              <pre className="p-2 rounded font-monospace small overflow-auto text-light m-0" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                {curlRefresh}
              </pre>
            </div>

            {/* Endpoint 3: Health Probe */}
            <div className="p-3 rounded-3" style={{ background: 'rgba(0, 0, 0, 0.28)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill px-2" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                    GET
                  </span>
                  <strong className="text-light font-monospace" style={{ fontSize: '0.88rem' }}>/api/health</strong>
                </div>
                <button
                  type="button"
                  className="glass-btn-secondary btn-sm py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => copyToClipboard(curlHealth, 3)}
                >
                  {copiedIndex === 3 ? '✓ Copied' : 'Copy cURL'}
                </button>
              </div>
              <p className="small mb-2" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Returns service status, active traffic provider mode (live TomTom tiles or simulation), and system uptime.
              </p>
              <pre className="p-2 rounded font-monospace small overflow-auto text-light m-0" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem' }}>
                {curlHealth}
              </pre>
            </div>
          </div>

          <div className="modal-footer py-3 px-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <button type="button" className="glass-btn-primary btn-sm px-4" onClick={onClose}>
              Close Reference
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
