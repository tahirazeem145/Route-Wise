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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
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
            className="btn glass-btn-secondary btn-sm d-flex align-items-center gap-1 px-3 py-1"
            onClick={onOpenDocs}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span className="d-none d-sm-inline">API Docs</span>
          </button>

          <button
            type="button"
            className="btn glass-btn-primary btn-sm d-flex align-items-center gap-2 px-3 py-1"
            onClick={onOpenApiKey}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
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
