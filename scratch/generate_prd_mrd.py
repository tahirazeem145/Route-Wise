import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
import pymupdf

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages 2 & 3)
        if self._pageNumber > 1:
            self.drawString(36, 762, "SMARTROUTE AI (ROUTE WISE) — PRD & MRD SPECIFICATION")
            self.setFont("Helvetica", 7)
            self.drawRightString(576, 762, "CONFIDENTIAL & PROPRIETARY")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)
        
        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 36, 576, 36)
        
        self.setFont("Helvetica", 7.5)
        self.drawString(36, 24, "Route Wise / SmartRoute AI — Product Management & Architecture Team")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 24, page_str)
        self.restoreState()

def build_pdf(filename):
    # Page setup: Letter is 612 x 792 pt
    # Margins: 36 pt (0.5 in) left/right, 38 pt top/bottom
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Slate 900
    ACCENT = colors.HexColor("#1D4ED8")     # Blue 700
    TEAL = colors.HexColor("#0F766E")       # Teal 700
    MUTED = colors.HexColor("#475569")      # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER = colors.HexColor("#E2E8F0")     # Slate 200

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=21,
        textColor=PRIMARY,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=MUTED,
        spaceAfter=7
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=ACCENT,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    subheading = ParagraphStyle(
        'SubHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.HexColor("#0F172A")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )

    table_cell_header = ParagraphStyle(
        'TableHeader',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    story = []

    # =========================================================================
    # PAGE 1: EXECUTIVE OVERVIEW & MARKET REQUIREMENTS DOCUMENT (MRD)
    # =========================================================================
    
    header_data = [
        [
            Paragraph("<b>SmartRoute AI (Route Wise)</b>", title_style),
            Paragraph("<font size=7 color='#64748B'><b>DOC ID:</b> PRD-MRD-2026-v1<br/><b>DATE:</b> Oct 2026 | <b>STATUS:</b> Approved<br/><b>TARGET:</b> Production MVP</font>", table_cell)
        ],
        [
            Paragraph("<b>Product & Market Requirements Document (PRD & MRD)</b> — Developer-First Intelligent Traffic-Aware Routing Engine", subtitle_style),
            ""
        ]
    ]
    t_header = Table(header_data, colWidths=[400, 140])
    t_header.setStyle(TableStyle([
        ('SPAN', (0, 1), (1, 1)),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1.2, color=ACCENT, spaceBefore=2, spaceAfter=5))

    # Executive Summary Card
    exec_text = (
        "<b>Executive Summary:</b> Modern routing services default to raw travel time or naive shortest-distance algorithms, "
        "ignoring business-specific tolerances for traffic congestion, driver stress, and unpredictable delays. "
        "<b>SmartRoute AI (Route Wise)</b> delivers an API-first routing intelligence platform and real-time visualization dashboard "
        "that evaluates up to 3 candidate driving paths, scores them using a configurable multi-criteria algorithm, categorizes "
        "traffic congestion (Green/Yellow/Red), and provides transparent mathematical reasoning for every recommendation."
    )
    exec_table = Table([[Paragraph(exec_text, body)]], colWidths=[540])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 5))

    # MRD SECTION 1: Market Problem & Opportunity
    story.append(Paragraph("1. Market Opportunity & Problem Statement", section_heading))
    mrd_prob_text = (
        "<b>The Market Gap:</b> Fleet operators, on-demand couriers, and mobility developers lose millions annually to urban congestion bottlenecks. "
        "Incumbent navigation APIs (e.g., Google Maps, Mapbox) offer closed-box routing without exposed weighting formulas or explicit rationale. "
        "Developers cannot penalize severe bottlenecks without building complex post-processing pipelines from scratch."
    )
    story.append(Paragraph(mrd_prob_text, body))

    # Market Sizing Grid
    sizing_data = [
        [
            Paragraph("<b>TAM: $14.2B</b><br/><font color='#475569'>Global GIS & Routing Logistics APIs</font>", table_cell),
            Paragraph("<b>SAM: $2.8B</b><br/><font color='#475569'>Urban Delivery & Fleet Routing Devs</font>", table_cell),
            Paragraph("<b>SOM: $350M</b><br/><font color='#475569'>Hackathons & Independent Logistics SaaS</font>", table_cell)
        ]
    ]
    t_sizing = Table(sizing_data, colWidths=[180, 180, 180])
    t_sizing.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_sizing)
    story.append(Spacer(1, 5))

    # MRD SECTION 2: Target Audience & User Segments
    story.append(Paragraph("2. Target Audience & Customer Personas", section_heading))
    story.append(Paragraph("• <b>Primary (Fleet & Dispatch Engineers):</b> Need deterministic, automated route scoring that minimizes driver delay penalties and fuel variance across multi-vehicle operations.", bullet_style))
    story.append(Paragraph("• <b>Secondary (On-Demand Couriers & Delivery Startups):</b> Require sub-second API recommendations with transparent rationale to share with couriers and dispatch managers.", bullet_style))
    story.append(Paragraph("• <b>Tertiary (Independent Developers & Hackathons):</b> Need seamless plug-and-play REST endpoints, high-fidelity offline fallbacks, and instantaneous API key governance.", bullet_style))
    story.append(Spacer(1, 4))

    # MRD SECTION 3: Competitive Analysis
    story.append(Paragraph("3. Competitive Landscape & Value Proposition", section_heading))
    comp_data = [
        [
            Paragraph("<b>Feature / Dimension</b>", table_cell_header),
            Paragraph("<b>Google Maps API</b>", table_cell_header),
            Paragraph("<b>Mapbox Navigation</b>", table_cell_header),
            Paragraph("<b>SmartRoute AI (Route Wise)</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Ranking Customization</b>", table_cell_bold),
            Paragraph("None (Opaque defaults)", table_cell),
            Paragraph("Limited profiles", table_cell),
            Paragraph("<b>Full (Configurable multi-criteria weights)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Recommendation Rationale</b>", table_cell_bold),
            Paragraph("Not provided", table_cell),
            Paragraph("Not provided", table_cell),
            Paragraph("<b>Mathematical scoring & human-readable tags</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Congestion Classification</b>", table_cell_bold),
            Paragraph("Visual only", table_cell),
            Paragraph("Speed levels", table_cell),
            Paragraph("<b>Independent 3-tier severity (Green/Yellow/Red)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Offline / Fallback Resilience</b>", table_cell_bold),
            Paragraph("Network dependent", table_cell),
            Paragraph("Paid offline packs", table_cell),
            Paragraph("<b>Built-in offline geocoding dictionary</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Key Governance & Dev Portal</b>", table_cell_bold),
            Paragraph("Complex GCP console", table_cell),
            Paragraph("Web dashboard only", table_cell),
            Paragraph("<b>SHA-256 hashed keys + Interactive modal UI</b>", table_cell_bold)
        ]
    ]
    t_comp = Table(comp_data, colWidths=[125, 135, 135, 145])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 5))

    # MRD SECTION 4: Go-To-Market & Pricing Strategy
    story.append(Paragraph("4. Go-To-Market (GTM) & Monetization Model", section_heading))
    gtm_text = (
        "<b>Distribution Strategy:</b> Developer-first bottom-up adoption via GitHub, Postman public workspaces, and hackathon showcases. "
        "<b>Tiered Model:</b> (1) <i>Developer Free</i>: 1,000 req/month, rate-limited to 60 req/min; "
        "(2) <i>Growth Fleet</i>: $0.003/query with custom weight profiles; "
        "(3) <i>Enterprise Dedicated</i>: SLA guarantees, on-prem geocoding, multi-waypoint batch optimizations."
    )
    story.append(Paragraph(gtm_text, body))

    # END OF PAGE 1
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: PRD PART 1 — SCOPE, PERSONAS & FUNCTIONAL REQUIREMENTS
    # =========================================================================
    story.append(Paragraph("PRODUCT REQUIREMENTS DOCUMENT (PRD) — PART 1", subtitle_style))
    story.append(Paragraph("1. Product Vision, Scope & Core Personas", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceBefore=2, spaceAfter=5))

    story.append(Paragraph("1.1 Product Vision & Strategic Scope", section_heading))
    prd_vision = (
        "SmartRoute AI provides an enterprise-grade, developer-friendly traffic intelligence API coupled with a reactive "
        "React/Leaflet dashboard. The platform's core directive is <b>transparency in routing decisions</b>: instead of accepting "
        "a black-box path, operators can inspect why a route was selected (e.g., avoided 12 min gridlock for only 2.1 extra km)."
    )
    story.append(Paragraph(prd_vision, body))

    # Personas Table
    persona_data = [
        [
            Paragraph("<b>Persona</b>", table_cell_header),
            Paragraph("<b>Role & Context</b>", table_cell_header),
            Paragraph("<b>Primary Needs & Frustrations</b>", table_cell_header),
            Paragraph("<b>SmartRoute AI Value</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Dan</b><br/>Backend Dev", table_cell_bold),
            Paragraph("Building dispatch backend for urban courier platform.", table_cell),
            Paragraph("Tired of brittle map APIs with high quotas and unexpected route shifts.", table_cell),
            Paragraph("Clean REST endpoints, predictable error codes, offline fallback demo mode.", table_cell)
        ],
        [
            Paragraph("<b>Olivia</b><br/>Ops Dispatcher", table_cell_bold),
            Paragraph("Oversees 40+ delivery drivers in high-density metropolitan zones.", table_cell),
            Paragraph("Drivers stuck in gridlock during peak hours despite map apps reporting 'optimal'.", table_cell),
            Paragraph("Configurable delay penalty weight, live auto-refresh dashboard, visual traffic pins.", table_cell)
        ]
    ]
    t_persona = Table(persona_data, colWidths=[80, 140, 160, 160])
    t_persona.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_persona)
    story.append(Spacer(1, 4))

    # Scope Boundary & System Modules Grid
    story.append(Paragraph("1.2 System Scope & Component Boundaries", section_heading))
    scope_data = [
        [
            Paragraph("<b>Module</b>", table_cell_header),
            Paragraph("<b>In-Scope (Current Release v1.0)</b>", table_cell_header),
            Paragraph("<b>Out-of-Scope (Future Releases)</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Routing Engine</b>", table_cell_bold),
            Paragraph("Origin-Destination single-leg routing with up to 3 driving alternatives, real-time traffic delay penalty, and multi-criteria scoring.", table_cell),
            Paragraph("Multi-stop traveling salesperson optimization, pedestrian / bicycle modes, toll-booth cost factoring.", table_cell)
        ],
        [
            Paragraph("<b>Data Resiliency</b>", table_cell_bold),
            Paragraph("Transparent offline fallback dictionary with pre-computed polylines and simulated congestion metrics for key metropolitan hubs.", table_cell),
            Paragraph("Full global offline vector tiles, real-time crowdsourced incident telemetry ingestion.", table_cell)
        ],
        [
            Paragraph("<b>Auth & Security</b>", table_cell_bold),
            Paragraph("Cryptographic SHA-256 hashed API key authentication with sliding-window rate limiting (100 req/min) and header enforcement.", table_cell),
            Paragraph("OAuth2 / OIDC Single Sign-On, role-based multi-tenant organization hierarchies, billing automation.", table_cell)
        ]
    ]
    t_scope = Table(scope_data, colWidths=[90, 230, 220])
    t_scope.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_scope)
    story.append(Spacer(1, 4))

    # Functional Requirements
    story.append(Paragraph("2. Detailed Functional Requirements (FR)", section_heading))

    fr_data = [
        [
            Paragraph("<b>Req ID</b>", table_cell_header),
            Paragraph("<b>Module</b>", table_cell_header),
            Paragraph("<b>Functional Specification & Acceptance Criteria</b>", table_cell_header),
            Paragraph("<b>Priority</b>", table_cell_header)
        ],
        [
            Paragraph("<b>FR-01</b>", table_cell_bold),
            Paragraph("Geocoding Service", table_cell_bold),
            Paragraph("Accepts text queries (e.g., 'San Francisco, CA') or [lat, lon] tuples. Resolves via TomTom Geocoding API with sub-second fallback to local offline coordinate dictionary when unconfigured or offline.", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-02</b>", table_cell_bold),
            Paragraph("Multi-Route Ingestion", table_cell_bold),
            Paragraph("Queries TomTom Routing API requesting up to 3 candidate driving paths (maxAlternatives=2). Ingests polyline geometry, travel duration, distance, and real-time traffic delay in seconds.", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-03</b>", table_cell_bold),
            Paragraph("Multi-Criteria Ranking", table_cell_bold),
            Paragraph("Computes composite score: <code>Score = (w_time * Duration) + (w_delay * DelayPenalty) + (w_dist * Distance)</code>. Default weights: 50% Time, 35% Delay Penalty, 15% Distance. Lowest score ranks #1.", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-04</b>", table_cell_bold),
            Paragraph("Severity Engine", table_cell_bold),
            Paragraph("Independent classification of traffic conditions: <b>Green (Low)</b>: delay &lt; 3 mins; <b>Yellow (Moderate)</b>: 3 to 8 mins delay; <b>Red (Heavy)</b>: &gt; 8 mins delay. Color-codes polylines.", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-05</b>", table_cell_bold),
            Paragraph("Transparent Rationale", table_cell_bold),
            Paragraph("Generates human-readable badges in API response (e.g., 'Fastest route (24m)', 'Avoids 9m gridlock', 'Slightly longer distance (+1.4 km)'). Explains exact trade-off.", table_cell),
            Paragraph("<font color='#1D4ED8'><b>P1 (Should)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-06</b>", table_cell_bold),
            Paragraph("Key Governance & Auth", table_cell_bold),
            Paragraph("Protects developer endpoints via <code>X-API-Key</code>. Keys hashed with SHA-256 and stored in <code>server/data/keys.json</code>. Includes rate-limiter middleware (100 req/min per key).", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-07</b>", table_cell_bold),
            Paragraph("Interactive Dashboard", table_cell_bold),
            Paragraph("React + Vite SPA featuring Leaflet map, origin/dest swap, preset cities (SF, NYC, London), route summary cards, cURL documentation modal, and key management modal.", table_cell),
            Paragraph("<font color='#0F766E'><b>P0 (Must)</b></font>", table_cell)
        ],
        [
            Paragraph("<b>FR-08</b>", table_cell_bold),
            Paragraph("Live Auto-Refresh", table_cell_bold),
            Paragraph("Visual 60-second circular countdown timer that automatically invokes <code>POST /api/routes/refresh</code>. Allows pause, manual trigger, and stale-data notifications.", table_cell),
            Paragraph("<font color='#1D4ED8'><b>P1 (Should)</b></font>", table_cell)
        ]
    ]
    t_fr = Table(fr_data, colWidths=[42, 95, 345, 58])
    t_fr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_fr)

    # END OF PAGE 2
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: PRD PART 2 — ARCHITECTURE, TECH SPECS, NF-REQS & ROADMAP
    # =========================================================================
    story.append(Paragraph("PRODUCT REQUIREMENTS DOCUMENT (PRD) — PART 2", subtitle_style))
    story.append(Paragraph("2. Technical Specifications, NFRs & Roadmap", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceBefore=2, spaceAfter=5))

    # System Architecture Summary
    story.append(Paragraph("2.1 System Architecture & Data Pipeline", section_heading))
    arch_summary = (
        "The system operates as a decoupled client-server architecture. The frontend (Vite/React 18) communicates over "
        "JSON REST with an Express.js backend. Requests pass through three layers: (1) <b>Security & Validation</b> "
        "(coordinate sanitization, SHA-256 key check, sliding-window rate limiter); (2) <b>Integration Layer</b> "
        "(TomTom Routing Client with offline dictionary failover); and (3) <b>Ranking & Severity Core</b>."
    )
    story.append(Paragraph(arch_summary, body))

    # REST API Specifications Table
    story.append(Paragraph("2.2 Core API Endpoints & Interfaces", subheading))
    api_data = [
        [
            Paragraph("<b>Method & Route</b>", table_cell_header),
            Paragraph("<b>Header & Body Parameters</b>", table_cell_header),
            Paragraph("<b>Response Payload & Status</b>", table_cell_header),
            Paragraph("<b>SLA / Perf</b>", table_cell_header)
        ],
        [
            Paragraph("<b>POST</b> <code>/api/routes/recommend</code>", table_cell_bold),
            Paragraph("<code>X-API-Key: &lt;key&gt;</code><br/><code>{ origin, destination, weights? }</code>", table_cell),
            Paragraph("<code>200 OK</code>: Ranked routes array with GeoJSON polyline, duration, trafficDelay, score, tags.", table_cell),
            Paragraph("&lt; 350ms (TomTom)<br/>&lt; 35ms (Fallback)", table_cell)
        ],
        [
            Paragraph("<b>POST</b> <code>/api/routes/refresh</code>", table_cell_bold),
            Paragraph("<code>X-API-Key: &lt;key&gt;</code><br/><code>{ routeIds: [...] }</code>", table_cell),
            Paragraph("<code>200 OK</code>: Fresh delay metrics and recalculated scores without re-geocoding coordinates.", table_cell),
            Paragraph("&lt; 250ms (Live)<br/>&lt; 20ms (Fallback)", table_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/health</code>", table_cell_bold),
            Paragraph("Public (No auth required)", table_cell),
            Paragraph("<code>200 OK</code>: <code>{ status: 'healthy', tomtom: true, uptime: 10452s }</code>", table_cell),
            Paragraph("&lt; 15ms", table_cell)
        ],
        [
            Paragraph("<b>GET</b> <code>/api/developer/status</code>", table_cell_bold),
            Paragraph("<code>X-API-Key: &lt;key&gt;</code>", table_cell),
            Paragraph("<code>200 OK</code>: Key metadata, quota used, requests remaining, tier limits.", table_cell),
            Paragraph("&lt; 25ms", table_cell)
        ]
    ]
    t_api = Table(api_data, colWidths=[130, 145, 195, 70])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 4))

    # Non-Functional Requirements & Success KPIs in 2 Columns
    story.append(Paragraph("2.3 Non-Functional Requirements & Success Metrics (KPIs)", section_heading))
    nfr_kpi_data = [
        [
            Paragraph("<b>Non-Functional Requirements (NFRs)</b>", table_cell_header),
            Paragraph("<b>Target Success Metrics & Business KPIs</b>", table_cell_header)
        ],
        [
            Paragraph(
                "• <b>Availability:</b> 99.9% uptime with instant offline mock fallback.<br/>"
                "• <b>Latency:</b> p95 API response &lt; 450ms across public networks.<br/>"
                "• <b>Security:</b> Cryptographic SHA-256 API key hashing, zero key leakage in logs.<br/>"
                "• <b>Resilience:</b> Graceful degradation if TomTom limits exceeded.<br/>"
                "• <b>Test Coverage:</b> 100% pass on 22 automated unit/integration tests.",
                table_cell
            ),
            Paragraph(
                "• <b>Developer Adoption:</b> 10,000+ API calls within first 90 days of launch.<br/>"
                "• <b>Delay Mitigation:</b> 14% average reduction in route delay vs. raw shortest path.<br/>"
                "• <b>Zero-Downtime Fallback:</b> 100% successful response rate in demo/offline mode.<br/>"
                "• <b>Dashboard Performance:</b> &lt; 1.2s initial load, 60 FPS map panning/zooming.<br/>"
                "• <b>Developer Satisfaction (CSAT):</b> &gt; 4.6 / 5.0 on docs & cURL integration.",
                table_cell
            )
        ]
    ]
    t_nfr_kpi = Table(nfr_kpi_data, colWidths=[270, 270])
    t_nfr_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('BACKGROUND', (0, 1), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_nfr_kpi)
    story.append(Spacer(1, 4))

    # Release Roadmap
    story.append(Paragraph("2.4 Product Release Milestones & Phased Roadmap", section_heading))
    roadmap_data = [
        [
            Paragraph("<b>Phase / Target</b>", table_cell_header),
            Paragraph("<b>Scope & Key Deliverables</b>", table_cell_header),
            Paragraph("<b>Deliverable Highlights & Gate Criteria</b>", table_cell_header)
        ],
        [
            Paragraph("<b>Phase 1: MVP</b><br/><font color='#0F766E'><b>Current (Q4 2026)</b></font>", table_cell_bold),
            Paragraph("Core Recommendation Engine, Leaflet UI & Fallback System", table_cell),
            Paragraph("Node/Express API, TomTom integration, offline dictionary, weighted ranking, React 18 dashboard, 22 unit tests.", table_cell)
        ],
        [
            Paragraph("<b>Phase 2: Expansion</b><br/><font color='#1D4ED8'><b>Q1 2027</b></font>", table_cell_bold),
            Paragraph("Multi-Stop Dispatch & Dynamic Webhook Alerts", table_cell),
            Paragraph("Traveling Salesperson (TSP) multi-waypoint optimization, automated webhook alerts on severe traffic spikes, SDKs for Python & Go.", table_cell)
        ],
        [
            Paragraph("<b>Phase 3: Scale</b><br/><font color='#D97706'><b>Q2 2027</b></font>", table_cell_bold),
            Paragraph("EV Fleet Battery Optimization & Weather Overlay", table_cell),
            Paragraph("Elevation & weather impact modeling, EV charging station waypoints, enterprise team permissions, billing portal integration.", table_cell)
        ]
    ]
    t_roadmap = Table(roadmap_data, colWidths=[105, 195, 240])
    t_roadmap.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_roadmap)
    story.append(Spacer(1, 4))

    # Risk & Mitigation Table
    story.append(Paragraph("2.5 Technical Risk Analysis & Mitigation Matrix", section_heading))
    risk_data = [
        [
            Paragraph("<b>Identified Risk / Threat</b>", table_cell_header),
            Paragraph("<b>Severity</b>", table_cell_header),
            Paragraph("<b>Mitigation Strategy & Built-In Safeguard</b>", table_cell_header)
        ],
        [
            Paragraph("<b>TomTom API Rate Quota Exhaustion</b>", table_cell_bold),
            Paragraph("<font color='#D97706'><b>Medium</b></font>", table_cell),
            Paragraph("Automatic fallback to offline mock dictionary; sliding window rate limiter protects upstream quota.", table_cell)
        ],
        [
            Paragraph("<b>Sudden Traffic Spike Discrepancy</b>", table_cell_bold),
            Paragraph("<font color='#0F766E'><b>Low</b></font>", table_cell),
            Paragraph("Client 60-second polling cadence with manual refresh trigger and UI stale-data warning badges.", table_cell)
        ],
        [
            Paragraph("<b>Developer Key Compromise</b>", table_cell_bold),
            Paragraph("<font color='#DC2626'><b>High</b></font>", table_cell),
            Paragraph("One-way SHA-256 hash storage in keys.json; secrets redacted from server logs and client bundles.", table_cell)
        ]
    ]
    t_risk = Table(risk_data, colWidths=[150, 60, 330])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_risk)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == '__main__':
    out_dir = r"e:\project\Route Wise"
    out_file = os.path.join(out_dir, "SmartRoute_AI_PRD_MRD.pdf")
    build_pdf(out_file)
    
    # Also copy to client/public
    public_dir = os.path.join(out_dir, "client", "public")
    os.makedirs(public_dir, exist_ok=True)
    import shutil
    shutil.copy2(out_file, os.path.join(public_dir, "SmartRoute_AI_PRD_MRD.pdf"))
    print("Copied to client/public/SmartRoute_AI_PRD_MRD.pdf")
