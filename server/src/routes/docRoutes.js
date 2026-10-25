const express = require('express');
const path = require('path');

const router = express.Router();

const mrdDir = path.resolve(__dirname, '../../../MRD');
const prdDir = path.resolve(__dirname, '../../../PRD');
const backlogDir = path.resolve(__dirname, '../../../Backlog');

router.use('/mrd', express.static(mrdDir));
router.use('/prd', express.static(prdDir));
router.use('/backlog', express.static(backlogDir));

router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyber Knight - Hackathon Deliverables Hub (MRD, PRD & Backlog)</title>
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
    .container { max-width: 960px; width: 100%; }
    header { text-align: center; margin-bottom: 2rem; }
    .badge { display: inline-block; padding: 0.35rem 0.85rem; border-radius: 9999px; background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 0.75rem; }
    h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p.subtitle { color: var(--text-muted); font-size: 1.05rem; }
    .meta-bar { display: flex; justify-content: space-around; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; flex-wrap: wrap; gap: 0.75rem; }
    .meta-item span { display: block; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.2rem; }
    .master-banner { background: linear-gradient(135deg, rgba(30, 64, 175, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1px solid #3b82f6; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .master-banner-info h3 { font-size: 1.1rem; color: #fff; margin-bottom: 0.25rem; }
    .master-banner-info p { font-size: 0.85rem; color: #94a3b8; }
    .btn-master { background: #3b82f6; color: white; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-master:hover { background: #2563eb; }
    .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem; }
    @media (max-width: 900px) { .cards-grid { grid-template-columns: 1fr; } }
    .doc-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
    .doc-card:hover { transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 10px 25px -5px var(--accent-glow); }
    .doc-tag { font-size: 0.72rem; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 0.25rem 0.6rem; border-radius: 6px; align-self: flex-start; margin-bottom: 0.75rem; }
    .doc-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .doc-desc { color: var(--text-muted); font-size: 0.82rem; line-height: 1.45; margin-bottom: 1.25rem; flex-grow: 1; }
    .btn-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 0.85rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-decoration: none; transition: background 0.2s; }
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
      <h1>Cyber Knight — Submission Hub</h1>
      <p class="subtitle">Route Wise: Junction-Centric Adaptive Traffic Advisory Tool & Installable PWA</p>
    </header>

    <div class="meta-bar">
      <div class="meta-item"><span>Team</span><strong>Cyber Knight</strong></div>
      <div class="meta-item"><span>Submission Gates</span><strong>Gate 2 (MRD), Gate 3 (PRD), Gate 4 (Backlog)</strong></div>
      <div class="meta-item"><span>Test Verification</span><strong style="color: #10b981;">99 / 99 Automated Tests (100% Pass)</strong></div>
      <div class="meta-item"><span>Status</span><strong style="color: #10b981;">Production Verified</strong></div>
    </div>

    <!-- 5-PAGE MASTER PDF BANNER -->
    <div class="master-banner">
      <div class="master-banner-info">
        <h3>📄 Gold Standard Master Document (Strictly ≤ 5 Pages)</h3>
        <p>Unified executive specification combining complete MRD and PRD within exactly 5 publication pages.</p>
      </div>
      <a class="btn-master" href="/SmartRoute_AI_PRD_MRD.pdf" target="_blank">
        ⚡ Open Master PDF (5 Pages)
      </a>
    </div>

    <div class="cards-grid">
      <!-- MRD CARD -->
      <div class="doc-card">
        <div class="doc-tag">STAGE 2 (MRD) — VERIFIED</div>
        <h2 class="doc-title">Market Requirements Document (MRD)</h2>
        <p class="doc-desc">
          5-Why root cause analysis, Trichy CBS ⇄ Thillai Nagar corridor scenario, TAM $14.2B / SAM $2.8B / SOM $350M sizing, 3 target personas, and competitive moat matrix.
        </p>
        <div class="btn-group">
          <a class="btn btn-pdf" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.pdf" target="_blank">
            📄 View MRD (PDF - 2 Pages)
          </a>
          <a class="btn btn-docx" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.docx" download>
            📝 Download MRD (.DOCX)
          </a>
          <a class="btn btn-md" href="/docs/mrd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20MRD.md" target="_blank">
            📋 View MRD (.MD)
          </a>
        </div>
      </div>

      <!-- PRD CARD -->
      <div class="doc-card">
        <div class="doc-tag">STAGE 3 (PRD) — VERIFIED</div>
        <h2 class="doc-title">Product Requirements Document (PRD)</h2>
        <p class="doc-desc">
          Strictly prioritized MoSCoW scope (3 Must-Haves capped), 7-step interaction flow, Epics FR-1 to FR-13, REST API contracts, SQLite WAL schema, and 2-min evaluator script.
        </p>
        <div class="btn-group">
          <a class="btn btn-pdf" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.pdf" target="_blank">
            📄 View PRD (PDF - 3 Pages)
          </a>
          <a class="btn btn-docx" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.docx" download>
            📝 Download PRD (.DOCX)
          </a>
          <a class="btn btn-md" href="/docs/prd/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20PRD.md" target="_blank">
            📋 View PRD (.MD)
          </a>
        </div>
      </div>

      <!-- BACKLOG CARD -->
      <div class="doc-card">
        <div class="doc-tag">STAGE 4 (BACKLOG) — VERIFIED</div>
        <h2 class="doc-title">Epics & Stories (Product Backlog)</h2>
        <p class="doc-desc">
          5 Core Epics and 14 testable user stories with Gherkin acceptance criteria, PRD feature mapping (FR-1..13), and 100% test traceability across all 99 tests.
        </p>
        <div class="btn-group">
          <a class="btn btn-md" style="background: #1e40af;" href="/docs/backlog/Cyber%20Knight%20-%20Commuters%20Waste%20Time%20at%20Congested%20Junctions%20-%20Epics%20and%20Stories.md" target="_blank">
            📋 View Epics & Stories (.MD)
          </a>
          <a class="btn btn-md" href="/EPICS_AND_STORIES.md" target="_blank">
            📂 View Root Backlog (.MD)
          </a>
        </div>
      </div>
    </div>

    <div class="instructions">
      <strong>Engineering & Evaluation Traceability:</strong><br>
      • All 14 backlog stories map directly to passing tests in <code>server/tests/</code> and <code>client/tests/</code> (99/99 passing).<br>
      • Deliverables are synchronized across repository root, <code>MRD/</code>, <code>PRD/</code>, <code>Backlog/</code>, and <code>client/public/</code>.
    </div>
  </div>
</body>
</html>`);
});

module.exports = router;

