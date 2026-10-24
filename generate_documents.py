import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

os.makedirs('MRD', exist_ok=True)
os.makedirs('PRD', exist_ok=True)

# -------------------------------------------------------------
# Color definitions matching the screenshot
# -------------------------------------------------------------
PRIMARY_BLUE = colors.HexColor('#1e40af')
LIGHT_BLUE = colors.HexColor('#eff6ff')
BORDER_BLUE = colors.HexColor('#93c5fd')
DARK_NAVY = colors.HexColor('#0f172a')
MUTED_GRAY = colors.HexColor('#64748b')
TABLE_HEADER_BG = colors.HexColor('#0f172a')
TABLE_ROW_ALT = colors.HexColor('#f8fafc')
GREEN_ACCENT = colors.HexColor('#16a34a')
RED_ACCENT = colors.HexColor('#dc2626')
AMBER_ACCENT = colors.HexColor('#d97706')

# -------------------------------------------------------------
# 1. BUILD PRD PDF (Exact 2-Page Layout)
# -------------------------------------------------------------
def build_prd_pdf():
    pdf_path = 'PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf'
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=DARK_NAVY
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=2, # Right
        textColor=MUTED_GRAY
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_BLUE
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=PRIMARY_BLUE,
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK_NAVY
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK_NAVY
    )

    tbl_header = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white
    )

    tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=DARK_NAVY
    )

    tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=DARK_NAVY
    )

    badge_complete = ParagraphStyle(
        'BadgeComplete',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8,
        textColor=GREEN_ACCENT
    )

    story = []

    # --- Header (Title + Metadata box) ---
    hdr_table_data = [
        [
            Paragraph("<b>Route Wise — Product Requirements Document (PRD)</b>", title_style),
            Paragraph("<b>DOCUMENT:</b> PRD-v2.0<br/><b>TEAM:</b> Cyber Knight<br/><b>AUDIENCE:</b> Engineers & Mentors<br/><b>STATUS:</b> Production Ready", meta_style)
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[380, 160])
    hdr_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 2))
    
    story.append(Paragraph("Product Specifications, ML Forecasting Engine & Core Features — Explaining How It Works in Simple English", subtitle_style))
    story.append(Spacer(1, 4))

    # --- Callout Box: Product Overview & Goal ---
    overview_text = (
        "<b>Product Overview & Problem Solved:</b> Commuters waste 30 to 45 minutes at congested junction bottlenecks without knowing "
        "which nearby route is less crowded. <b>Route Wise</b> is an intelligent, traffic-aware advisory platform with a Node.js REST API "
        "and modern dark glass React/Leaflet dashboard. It fetches driving alternatives via live TomTom telemetry, ranks them using customizable "
        "multi-criteria penalty scoring, predicts future slowdowns using an official public <b>ARIMA (1,0,1)</b> ML model, and generates transparent "
        "side-by-side trade-off explanations so commuters save time and fuel."
    )
    overview_table = Table([[Paragraph(overview_text, body_style)]], colWidths=[540])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 1, BORDER_BLUE),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 6))

    # --- Section 1: How It Works in Real-Time: Step-by-Step Flow ---
    story.append(Paragraph("1. How It Works in Real-Time: Step-by-Step Flow", h1_style))
    story.append(Paragraph("To easily explain how the system works to mentors and judges, here is the exact 5-step journey of a single user request:", body_style))
    story.append(Spacer(1, 3))

    flow_data = [
        [Paragraph("Step", tbl_header), Paragraph("System Action", tbl_header), Paragraph("Real-Time Example (Trichy: Central Bus Stand to Chatram / Coimbatore)", tbl_header)],
        [
            Paragraph("<b>Step 1<br/>Input</b>", tbl_cell_bold),
            Paragraph("<b>Geocodes Locations</b>", tbl_cell_bold),
            Paragraph("User enters origin 'Tiruchirappalli' and destination 'Coimbatore'. Geocoding service converts them to GPS coordinates via TomTom (with instant local coordinate fallback).", tbl_cell)
        ],
        [
            Paragraph("<b>Step 2<br/>Ingest</b>", tbl_cell_bold),
            Paragraph("<b>Fetches Up to 3 Paths</b>", tbl_cell_bold),
            Paragraph("Queries live TomTom Routing API for all available alternatives. Ingests distance (km), free-flow baseline (s), and real-time live junction congestion delay (s).", tbl_cell)
        ],
        [
            Paragraph("<b>Step 3<br/>Forecast</b>", tbl_cell_bold),
            Paragraph("<b>ARIMA ML Prediction</b>", tbl_cell_bold),
            Paragraph("Feeds 12-step rolling velocity series into open-source <b>ARIMA (1,0,1)</b> model from GitHub to project speed changes and delay spikes at +15m, +30m, and +45m horizons.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 4<br/>Score</b>", tbl_cell_bold),
            Paragraph("<b>Multi-Criteria Ranking</b>", tbl_cell_bold),
            Paragraph("Applies composite weighting: <code>Score = (50% × Time) + (35% × Delay) + (15% × Distance)</code>. Heavily penalizes junction gridlock and ranks Route #1 as top pick.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 5<br/>Display</b>", tbl_cell_bold),
            Paragraph("<b>Explainable Dashboard</b>", tbl_cell_bold),
            Paragraph("Renders pitch-black glass cards with A/B indicator rows, colored Leaflet polylines, 15-min forecast HUD, and a side-by-side comparison matrix with 60s auto-refresh timer.", tbl_cell)
        ]
    ]
    flow_table = Table(flow_data, colWidths=[45, 125, 370])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 6))

    # --- Section 2: Core Functional Requirements (What We Built) ---
    story.append(Paragraph("2. Core Functional Requirements (What We Built)", h1_style))
    
    fr_data = [
        [Paragraph("Feature ID", tbl_header), Paragraph("Module Name", tbl_header), Paragraph("What It Does (Simple English)", tbl_header), Paragraph("Status", tbl_header)],
        [
            Paragraph("<b>FR-1</b>", tbl_cell_bold),
            Paragraph("<b>Smart Geocoder</b>", tbl_cell_bold),
            Paragraph("Converts plain text city/junction names to coordinates. If internet or API fails, instantly switches to offline dictionary so demo never crashes.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-2</b>", tbl_cell_bold),
            Paragraph("<b>Multi-Route Fetcher</b>", tbl_cell_bold),
            Paragraph("Requests candidate driving routes from TomTom Routing API with real-time live traffic delay metrics and polyline geometry.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-3</b>", tbl_cell_bold),
            Paragraph("<b>ARIMA Forecasting</b>", tbl_cell_bold),
            Paragraph("Integrates public open-source <code>zemlyansky/arima</code> WebAssembly ML model from GitHub to project speed and transit delay over 15m, 30m, and 45m horizons.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-4</b>", tbl_cell_bold),
            Paragraph("<b>Weighted Scoring Engine</b>", tbl_cell_bold),
            Paragraph("Ranks routes mathematically based on Travel Time (50%), Delay Penalty (35%), and Distance (15%). Route with highest score (0-100) is #1 pick.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-5</b>", tbl_cell_bold),
            Paragraph("<b>Transparent Rationale</b>", tbl_cell_bold),
            Paragraph("Generates plain-English comparison bullets (e.g. 'Saves 14m travel time & 37.1 km shorter vs Alt #2') and a full side-by-side comparison matrix table.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-6</b>", tbl_cell_bold),
            Paragraph("<b>API Key Security</b>", tbl_cell_bold),
            Paragraph("Requires X-API-Key header. Keys are cryptographically hashed using SHA-256 with rate-limiting (100 req/min) and developer status endpoint.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-7</b>", tbl_cell_bold),
            Paragraph("<b>Glassmorphic Dashboard</b>", tbl_cell_bold),
            Paragraph("Pitch-black glass interface with circular A/B indicator rows, quick presets (Trichy→Coimbatore, Salem→Bangalore), and interactive Leaflet map.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-8</b>", tbl_cell_bold),
            Paragraph("<b>Live Auto-Refresh (60s)</b>", tbl_cell_bold),
            Paragraph("Visual 60-second countdown timer that automatically refreshes delay metrics and re-evaluates ranking without reloading the page.", tbl_cell),
            Paragraph("Complete", badge_complete)
        ]
    ]
    fr_table = Table(fr_data, colWidths=[45, 115, 325, 55])
    fr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(fr_table)

    # PAGE 1 ENDS HERE -> PAGE 2
    story.append(PageBreak())

    # --- PAGE 2 HEADER ---
    story.append(Paragraph("<b>ROUTE WISE (CYBER KNIGHT) — PRODUCT REQUIREMENTS DOCUMENT (PAGE 2)</b>", subtitle_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("3. Technical Architecture, APIs, NFRs & Roadmap", h1_style))
    
    # 3.1 Architecture
    story.append(Paragraph(
        "<b>3.1 System Architecture: Clean 3-Tier Design</b><br/>"
        "The application is built on a modular decoupled architecture: <b>Frontend:</b> React 18 + Vite + Leaflet maps + Bootstrap 5 dark glassmorphism. "
        "<b>Backend:</b> Node.js + Express.js REST API with input validation & SHA-256 authentication. "
        "<b>AI & Traffic Layer:</b> Public open-source <b>ARIMA (1,0,1)</b> ML engine + TomTom Traffic Flow raster tiles & Routing API with resilient coordinate dictionary fallback.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # 3.2 REST API Specification
    story.append(Paragraph("<b>3.2 REST API Endpoints Specification</b>", body_bold))
    story.append(Spacer(1, 2))
    
    api_data = [
        [Paragraph("Endpoint", tbl_header), Paragraph("Method & Auth", tbl_header), Paragraph("What It Does & Expected Response", tbl_header), Paragraph("Response Time", tbl_header)],
        [
            Paragraph("<code>/api/routes/recommend</code>", tbl_cell_bold),
            Paragraph("POST<br/>X-API-Key req", tbl_cell),
            Paragraph("Accepts origin & destination. Returns ranked routes with GeoJSON coordinates, duration, traffic delay, ARIMA 15m forecast, and comparative trade-off rationale.", tbl_cell),
            Paragraph("< 350ms (Live)<br/>< 30ms (Fallback)", tbl_cell)
        ],
        [
            Paragraph("<code>/api/routes/refresh</code>", tbl_cell_bold),
            Paragraph("POST<br/>X-API-Key req", tbl_cell),
            Paragraph("Refreshes live traffic delay and re-computes ranking scores for existing routes without re-geocoding locations.", tbl_cell),
            Paragraph("< 250ms (Live)<br/>< 20ms (Fallback)", tbl_cell)
        ],
        [
            Paragraph("<code>/api/health</code>", tbl_cell_bold),
            Paragraph("GET<br/>Public (No auth)", tbl_cell),
            Paragraph("Returns system status, TomTom connectivity state, ARIMA model readiness, and server uptime.", tbl_cell),
            Paragraph("< 15ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/developer/status</code>", tbl_cell_bold),
            Paragraph("GET<br/>X-API-Key req", tbl_cell),
            Paragraph("Validates API key and returns remaining quota and rate-limit status.", tbl_cell),
            Paragraph("< 20ms", tbl_cell)
        ]
    ]
    api_table = Table(api_data, colWidths=[120, 75, 260, 85])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(api_table)
    story.append(Spacer(1, 4))

    # 3.3 NFRs & Test Coverage
    story.append(Paragraph("<b>3.3 Performance, Security & Automated Test Coverage</b>", body_bold))
    story.append(Spacer(1, 2))

    nfr_data = [
        [Paragraph("Metric / Requirement", tbl_header), Paragraph("Target Specification", tbl_header), Paragraph("How We Achieved It", tbl_header)],
        [
            Paragraph("<b>API Speed (Latency)</b>", tbl_cell_bold),
            Paragraph("< 450 ms response time", tbl_cell),
            Paragraph("Streamlined native fetch calls, light JSON payloads, and local coordinate database lookup.", tbl_cell)
        ],
        [
            Paragraph("<b>Zero-Crash Reliability</b>", tbl_cell_bold),
            Paragraph("100% demo availability", tbl_cell),
            Paragraph("Resilient network timeout handling and built-in coordinate fallback ensure routes display even if external API lags.", tbl_cell)
        ],
        [
            Paragraph("<b>API Security</b>", tbl_cell_bold),
            Paragraph("SHA-256 hashed keys", tbl_cell),
            Paragraph("Keys are never stored in plain text; Express rate-limiter prevents spam or denial of service.", tbl_cell)
        ],
        [
            Paragraph("<b>Automated Test Suite</b>", tbl_cell_bold),
            Paragraph("40 unit & integration tests", tbl_cell),
            Paragraph("Installed official TDD skill from GitHub (<code>addyosmani/agent-skills</code>). 11 client tests + 29 backend tests passing at 100%.", tbl_cell)
        ]
    ]
    nfr_table = Table(nfr_data, colWidths=[130, 120, 290])
    nfr_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(nfr_table)
    story.append(Spacer(1, 4))

    # 3.4 Roadmap
    story.append(Paragraph("<b>3.4 Product Roadmap (Now vs Next)</b>", body_bold))
    story.append(Spacer(1, 2))

    roadmap_data = [
        [Paragraph("Phase", tbl_header), Paragraph("Timeline", tbl_header), Paragraph("Key Features & Deliverables", tbl_header)],
        [
            Paragraph("<b>Phase 1: Hackathon MVP</b>", tbl_cell_bold),
            Paragraph("Current (Q4 2026)", tbl_cell),
            Paragraph("Core 3-route ranking engine, Leaflet map, ARIMA 15m traffic forecast, comparative matrix, dark glass cards, 40 automated tests.", tbl_cell)
        ],
        [
            Paragraph("<b>Phase 2: Multi-Stop Fleet</b>", tbl_cell_bold),
            Paragraph("Q1 2027", tbl_cell),
            Paragraph("Multi-stop traveling salesperson delivery sequencing, automated webhook alerts on unexpected congestion spikes, Python SDK.", tbl_cell)
        ],
        [
            Paragraph("<b>Phase 3: Smart EV Fleet</b>", tbl_cell_bold),
            Paragraph("Q2 2027", tbl_cell),
            Paragraph("Electric Vehicle (EV) battery consumption optimization, hill-incline factor, weather condition overlays, enterprise fleet portal.", tbl_cell)
        ]
    ]
    roadmap_table = Table(roadmap_data, colWidths=[120, 90, 330])
    roadmap_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(roadmap_table)
    story.append(Spacer(1, 4))

    # 3.5 2-Minute Live Demo Script for Judges
    script_content = (
        "<b>3.5 2-Minute Live Demo Script for Judges & Mentors:</b><br/>"
        "<b>Step 1 (Open Dashboard):</b> Show the clean pitch-black dark glass dashboard, Leaflet map, and 'AI Engine Live' badge.<br/>"
        "<b>Step 2 (Click Preset):</b> Click 'Trichy → Coimbatore' preset pill. Origin and destination populate and routes calculate instantly.<br/>"
        "<b>Step 3 (Explain the Ranking & AI Trade-offs):</b> Show how Route #1 is recommended because it saves 14 mins and bypasses congested junctions. Point out the Side-by-Side Comparison Matrix.<br/>"
        "<b>Step 4 (Show 15-Min ARIMA Forecast & TDD):</b> Point to the ARIMA (1,0,1) forecast HUD predicting speed trends (+15m, +30m, +45m) and mention our 40 automated tests passing at 100%."
    )
    script_table = Table([[Paragraph(script_content, body_style)]], colWidths=[540])
    script_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#86efac')),
        ('PADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(script_table)

    doc.build(story)
    print("Built PRD PDF successfully:", pdf_path)


# -------------------------------------------------------------
# 2. BUILD MRD PDF (Exact 2-Page Layout)
# -------------------------------------------------------------
def build_mrd_pdf():
    pdf_path = 'MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.pdf'
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=DARK_NAVY
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=2,
        textColor=MUTED_GRAY
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY_BLUE
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=PRIMARY_BLUE,
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK_NAVY
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK_NAVY
    )

    tbl_header = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white
    )

    tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=DARK_NAVY
    )

    tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=DARK_NAVY
    )

    story = []

    # --- Header (Title + Metadata box) ---
    hdr_table_data = [
        [
            Paragraph("<b>Route Wise — Market Requirements Document (MRD)</b>", title_style),
            Paragraph("<b>DOCUMENT:</b> MRD-v2.0<br/><b>TEAM:</b> Cyber Knight<br/><b>AUDIENCE:</b> Mentors & Judges<br/><b>STATUS:</b> Final Pitch Ready", meta_style)
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[380, 160])
    hdr_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 2))
    
    story.append(Paragraph("The Business Case, Market Need & Real-World Problem — Explaining Route Wise in Simple English", subtitle_style))
    story.append(Spacer(1, 4))

    # --- Callout Box: 30-Second Elevator Pitch ---
    pitch_text = (
        "<b>The 30-Second Elevator Pitch for Judges:</b> Most navigation apps blindly suggest the shortest route, even if it leads "
        "straight into heavy junction gridlock. <b>Route Wise (Team Cyber Knight)</b> is an intelligent traffic advisory platform and live dashboard "
        "that evaluates multiple driving alternatives, penalizes severe junction bottlenecks, and predicts 15-minute congestion trends using "
        "an official public <b>ARIMA (1,0,1)</b> ML model from GitHub. It explains <i>why</i> it chose the route in plain words (e.g. "
        "<i>'Saves 14 mins travel time and 37 km shorter vs Route #2'</i>), saving time, fuel, and driver frustration for daily commuters and couriers."
    )
    pitch_table = Table([[Paragraph(pitch_text, body_style)]], colWidths=[540])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 1, BORDER_BLUE),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 6))

    # --- Section 1: Real-World Story: Why Traditional GPS Fails Drivers ---
    story.append(Paragraph("1. Real-World Story: Why Traditional GPS Fails Drivers", h1_style))
    story.append(Paragraph(
        "<b>The Scenario (Meet Karthik the Daily Commuter & Courier):</b> It is 5:15 PM peak evening rush hour in Tiruchirappalli. "
        "Karthik has an urgent trip / package delivery from Central Bus Stand to Cantonment & Thillai Nagar.<br/>"
        "• <b>What Traditional GPS Does:</b> Recommends Route A (Direct City Arterial) because it is only <b>10.0 km</b>. However, City Arterial "
        "has an unexpected junction jam adding <b>18 minutes</b> of bumper-to-bumper delay. Total travel time: <b>42 minutes</b>. Karthik arrives late, "
        "fuel is burned idling, and stress peaks.<br/>"
        "• <b>What Route Wise Does:</b> Evaluates 3 alternatives simultaneously. Recognizes Route B (Outer Ring Corridor) is <b>12.5 km</b> (2.5 km longer) "
        "but has near-zero delay (only <b>2 mins</b>). Total travel time: <b>26 minutes</b>. Route Wise recommends Route B, explaining: "
        "<i>'Fastest path — Avoids 16 minutes of junction gridlock'</i>. Karthik arrives 16 minutes early!",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Comparison Table
    story_table_data = [
        [Paragraph("Navigation Strategy", tbl_header), Paragraph("Distance", tbl_header), Paragraph("Traffic Delay", tbl_header), Paragraph("Total Time", tbl_header), Paragraph("Driver & Commuter Outcome", tbl_header)],
        [
            Paragraph("<b>Standard Navigation App</b><br/>(Picks shortest distance)", tbl_cell_bold),
            Paragraph("10.0 km<br/>(Shortest)", tbl_cell),
            Paragraph("<font color='#dc2626'><b>+18 mins</b></font><br/>(Heavy gridlock)", tbl_cell),
            Paragraph("42 mins", tbl_cell_bold),
            Paragraph("Late arrival, high stress, fuel wasted idling in junction bottleneck.", tbl_cell)
        ],
        [
            Paragraph("<b>Route Wise (Cyber Knight)</b><br/>(Multi-criteria AI + ARIMA)", tbl_cell_bold),
            Paragraph("12.5 km<br/>(+2.5 km)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>+2 mins</b></font><br/>(Smooth flowing)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>26 mins</b></font><br/>(16m faster!)", tbl_cell_bold),
            Paragraph("On-time arrival, clear trade-off explanation, fuel-efficient constant speed.", tbl_cell)
        ]
    ]
    story_table = Table(story_table_data, colWidths=[110, 60, 80, 60, 230])
    story_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(story_table)
    story.append(Spacer(1, 6))

    # --- Section 2: The Big Market Problem We Solve ---
    story.append(Paragraph("2. The Big Market Problem We Solve", h1_style))
    story.append(Paragraph(
        "<b>1. Opaque 'Black-Box' Algorithms:</b> Traditional apps give a single route without explaining why it was picked, leaving commuters uncertain.<br/>"
        "<b>2. Inability to Predict Traffic Spikes:</b> Existing maps show current delay, but cannot tell if congestion will clear or worsen in 15 minutes.<br/>"
        "<b>3. Demo & Network Fragility:</b> Standard mapping APIs crash when offline or over quota. Developers need high-reliability fail-safes.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # --- Section 3: Market Size: Multi-Billion Dollar Opportunity ---
    story.append(Paragraph("3. Market Size: Multi-Billion Dollar Opportunity", h1_style))
    market_data = [
        [
            Paragraph("<b>TAM: $14.2 Billion</b><br/><font color='#64748b'>Global GIS, Navigation & Fleet Logistics API Market</font>", tbl_cell),
            Paragraph("<b>SAM: $2.8 Billion</b><br/><font color='#64748b'>Urban Last-Mile Delivery & Commuter Routing Software</font>", tbl_cell),
            Paragraph("<b>SOM: $350 Million</b><br/><font color='#64748b'>Tier-2 & Tier-1 Indian Logistics SaaS, Startups & Commuters</font>", tbl_cell)
        ]
    ]
    market_table = Table(market_data, colWidths=[180, 180, 180])
    market_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, BORDER_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 6)
    ]))
    story.append(market_table)

    # PAGE 1 ENDS HERE -> PAGE 2
    story.append(PageBreak())

    # --- PAGE 2 HEADER ---
    story.append(Paragraph("<b>ROUTE WISE (CYBER KNIGHT) — MARKET REQUIREMENTS DOCUMENT (PAGE 2)</b>", subtitle_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("4. Target Audience, Competition & Revenue Model", h1_style))

    # 4.1 Target Audience
    story.append(Paragraph(
        "<b>4.1 Who Needs This? (Target Customer Segments)</b><br/>"
        "• <b>Daily Urban Commuters (2W & 4W):</b> Need to bypass known junction bottlenecks during 8:00 AM – 10:00 AM and 5:00 PM – 7:30 PM peak commutes.<br/>"
        "• <b>On-Demand Couriers & Delivery Drivers:</b> Under strict SLAs (8 deliveries/hr). A 15-minute junction delay causes missed order deadlines and penalties.<br/>"
        "• <b>Fleet & Logistics Dispatchers:</b> Managing delivery vans. A 15-minute delay per driver compounds into thousands of wasted fuel rupees weekly.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # 4.2 Why Route Wise Wins Against Big Tech APIs
    story.append(Paragraph("<b>4.2 Why Route Wise Wins Against Big Tech APIs</b>", body_bold))
    story.append(Spacer(1, 2))

    comp_data = [
        [Paragraph("Feature / Capability", tbl_header), Paragraph("Google Maps API", tbl_header), Paragraph("Mapbox Navigation", tbl_header), Paragraph("Route Wise (Cyber Knight)", tbl_header)],
        [
            Paragraph("<b>Configurable Scoring Weights</b>", tbl_cell_bold),
            Paragraph("No (Fixed default algorithm)", tbl_cell),
            Paragraph("Partial (Limited vehicle profiles)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Customize Time, Delay Penalty & Distance", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Transparent 'Why' Rationale</b>", tbl_cell_bold),
            Paragraph("No (Opaque black-box route)", tbl_cell),
            Paragraph("No (No explanation given)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Clear tags like 'Saves 14m & 37 km shorter'", tbl_cell_bold)
        ],
        [
            Paragraph("<b>15-Min ML Traffic Forecast</b>", tbl_cell_bold),
            Paragraph("No (Live conditions only)", tbl_cell),
            Paragraph("No (Historical averages only)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Public ARIMA(1,0,1) model for +15m, +30m, +45m", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Traffic Severity Badges</b>", tbl_cell_bold),
            Paragraph("Partial (Visual map lines only)", tbl_cell),
            Paragraph("Partial (Generic speed colors)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Green / Yellow / Red delay classifier", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Offline Demo Fail-Safe</b>", tbl_cell_bold),
            Paragraph("No (Fails if internet drops)", tbl_cell),
            Paragraph("No (Requires paid offline packs)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — High-fidelity local coordinate dictionary", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Side-by-Side Comparison Matrix</b>", tbl_cell_bold),
            Paragraph("No (Must switch back & forth)", tbl_cell),
            Paragraph("No (Single route view)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Simultaneous comparison table", tbl_cell_bold)
        ]
    ]
    comp_table = Table(comp_data, colWidths=[120, 120, 120, 180])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 4))

    # 4.3 Monetization
    story.append(Paragraph("<b>4.3 How We Monetize (Simple Tiered Model)</b>", body_bold))
    story.append(Spacer(1, 2))

    monetize_data = [
        [Paragraph("Tier", tbl_header), Paragraph("Price", tbl_header), Paragraph("Included Quota & Capabilities", tbl_header), Paragraph("Target Customer", tbl_header)],
        [
            Paragraph("<b>Free Developer</b>", tbl_cell_bold),
            Paragraph("$0 / mo", tbl_cell),
            Paragraph("1,000 queries/month, 60 req/min rate limit, full dashboard access, offline mock mode.", tbl_cell),
            Paragraph("Hackathons, student projects, prototyping.", tbl_cell)
        ],
        [
            Paragraph("<b>Growth Fleet</b>", tbl_cell_bold),
            Paragraph("$0.003 / query", tbl_cell),
            Paragraph("Up to 250,000 queries/month, custom scoring presets, 60-second live refresh API, ARIMA forecast.", tbl_cell),
            Paragraph("Courier startups, local delivery fleets.", tbl_cell)
        ],
        [
            Paragraph("<b>Enterprise</b>", tbl_cell_bold),
            Paragraph("Custom SLA", tbl_cell),
            Paragraph("Unlimited queries, multi-stop TSP route optimization, dedicated container hosting, 99.9% uptime SLA.", tbl_cell),
            Paragraph("Logistics corporations, mobility providers.", tbl_cell)
        ]
    ]
    monetize_table = Table(monetize_data, colWidths=[80, 70, 240, 150])
    monetize_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TABLE_HEADER_BG),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_ROW_ALT])
    ]))
    story.append(monetize_table)
    story.append(Spacer(1, 5))

    # 4.4 Top 3 Takeaways to Explain to Judges
    story.append(Paragraph("<b>4.4 Top 3 Takeaways to Explain to Judges & Mentors</b>", body_bold))
    story.append(Spacer(1, 2))

    takeaways_data = [
        [
            Paragraph("<b>1. Not Just Another Map:</b><br/>We don't reinvent map tiles; we solve the intelligence layer that evaluates multiple alternatives and tells you <i>why</i> Route #1 is the best.", tbl_cell),
            Paragraph("<b>2. Tangible Commuter ROI:</b><br/>Saving 15 minutes of junction delay per trip directly reduces fuel consumption, vehicle wear, late penalties, and driver burnout.", tbl_cell),
            Paragraph("<b>3. Production-Ready Tech:</b><br/>Powered by TomTom live traffic, public <b>ARIMA (1,0,1)</b> ML forecasting, resilient fail-safes, and <b>40 automated tests</b> passed at 100%.", tbl_cell)
        ]
    ]
    takeaways_table = Table(takeaways_data, colWidths=[180, 180, 180])
    takeaways_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 1, BORDER_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5)
    ]))
    story.append(takeaways_table)

    doc.build(story)
    print("Built MRD PDF successfully:", pdf_path)


# -------------------------------------------------------------
# 3. BUILD DOCX DOCUMENTS
# -------------------------------------------------------------
def build_prd_docx():
    docx_path = 'PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.docx'
    doc = docx.Document()
    
    # Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Route Wise — Product Requirements Document (PRD)")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p_meta = doc.add_paragraph("DOCUMENT: PRD-v2.0 | TEAM: Cyber Knight | AUDIENCE: Engineers & Mentors | STATUS: Production Ready")
    p_meta.runs[0].font.size = Pt(9.5)
    p_meta.runs[0].font.color.rgb = RGBColor(100, 116, 139)
    
    p_sub = doc.add_paragraph("Product Specifications, ML Forecasting Engine & Core Features — Explaining How It Works in Simple English")
    p_sub.runs[0].bold = True
    p_sub.runs[0].font.color.rgb = RGBColor(30, 64, 175)
    
    # Overview Box
    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(
        "Product Overview & Goal: Commuters waste 30 to 45 minutes at congested junction bottlenecks without knowing which nearby route is less crowded. "
        "Route Wise is an intelligent, traffic-aware routing system composed of an Express REST API and an interactive React/Leaflet dashboard. Given any origin "
        "and destination, it retrieves up to 3 driving alternatives, ranks them mathematically using customizable penalty weights for traffic delay, predicts "
        "future velocity trends via an ARIMA (1,0,1) machine learning model, and provides transparent side-by-side explanations for every recommendation."
    )
    r_box.font.size = Pt(10)
    
    doc.add_heading("1. How It Works in Real-Time: Step-by-Step Flow", level=2)
    t1 = doc.add_table(rows=6, cols=3)
    t1.style = 'Table Grid'
    headers1 = ["Step", "System Action", "Real-Time Example (Trichy: Central Bus Stand to Coimbatore)"]
    for i, h in enumerate(headers1):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].bold = True
    
    steps = [
        ("Step 1: Input", "Geocodes Locations", "User enters origin 'Tiruchirappalli' and destination 'Coimbatore'. Geocoding service converts them to GPS coordinates via TomTom (with instant offline fallback)."),
        ("Step 2: Ingest", "Fetches 3 Paths", "Queries TomTom Routing API for all candidate driving alternatives. Ingests distance (km), baseline free-flow travel time (s), and real-time live traffic congestion delay (s)."),
        ("Step 3: Forecast", "ARIMA ML Prediction", "Feeds 12-step rolling velocity series into open-source ARIMA (1,0,1) model from GitHub to project speed changes and delay spikes at +15m, +30m, and +45m horizons."),
        ("Step 4: Score", "Applies Scoring Formula", "Applies composite weighting: Score = (50% × Time) + (35% × Traffic Delay) + (15% × Distance). Heavily penalizes stop-and-go junction gridlock and ranks Route #1 as top pick."),
        ("Step 5: Display", "Interactive Dashboard", "Draws color-coded polyline paths on Leaflet map. Displays pitch-black glass route cards, 15-minute ARIMA forecast HUD, and side-by-side comparison matrix with 60s auto-refresh.")
    ]
    for idx, (st, act, ex) in enumerate(steps):
        row = t1.rows[idx+1]
        row.cells[0].text = st
        row.cells[1].text = act
        row.cells[2].text = ex
        
    doc.add_heading("2. Core Functional Requirements (What We Built)", level=2)
    t2 = doc.add_table(rows=9, cols=4)
    t2.style = 'Table Grid'
    headers2 = ["Feature ID", "Module Name", "What It Does (Simple English)", "Status"]
    for i, h in enumerate(headers2):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    frs = [
        ("FR-1", "Smart Geocoder", "Converts plain text city/street names to coordinates. If internet or API fails, instantly switches to offline dictionary so demo never crashes.", "Complete"),
        ("FR-2", "Multi-Route Fetcher", "Requests candidate driving routes from TomTom Routing API with real-time live traffic delay metrics and polyline geometry.", "Complete"),
        ("FR-3", "ARIMA Traffic Forecast", "Integrates public open-source zemlyansky/arima WebAssembly ML model from GitHub to project speed and transit delay over 15m, 30m, and 45m horizons.", "Complete"),
        ("FR-4", "Weighted Scoring Engine", "Ranks routes mathematically based on Time, Delay Penalty, and Distance. The route with the highest overall score (0-100) is recommended as #1.", "Complete"),
        ("FR-5", "Explainable Comparison", "Generates human-readable trade-off reasons (e.g. 'Saves 14m travel time & 37.1 km shorter vs Alt #2') and a full side-by-side comparison matrix.", "Complete"),
        ("FR-6", "API Key Security", "Requires X-API-Key header. Keys are cryptographically hashed using SHA-256 with rate-limiting (100 req/min).", "Complete"),
        ("FR-7", "Leaflet Map Dashboard", "Interactive React 18 map showing colored polylines, start/end pins, route summary cards, and quick city preset buttons (Trichy, Salem, Chennai).", "Complete"),
        ("FR-8", "Live Auto-Refresh (60s)", "A visual 60-second countdown timer that automatically refreshes delay metrics and re-evaluates ranking without reloading the page.", "Complete")
    ]
    for idx, (fid, mod, desc, stat) in enumerate(frs):
        row = t2.rows[idx+1]
        row.cells[0].text = fid
        row.cells[1].text = mod
        row.cells[2].text = desc
        row.cells[3].text = stat
        
    doc.add_heading("3. Technical Architecture, APIs, NFRs & Roadmap", level=2)
    doc.add_paragraph(
        "3.1 System Architecture: Clean 3-Tier Design\n"
        "Frontend: React 18 + Vite + Leaflet maps + Bootstrap 5 dark glassmorphism.\n"
        "Backend: Node.js + Express.js REST API with input validation & SHA-256 authentication.\n"
        "AI/ML Layer: Public open-source ARIMA (1,0,1) time-series model (zemlyansky/arima) + TomTom Traffic Flow & Routing API with resilient coordinate dictionary fallback."
    )
    
    doc.add_heading("3.2 Performance, Security & Automated Test Coverage", level=3)
    doc.add_paragraph(
        "• API Speed: < 450 ms response time with streamlined native fetch and local cache.\n"
        "• Zero-Crash Reliability: Built-in coordinate dictionary and network timeout fallback ensure routes display even if internet or TomTom quota fails.\n"
        "• Automated Test Suite: Followed Addy Osmani's test-driven-development skill from GitHub. 40 automated tests (11 client tests + 29 backend tests) passing at 100%."
    )
    
    doc.add_heading("3.3 2-Minute Live Demo Script for Judges", level=3)
    doc.add_paragraph(
        "Step 1 (Open Dashboard): Show the clean pitch-black dark glass dashboard, Leaflet map, and AI Engine Live badge.\n"
        "Step 2 (Click Preset): Click 'Trichy → Coimbatore' preset pill. Origin and destination populate automatically and 3 routes calculate instantly.\n"
        "Step 3 (Explain the Ranking): Point out how Route #1 is recommended because it saves 14 minutes and bypasses junction gridlock. Show the Side-by-Side Comparison Matrix.\n"
        "Step 4 (Show 15-Min ARIMA Forecast & Tests): Point to the 15-Min ARIMA ML forecast HUD and mention our 40 automated tests passing at 100%."
    )
    
    doc.save(docx_path)
    print("Built PRD DOCX successfully:", docx_path)


def build_mrd_docx():
    docx_path = 'MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.docx'
    doc = docx.Document()
    
    # Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Route Wise — Market Requirements Document (MRD)")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p_meta = doc.add_paragraph("DOCUMENT: MRD-v2.0 | TEAM: Cyber Knight | AUDIENCE: Mentors & Judges | STATUS: Final Pitch Ready")
    p_meta.runs[0].font.size = Pt(9.5)
    p_meta.runs[0].font.color.rgb = RGBColor(100, 116, 139)
    
    p_sub = doc.add_paragraph("The Business Case, Market Need & Real-World Problem — Explaining Route Wise in Simple English")
    p_sub.runs[0].bold = True
    p_sub.runs[0].font.color.rgb = RGBColor(30, 64, 175)
    
    # Pitch Box
    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    r_box = p_box.add_run(
        "The 30-Second Elevator Pitch for Judges: Most navigation apps blindly suggest the shortest route, even if it leads straight into heavy traffic gridlock. "
        "Route Wise (Team Cyber Knight) is an intelligent traffic advisory tool and live dashboard that compares multiple routes, penalizes severe traffic delays, "
        "and predicts 15-minute congestion trends using an official public ARIMA (1,0,1) model from GitHub. It explains why it chose the route in plain words "
        "(e.g. 'Saves 14 mins travel time and 37 km shorter vs Route #2'), saving time, fuel, and driver frustration for daily commuters and couriers."
    )
    r_box.font.size = Pt(10)
    
    doc.add_heading("1. Real-World Story: Why Traditional GPS Fails Drivers", level=2)
    doc.add_paragraph(
        "The Scenario (Meet Karthik the Daily Commuter & Courier): It is 5:15 PM during evening rush hour in Tiruchirappalli. "
        "Karthik has an urgent trip / package delivery from Central Bus Stand to Cantonment & Thillai Nagar.\n"
        "• What Traditional GPS Does: It recommends Route A (Direct City Arterial) because it is only 10.0 km. However, City Arterial has an unexpected "
        "bottleneck with 18 minutes of bumper-to-bumper traffic delay. Total travel time: 42 minutes. Karthik arrives late, fuel is wasted, and stress peaks.\n"
        "• What Route Wise Does: Route Wise analyzes 3 alternatives simultaneously. It recognizes that Route B (Outer Ring Corridor) is 12.5 km (2.5 km longer), "
        "but has almost zero congestion (only 2 minutes of delay). Total travel time: 26 minutes. Route Wise recommends Route B, explaining: "
        "'Fastest path — Avoids 16 minutes of traffic jam'. Karthik arrives 16 minutes early!"
    )
    
    t1 = doc.add_table(rows=3, cols=5)
    t1.style = 'Table Grid'
    headers1 = ["Navigation Strategy", "Distance", "Traffic Delay", "Total Time", "Driver & Commuter Outcome"]
    for i, h in enumerate(headers1):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    strategies = [
        ("Standard Navigation App (Picks shortest distance)", "10.0 km (Shortest)", "+18 mins (Heavy gridlock)", "42 mins", "Late delivery, high stress, fuel wasted idling in traffic jam."),
        ("Route Wise (Cyber Knight) (Multi-criteria AI + ARIMA)", "12.5 km (+2.5 km)", "+2 mins (Smooth flowing)", "26 mins (16m faster!)", "On-time delivery, clear trade-off explanation, fuel-efficient constant speed.")
    ]
    for idx, (strat, dist, delay, tot, outc) in enumerate(strategies):
        row = t1.rows[idx+1]
        row.cells[0].text = strat
        row.cells[1].text = dist
        row.cells[2].text = delay
        row.cells[3].text = tot
        row.cells[4].text = outc
        
    doc.add_heading("2. The Big Market Problem We Solve", level=2)
    doc.add_paragraph(
        "1. Opaque 'Black-Box' Algorithms: Current mapping APIs provide a single route without explaining why it was picked, leaving dispatchers and commuters blind.\n"
        "2. Inability to Predict Traffic Spikes: Existing maps show current delay, but cannot tell if congestion will clear or worsen in 15 minutes.\n"
        "3. Demo & Network Fragility: Traditional routing APIs break when offline or over quota. Developers need high-reliability fail-safes."
    )
    
    doc.add_heading("3. Market Size: Multi-Billion Dollar Opportunity", level=2)
    doc.add_paragraph(
        "• TAM: $14.2 Billion — Global GIS, Navigation & Fleet Logistics API Market\n"
        "• SAM: $2.8 Billion — Urban Last-Mile Delivery & Commuter Routing Software\n"
        "• SOM: $350 Million — Tier-2 & Tier-1 Indian Logistics SaaS, Startups & Commuters"
    )
    
    doc.add_heading("4. Target Audience, Competition & Revenue Model", level=2)
    doc.add_paragraph(
        "4.1 Target Customer Segments:\n"
        "• Daily Urban Commuters (2W & 4W): Need to bypass known junction bottlenecks during 8:00 AM – 10:00 AM and 5:00 PM – 7:30 PM peak commutes.\n"
        "• On-Demand Couriers & Delivery Platforms: Under strict SLAs (8 deliveries/hr). A 15-minute junction delay causes missed order deadlines and penalties.\n"
        "• Fleet & Logistics Dispatchers: Managing delivery vans. A 15-minute delay per driver compounds into thousands of wasted fuel rupees weekly."
    )
    
    doc.add_heading("4.2 Why Route Wise Wins Against Big Tech APIs", level=3)
    t2 = doc.add_table(rows=7, cols=4)
    t2.style = 'Table Grid'
    headers2 = ["Feature / Capability", "Google Maps API", "Mapbox Navigation", "Route Wise (Cyber Knight)"]
    for i, h in enumerate(headers2):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    comps = [
        ("Configurable Scoring Weights", "No (Fixed default algorithm)", "Partial (Limited vehicle profiles)", "Yes — Customize Time, Delay Penalty & Distance"),
        ("Transparent 'Why' Rationale", "No (Opaque black-box route)", "No (No explanation given)", "Yes — Clear tags like 'Saves 14m & 37 km shorter'"),
        ("15-Min ML Traffic Forecast", "No (Live conditions only)", "No (Historical averages only)", "Yes — Public ARIMA(1,0,1) model for +15m, +30m, +45m"),
        ("Traffic Severity Badges", "Partial (Visual map lines only)", "Partial (Generic speed colors)", "Yes — Green / Yellow / Red delay classifier"),
        ("Offline Demo Fail-Safe", "No (Fails if internet drops)", "No (Requires paid offline packs)", "Yes — High-fidelity local coordinate dictionary"),
        ("Side-by-Side Comparison Matrix", "No (Must switch back & forth)", "No (Single route view)", "Yes — Simultaneous comparison table")
    ]
    for idx, (feat, ggl, mbx, rw) in enumerate(comps):
        row = t2.rows[idx+1]
        row.cells[0].text = feat
        row.cells[1].text = ggl
        row.cells[2].text = mbx
        row.cells[3].text = rw
        
    doc.add_heading("4.3 Top 3 Takeaways to Explain to Judges", level=3)
    doc.add_paragraph(
        "1. Not Just Another Map: We don't reinvent map tiles; we solve the intelligence layer that evaluates multiple alternatives and tells you why Route #1 is the best.\n"
        "2. Tangible Commuter ROI: Saving 15 minutes of junction delay per trip directly reduces fuel consumption, vehicle wear, late penalties, and driver burnout.\n"
        "3. Production-Ready Tech: Powered by TomTom live traffic, public ARIMA (1,0,1) ML forecasting, resilient fail-safes, and 40 automated tests passed at 100%."
    )
    
    doc.save(docx_path)
    print("Built MRD DOCX successfully:", docx_path)

build_prd_pdf()
build_mrd_pdf()
build_prd_docx()
build_mrd_docx()
