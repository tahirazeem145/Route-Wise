import React from 'react';
import { Navigation, FileText, KeyRound, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

const THEMES = [
  { id: 'indigo', label: 'Indigo/Violet (Default)', color: '#818cf8' },
  { id: 'cyan', label: 'Cyber Cyan', color: '#38bdf8' },
  { id: 'emerald', label: 'Emerald Mint', color: '#10b981' },
  { id: 'sunset', label: 'Sunset Amber', color: '#f59e0b' },
  { id: 'violet', label: 'Royal Violet', color: '#c084fc' }
];

export default function Navbar({
  onOpenDocs,
  onOpenApiKey,
  onOpenReportModal,
  onOpenAuthorityDashboard,
  serverHealthy,
  apiKeyPrefix,
  currentTheme = 'indigo',
  onSelectTheme
}) {
  return (
    <nav className="navbar navbar-expand-lg glass-navbar py-2 px-3 sticky-top">
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center gap-2">
          <div className="sra-brand-badge">
            <Navigation size={18} color="#ffffff" />
          </div>

          <div>
            <span
              className="navbar-brand mb-0 h1 fw-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 40%, var(--accent-primary-light) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}
            >
              SmartRoute AI
            </span>
            <span
              className="badge font-monospace ms-2"
              style={{
                fontSize: '0.65rem',
                background: 'color-mix(in oklab, var(--accent-primary-light) 18%, transparent)',
                color: 'var(--accent-primary-light)',
                border: '1px solid color-mix(in oklab, var(--accent-primary-light) 35%, transparent)'
              }}
            >
              v1.0 MVP
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          {/* Interactive UI Color Theme Selector */}
          {onSelectTheme && (
            <div
              className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              title="Change UI Color Theme"
            >
              <span className="text-secondary d-none d-sm-inline" style={{ fontSize: '0.68rem' }}>Color:</span>
              {THEMES.map((t) => {
                const isActive = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className="btn btn-sm p-0 rounded-circle"
                    style={{
                      width: 17,
                      height: 17,
                      backgroundColor: t.color,
                      border: isActive ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: isActive ? `0 0 10px ${t.color}` : 'none',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      outline: 'none'
                    }}
                    onClick={() => onSelectTheme(t.id)}
                    title={`${t.label} Theme`}
                    aria-label={`Select ${t.label} Color Theme`}
                  />
                );
              })}
            </div>
          )}

          <div
            className="d-none d-lg-flex align-items-center gap-2 px-2 py-1 rounded-pill"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <span
              className={`rounded-circle d-inline-block ${serverHealthy ? 'bg-success pulse-active' : 'bg-warning'}`}
              style={{ width: 8, height: 8 }}
            />
            <span style={{ fontSize: '0.78rem', color: serverHealthy ? '#4ade80' : '#fbbf24' }}>
              {serverHealthy ? 'API Online' : 'Connecting...'}
            </span>
          </div>

          <button
            type="button"
            className="btn glass-btn-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1"
            style={{
              border: '1px solid rgba(239, 68, 68, 0.45)',
              background: 'rgba(239, 68, 68, 0.14)',
              color: '#fca5a5'
            }}
            onClick={onOpenReportModal}
            title="Report a traffic incident (F4)"
          >
            <AlertTriangle size={14} color="#f87171" />
            <span className="d-none d-sm-inline">Report Incident</span>
          </button>

          <button
            type="button"
            className="btn glass-btn-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1"
            style={{
              border: '1px solid rgba(168, 85, 247, 0.45)',
              background: 'rgba(168, 85, 247, 0.14)',
              color: '#d8b4fe'
            }}
            onClick={onOpenAuthorityDashboard}
            title="Municipal Traffic Authority Console (F5)"
          >
            <ShieldAlert size={14} color="#c084fc" />
            <span className="d-none d-sm-inline">Authority</span>
          </button>

          <button
            type="button"
            className="btn glass-btn-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1"
            onClick={onOpenDocs}
          >
            <FileText size={14} />
            <span className="d-none d-sm-inline">API Docs</span>
          </button>

          <button
            type="button"
            className="btn glass-btn-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1"
            onClick={onOpenApiKey}
          >
            <KeyRound size={14} />
            <span>API Keys</span>

            <span
              className="badge font-monospace d-none d-sm-inline-block"
              style={{
                fontSize: '0.68rem',
                background: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff'
              }}
            >
              {apiKeyPrefix || 'Key Set'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
