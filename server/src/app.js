const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const { errorResponse } = require('./utils/response');

const healthRoutes = require('./routes/healthRoutes');
const developerRoutes = require('./routes/developerRoutes');
const routeRoutes = require('./routes/routeRoutes');
const trafficRoutes = require('./routes/trafficRoutes');

const app = express();

// Security & Parsing Middleware
app.use(cors({
  origin: true, // Seamlessly accepts requests from any external client, mobile app, or origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '100kb' }));

// Request logging (sanitized)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Hackathon Documents (MRD & PRD)
const path = require('path');
const mrdDir = path.resolve(__dirname, '../../MRD');
const prdDir = path.resolve(__dirname, '../../PRD');
app.use('/docs/mrd', express.static(mrdDir));
app.use('/docs/prd', express.static(prdDir));

app.get('/docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyber Knight - Hackathon Deliverables (MRD & PRD)</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.2);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --border: #1f2937;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 2rem 1rem; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
    .container { max-width: 900px; width: 100%; }
    header { text-align: center; margin-bottom: 2.5rem; }
    .badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 9999px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 0.75rem; }
    h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p.subtitle { color: var(--text-muted); font-size: 1.05rem; }
    .meta-bar { display: flex; justify-content: space-around; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 2rem; font-size: 0.9rem; }
    .meta-item span { display: block; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.2rem; }
    .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    @media (max-width: 768px) { .cards-grid { grid-template-columns: 1fr; } }
    .doc-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
    .doc-card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 10px 25px -5px var(--accent-glow); }
    .doc-tag { font-size: 0.75rem; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 0.25rem 0.6rem; border-radius: 6px; align-self: flex-start; margin-bottom: 0.75rem; }
    .doc-title { font-size: 1.35rem; font-weight: 700; margin-bottom: 0.5rem; }
    .doc-desc { color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.25rem; flex-grow: 1; }
    .btn-group { display: flex; flex-direction: column; gap: 0.6rem; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: background 0.2s; }
    .btn-pdf { background: #dc2626; color: white; }
    .btn-pdf:hover { background: #b91c1c; }
    .btn-docx { background: #2563eb; color: white; }
    .btn-docx:hover { background: #1d4ed8; }
    .btn-md { background: #374151; color: #f3f4f6; }
    .btn-md:hover { background: #4b5563; }
    .instructions { background: rgba(30, 41, 59, 0.5); border: 1px dashed var(--border); border-radius: 12px; padding: 1.25rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
    .instructions strong { color: #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">JJCET AI-PDLC HACKATHON 2026</div>
      <h1>Cyber Knight - Submission Hub</h1>
      <p class="subtitle">RouteWise: Junction-Centric Adaptive Traffic Advisory Tool</p>
    </header>

    <div class="meta-bar">
      <div class="meta-item"><span>Team Name</span><strong>Cyber Knight</strong></div>
      <div class="meta-item"><span>Submission Gate</span><strong>Gate 2 (MRD) & Gate 3 (PRD)</strong></div>
      <div class="meta-item"><span>Mentor / Reviewer</span><strong>Mr. Vetri Sir & Jury</strong></div>
      <div class="meta-item"><span>Submission Deadline</span><strong style="color: #ef4444;">Today, 3:30 PM</strong></div>
    </div>

    <div class="cards-grid">
      <!-- MRD CARD -->
      <div class="doc-card">
        <div class="doc-tag">FORM 2 - 15 MARKS (COMPLETED)</div>
        <h2 class="doc-title">Market Requirements Document (MRD)</h2>
        <p class="doc-desc">
          Defines the named target customer segment, 2 core personas (Karthik & Selvi), one-sentence need formula, comprehensive competitive analysis against 3 existing solutions, and assumption audit.
        </p>
        <div class="btn-group">
          <a class="btn btn-pdf" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.pdf" target="_blank">
            📄 View / Download MRD (PDF)
          </a>
          <a class="btn btn-docx" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.docx" download>
            📝 Download MRD (Word .DOCX)
          </a>
          <a class="btn btn-md" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.md" target="_blank">
            📋 View Raw Markdown (.MD)
          </a>
        </div>
      </div>

      <!-- PRD CARD -->
      <div class="doc-card">
        <div class="doc-tag">FORM 3 - 20 MARKS (COMPLETED)</div>
        <h2 class="doc-title">Product Requirements Document (PRD)</h2>
        <p class="doc-desc">
          Strictly prioritized MoSCoW scope with <strong>Maximum 3 Must-Haves</strong> (Discovery, Ranking, Cross-Route Explanation Box), Persona Traceability Matrix, BDD Acceptance Criteria, and 4 Live Demo Measurable Metrics.
        </p>
        <div class="btn-group">
          <a class="btn btn-pdf" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.pdf" target="_blank">
            📄 View / Download PRD (PDF)
          </a>
          <a class="btn btn-docx" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.docx" download>
            📝 Download PRD (Word .DOCX)
          </a>
          <a class="btn btn-md" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.md" target="_blank">
            📋 View Raw Markdown (.MD)
          </a>
        </div>
      </div>
    </div>

    <div class="instructions">
      <strong>Instructions for Google Drive Upload:</strong><br>
      1. Create two separate folders in your Google Drive: <code>MRD</code> and <code>PRD</code>.<br>
      2. Upload the downloaded files into their respective folders with the exact required names:
         <code>Cyber Knight - Commuters Waste Time at Congested Junctions - MRD</code> and <code>Cyber Knight - Commuters Waste Time at Congested Junctions - PRD</code>.<br>
      3. Set folder sharing to <em>"Anyone with the link can view"</em> and share both Drive links with your mentor before <strong>3:30 PM</strong>.
    </div>
  </div>
</body>
</html>`);
});

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/traffic', trafficRoutes);

// 404 Route Handler
app.use((req, res) => {
  return errorResponse(res, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'MALFORMED_JSON', 'Malformed JSON in request body.', 400);
  }

  logger.error('Unhandled server exception:', err.message);
  return errorResponse(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal server error occurred.',
    500,
    err.stack
  );
});

module.exports = app;
