import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

prd_dir = r"e:\project\Route Wise\PRD"
os.makedirs(prd_dir, exist_ok=True)

md_file = os.path.join(prd_dir, "Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.md")
pdf_file = os.path.join(prd_dir, "Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf")
docx_file = os.path.join(prd_dir, "Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.docx")

prd_markdown = """# Product Requirements Document (PRD)

**Document Title:** Cyber Knight - Commuters Waste Time at Congested Junctions - PRD  
**Team Name:** Cyber Knight  
**Problem Statement:** Commuters waste time at congested junctions without knowing which nearby route is less crowded. Build a traffic advisory tool that suggests alternative routes based on congestion.  
**Project Name:** RouteWise - Junction-Centric Adaptive Traffic Advisory System  
**Hackathon:** JJCET AI-PDLC Hackathon 2026 | Gate 3 (Form 3 - 20 Marks)  
**Document Version:** 1.0 (Final Deliverable)  
**Date:** October 24, 2026  
**Target Reviewer / Mentor:** Mr. Vetri Sir & Hackathon Evaluation Jury  

---

## Executive Summary & Alignment to MRD

RouteWise addresses the systemic issue of urban junction gridlock in dense Tier-2 corridors (e.g., Tiruchirappalli, Coimbatore, Madurai). While legacy mapping tools optimize solely for end-to-end trip duration—often funneling thousands of drivers simultaneously into the same major bottlenecks—RouteWise focuses on **junction-level micro-telemetry**, **transparent multi-criteria alternative route ranking**, and **cross-route comparative reasoning**.

This PRD formalizes the requirements for Gate 3, strictly adhering to the **Scope Discipline** mandate: **Maximum 3 Must-Have features** that guarantee a compelling, end-to-end working demo by the 3:30 PM milestone.

---

## 1. Persona & Friction Recap (From MRD)

| Persona | Primary Goal | Pain Point / Friction | Root Cause |
|---|---|---|---|
| **Karthik Sundaram (28)**<br>IT Analyst, daily 2W commuter | Reach office before 9:00 AM biometric cutoff | Gets trapped at Central Bus Stand & Junction Flyover for 22+ mins | Legacy GPS reroutes him 3 km further or notifies him too late once inside the bottleneck |
| **Selvi Murugan (34)**<br>Last-mile Quick Commerce Courier | Deliver 8 orders/hr to maintain on-time incentive | Sudden 15-min queue at Thillai Nagar 11th Cross ruins batch delivery SLA | No visibility into cross-route trade-offs (e.g., "+400m distance saves 12 min queue delay") |

---

## 2. MoSCoW Feature Prioritization

The feature list is categorized below with the strict rule: *"If this fails, is there still a working demo?"*

### 2.1 Must-Have (Maximum 3 - Core Demo)

#### Feature 1 (F1): Real-Time Junction Alternative Discovery & Live Flow Telemetry
- **Description:** Automatically retrieves multi-path routing options between selected origin-destination pairs around congested urban junctions, extracting live traffic speeds, free-flow baseline speeds, real-time delay (seconds), and geometric length.
- **Why Must-Have:** Without live multi-route discovery and congestion telemetry, no comparative routing can occur. If F1 fails, there is no demo.
- **Provider Support:** Live TomTom Routing & Traffic Flow APIs with a zero-latency, realistic local synthetic generator fallback for offline resilience.

#### Feature 2 (F2): Multi-Criteria Heuristic Ranking Engine
- **Description:** Evaluates each candidate route against a holistic penalty score combining:
  1. Base Travel Time (seconds)
  2. Congestion Delay Penalty ($Delay \times 1.5$)
  3. Distance Friction / Fuel Penalty ($Distance \times 0.05$)
  4. Real-time Congestion Factor ($CurrentSpeed / FreeFlowSpeed$)
- **Output:** Categorizes routes into `Fastest & Smoothest` (Rank 1 - Recommended), `Scenic / Secondary Alternative`, or `Avoid - Bottleneck Trap`.
- **Why Must-Have:** Directly solves the problem of selecting which nearby route is *truly* less crowded rather than just shortest distance.

#### Feature 3 (F3): Transparent Cross-Route Comparative Explanation Box & Metric Matrix
- **Description:** A dedicated explainability engine that computes delta comparisons across all alternative routes. Displays:
  - **Badges:** e.g., *"Saves 12 min delay"*, *"Bypasses 2 choke points"*, *"1.2 km longer but 9 min faster"*.
  - **Comparative Sentence:** *"Why this route? Route 1 saves 11 mins compared to Route 2 by bypassing the Central Junction bottleneck, despite being 400m longer."*
  - **Side-by-side Matrix:** Comparison table highlighting time delta, congestion index, junction count, and road conditions.
- **Why Must-Have:** Bridges the trust gap. Competitors fail because users do not understand *why* an alternative was suggested. This directly fulfills user requirement #1.

---

### 2.2 Should-Have (Important Enhancements)

#### Feature 4 (F4): 15-Minute ML Predictive Traffic Trend Strip
- Mini sparkline / trend strip displaying anticipated congestion level for the next 15–45 minutes using historical time-of-day decay models.

#### Feature 5 (F5): User Preference Weighting Sliders
- Interactive controls enabling users to dynamically prioritize **Time Priority vs. Fuel/Distance vs. Choke-Point Avoidance**.

---

### 2.3 Could-Have (Delighters & Polish)

#### Feature 6 (F6): Multi-Palette Accessible Design Switcher
- Instant toggle between **High-Contrast Dark (OLED)**, **Emerald Traffic Flow**, **Cyber Knight Blue/Indigo**, and **Sunset Amber** using modern CSS color-mix tokens and accessible typography.

#### Feature 7 (F7): TomTom Raster Incident & Jam Flow Tile Overlay
- Interactive Leaflet map layer rendering heat-mapped traffic flow lines and incident warning markers.

---

### 2.4 Won't-Have / Out of Scope (For 3:30 PM Demo)

- **Turn-by-turn Voice Audio Guidance:** Handled by OS-level turn engines; unnecessary for advisory route selection.
- **In-App Toll & Parking Wallet:** Outside traffic advisory scope.
- **Crowdsourced Social Chat / Cop Spotting:** High moderation overhead, irrelevant to core junction telemetry.
- **Hardware OBD-II Vehicle Sensor Integration:** Focus is browser-first accessibility on commuter smartphones/desktops.

---

## 3. Persona to Feature Traceability Matrix

| Feature ID | Feature Name | Karthik Sundaram (Daily 2W Commuter) | Selvi Murugan (Last-Mile Courier) | Gate 3 Rubric Alignment |
|---|---|---|---|---|
| **F1** | Junction Alternative Discovery | Discovers 2–3 alternate bypass lanes around Central Bus Stand | Identifies secondary ring roads around delivery hubs | Problem-Solution Fit |
| **F2** | Multi-Criteria Ranking | Avoids high-risk choke points that cause missed 9 AM punch-in | Ranks routes by reliable travel time to protect batch SLA | Scope Discipline (Core) |
| **F3** | Comparative Explanation Box | Instantly sees why Route 1 saves 11 mins over Route 2 | Clear proof: "+400m distance = 14 mins saved" | Trust & Decision Support |
| **F5** | Preference Sliders | Set "Strict Avoid Delays" during morning rush hour | Balances fuel consumption with delivery deadlines | User Personalization |
| **F6** | Multi-Palette UI Switcher | High-contrast readability under bright sunlight on 2W mount | Dark mode preserves battery during 8-hr shifts | UI/UX Polish |

---

## 4. Technical Architecture & Data Pipeline

```
[ Commuter Browser / Client (Vite + React + CSS Design System) ]
                            │
               REST / JSON (Port 5000)
                            ▼
[ Express API Gateway (Node.js) ]
       │                                         │
       ▼                                         ▼
[ Live TomTom Routing & Flow API ]    [ Local Synthetic Fallback ]
(Real-time speeds, incidents)         (100% reliable offline demo)
       │                                         │
       └────────────────────┬────────────────────┘
                            ▼
[ Route Ranking & Comparative Analytics Service ]
  - Calculates Total Penalty Score: Time + (Delay * 1.5) + (Dist * 0.05)
  - Computes Delta Matrices (Route A vs Route B time & distance diff)
  - Generates Plain-English Explainability Badges & Summary Sentences
                            │
                            ▼
[ Interactive Advisory UI: Map + Route Cards + Comparison Matrix ]
```

### 4.1 Technology Stack Table

| Layer | Technology | Justification |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Sub-second hot reload, lightweight bundle (2.7s production build) |
| **Styling & Theming** | Vanilla Modern CSS (OKLab, CSS custom properties) | Zero Tailwind bloat; satisfies modern-web-guidance skill rules |
| **Mapping Engine** | Leaflet.js + OpenStreetMap / TomTom Tiles | Smooth panning, multi-polyline color encoding by congestion |
| **Backend Framework** | Node.js + Express.js | Non-blocking async I/O for concurrent telemetry calls |
| **Traffic Telemetry** | TomTom Routing API v1 + Flow API | Real-time traffic speeds, delays, and incident metadata |
| **Resilience Engine** | In-Memory Deterministic Traffic Simulator | Zero runtime failure during live jury evaluation if WiFi drops |

---

## 5. Functional Requirements & Acceptance Criteria (Gherkin BDD)

### F1: Junction Alternative Discovery
- **Scenario 1: Fetching routes for congested junction**
  - **Given** the commuter selects origin `"Junction Railway Station"` and destination `"Central Bus Stand"`,
  - **When** the commuter clicks `"Search Live Alternatives"`,
  - **Then** the system returns at least 2 distinct routing candidates within 1200ms, displaying travel time, free-flow time, delay (min), and distance (km).

### F2: Multi-Criteria Heuristic Ranking Engine
- **Scenario 2: Congested primary route vs. clear secondary bypass**
  - **Given** Route 1 has 3.2 km with 18 mins delay (total 27 mins), and Route 2 has 4.1 km with 1 min delay (total 13 mins),
  - **When** the ranking algorithm executes,
  - **Then** Route 2 is designated as `"Rank 1: Recommended Alternative"`, and Route 1 receives `"Avoid: Bottleneck Trap"` badge.

### F3: Cross-Route Comparative Explanation Box
- **Scenario 3: Displaying comparative trade-offs**
  - **Given** multiple routes are displayed on screen,
  - **When** the commuter inspects the Route 2 card,
  - **Then** an highlighted explainability box shows:
    - Headline: *"Recommended Over Alternative 1"*
    - Summary: *"Saves 14 mins by bypassing Central Flyover, despite 0.9 km extra distance."*
    - Badges: `[Saves 14m delay]`, `[+0.9 km extra]`, `[Low Congestion]`.

---

## 6. Live Demo Measurable Success Metrics

To satisfy Gate 3's requirement for metrics that can be validated live in under 5 minutes:

| Metric ID | Metric Name | Target Value | How It Is Verified Live in Demo |
|---|---|---|---|
| **M1** | Decision Latency | $\le 10$ seconds | Commuter understands which route to pick within 10 seconds of clicking search |
| **M2** | Time Savings Delta | $\ge 20\%$ time saved | Route 1 recommendation demonstrates at least 20% lower travel time during peak congestion |
| **M3** | Query Response Time | $\le 1.5$ seconds | API latency from click to rendering comparison cards and map polyline |
| **M4** | Explanation Transparency | $100\%$ route cards | Every single alternative route card contains an explicit comparative breakdown against alternatives |

---

## 7. Edge Cases & Graceful Degradation Plan

1. **Third-Party API Rate Limit (HTTP 429) or Network Drop:**
   - *Mitigation:* The backend automatically catches network errors and seamlessly switches to the high-fidelity Tier-2 Junction Synthetic Generator without crashing or showing blank screens.
2. **All Routes Saturated (Gridlock across all junction arteries):**
   - *Mitigation:* System warns user: *"Heavy saturation detected on all arterial links. Route 3 has lowest incident probability (Delay: 14m)."*
3. **Identical Travel Time on Two Alternatives:**
   - *Mitigation:* Tie-breaker defaults to the route with shorter distance, fewer intersections, and smoother road quality index.

---

## 8. Hackathon Submission & Deliverables Checklist

- [x] **MRD Completed** and saved in `e:\\project\\Route Wise\\MRD\\Cyber Knight - Commuters Waste Time at Congested Junctions - MRD` (PDF, DOCX, MD).
- [x] **PRD Completed** and saved in `e:\\project\\Route Wise\\PRD\\Cyber Knight - Commuters Waste Time at Congested Junctions - PRD` (PDF, DOCX, MD).
- [x] Scope strictly constrained to **3 Must-Haves** (F1 Discovery, F2 Multi-Criteria Ranking, F3 Cross-Route Explanation).
- [x] All unverified assumptions flagged and documented.
- [x] Responsive Web Application running on `http://localhost:5173` with backend on `http://localhost:5000`.
- [x] Public shareable links configured for mentor and jury access before 3:30 PM deadline.
"""

with open(md_file, "w", encoding="utf-8") as f:
    f.write(prd_markdown)
print(f"PRD Markdown saved to {md_file}")

# ==========================================
# REPORTLAB PDF GENERATION
# ==========================================
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1e293b"))
        self.drawString(54, 750, "CYBER KNIGHT  |  PRODUCT REQUIREMENTS DOCUMENT (PRD)")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawRightString(558, 750, "JJCET AI-PDLC Hackathon 2026 - Gate 3")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 744, 558, 744)
        
        # Footer
        self.line(54, 45, 558, 45)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Confidential - For Evaluation by Mr. Vetri Sir & Hackathon Jury")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

doc = SimpleDocTemplate(
    pdf_file,
    pagesize=letter,
    leftMargin=54,
    rightMargin=54,
    topMargin=64,
    bottomMargin=54
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=26,
    textColor=colors.HexColor("#0f172a"),
    spaceAfter=6
)
subtitle_style = ParagraphStyle(
    'DocSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor("#2563eb"),
    spaceAfter=14
)
meta_style = ParagraphStyle(
    'MetaText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor("#334155")
)
meta_bold = ParagraphStyle(
    'MetaBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor("#0f172a")
)
h1_style = ParagraphStyle(
    'Heading1_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=17,
    textColor=colors.HexColor("#1e3a8a"),
    spaceBefore=12,
    spaceAfter=6,
    keepWithNext=True
)
h2_style = ParagraphStyle(
    'Heading2_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10.5,
    leading=14,
    textColor=colors.HexColor("#0369a1"),
    spaceBefore=8,
    spaceAfter=4,
    keepWithNext=True
)
body_style = ParagraphStyle(
    'Body_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor("#1e293b"),
    spaceAfter=6
)
bullet_style = ParagraphStyle(
    'Bullet_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12,
    leftIndent=12,
    firstLineIndent=-8,
    textColor=colors.HexColor("#1e293b"),
    spaceAfter=3
)
table_cell = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=7.5,
    leading=10.5,
    textColor=colors.HexColor("#1e293b")
)
table_cell_bold = ParagraphStyle(
    'TableCellBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7.5,
    leading=10.5,
    textColor=colors.HexColor("#0f172a")
)
callout_style = ParagraphStyle(
    'CalloutText',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=8,
    leading=11.5,
    textColor=colors.HexColor("#1e293b")
)

story = []

# Title Banner
story.append(Spacer(1, 8))
story.append(Paragraph("Product Requirements Document (PRD)", title_style))
story.append(Paragraph("RouteWise: Junction-Centric Adaptive Traffic Advisory Tool", subtitle_style))

# Metadata Card Table
meta_data = [
    [Paragraph("<b>Team Name:</b>", meta_style), Paragraph("Cyber Knight", meta_bold),
     Paragraph("<b>Evaluation Gate:</b>", meta_style), Paragraph("Gate 3 (Form 3 - 20 Marks)", meta_bold)],
    [Paragraph("<b>Target Segment:</b>", meta_style), Paragraph("Urban Peak-Hour Commuters & Couriers", meta_style),
     Paragraph("<b>Date / Deadline:</b>", meta_style), Paragraph("Oct 24, 2026 | 3:30 PM", meta_bold)],
    [Paragraph("<b>Problem:</b>", meta_style), 
     Paragraph("Commuters waste time at congested junctions without knowing which nearby route is less crowded.", meta_style),
     Paragraph("<b>Scope Focus:</b>", meta_style), Paragraph("Max 3 Must-Haves (Strict Discipline)", meta_bold)],
]
t_meta = Table(meta_data, colWidths=[1.1*inch, 2.5*inch, 1.1*inch, 2.3*inch])
t_meta.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(t_meta)
story.append(Spacer(1, 10))

# Executive Summary
story.append(Paragraph("1. Executive Summary & Scope Commitment", h1_style))
story.append(Paragraph(
    "RouteWise is an AI-powered traffic advisory system engineered to resolve junction-level traffic bottlenecks in dense urban corridors (Tiruchirappalli, Coimbatore, Madurai). Unlike legacy navigation platforms that route all drivers along identical high-capacity arteries—inadvertently compounding junction gridlock—RouteWise provides <b>junction-level micro-telemetry</b>, <b>multi-criteria alternative route ranking</b>, and <b>plain-English cross-route explainability</b>. This PRD defines the specifications for Gate 3, strictly committing to a <b>maximum of 3 Must-Have features</b> to guarantee a robust, end-to-end working demo by 3:30 PM.",
    body_style
))

# Section 2: MoSCoW Prioritization
story.append(Paragraph("2. MoSCoW Feature Prioritization", h1_style))
story.append(Paragraph(
    "Features are prioritized using the strict evaluation test: <i>'If this fails, is there still a viable working demo?'</i>",
    body_style
))

# Callout box for Must Haves
must_box_content = [
    [Paragraph("<b>CORE MANDATE: MAXIMUM 3 MUST-HAVES (GATE 3 SCOPE DISCIPLINE)</b>", ParagraphStyle('B', parent=meta_bold, textColor=colors.HexColor("#991b1b")))],
    [Paragraph(
        "<b>Feature 1 (F1): Real-Time Junction Alternative Discovery & Live Flow Telemetry</b><br/>"
        "Fetches multi-path candidates around congested junctions with live TomTom speed, free-flow baseline, delay (sec), and distance. Backed by synthetic fallback.<br/><br/>"
        "<b>Feature 2 (F2): Multi-Criteria Heuristic Ranking Engine</b><br/>"
        "Evaluates routes holistically using penalty score: Time + (Delay &times; 1.5) + (Distance &times; 0.05). Sorts routes into 'Fastest & Smoothest', 'Secondary Alternative', and 'Avoid - Bottleneck Trap'.<br/><br/>"
        "<b>Feature 3 (F3): Transparent Cross-Route Comparative Explanation Box & Metric Matrix</b><br/>"
        "Computes pairwise trade-off deltas across all alternative routes. Displays visual badges ('Saves 12m delay'), comparative sentences ('Why this route?'), and side-by-side metric tables.",
        callout_style
    )]
]
t_must_box = Table(must_box_content, colWidths=[7.0*inch])
t_must_box.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef2f2")),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#f87171")),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
]))
story.append(t_must_box)
story.append(Spacer(1, 8))

# MoSCoW Summary Table
moscow_data = [
    [Paragraph("Priority", table_cell_bold), Paragraph("Feature ID & Name", table_cell_bold), Paragraph("Summary & Technical Capability", table_cell_bold), Paragraph("Demo Dependency", table_cell_bold)],
    [Paragraph("<b>MUST-HAVE</b>", ParagraphStyle('M', parent=table_cell, textColor=colors.HexColor("#b91c1c"))),
     Paragraph("F1: Junction Alternative Discovery", table_cell_bold),
     Paragraph("Queries live TomTom routing / fallback simulator for multi-path trajectories and bottleneck delay.", table_cell),
     Paragraph("CRITICAL: Without routes & telemetry, no advisory can exist.", table_cell)],
    [Paragraph("<b>MUST-HAVE</b>", ParagraphStyle('M', parent=table_cell, textColor=colors.HexColor("#b91c1c"))),
     Paragraph("F2: Multi-Criteria Ranking", table_cell_bold),
     Paragraph("Balances travel duration, bottleneck delay multiplier, and distance friction.", table_cell),
     Paragraph("CRITICAL: Determines which route is objectively superior.", table_cell)],
    [Paragraph("<b>MUST-HAVE</b>", ParagraphStyle('M', parent=table_cell, textColor=colors.HexColor("#b91c1c"))),
     Paragraph("F3: Comparative Explanation Box", table_cell_bold),
     Paragraph("Generates plain-English comparison cards, badges, and cross-route delta matrix.", table_cell),
     Paragraph("CRITICAL: Directly fulfills user trust & requirement #1.", table_cell)],
    [Paragraph("<b>SHOULD-HAVE</b>", ParagraphStyle('S', parent=table_cell, textColor=colors.HexColor("#0369a1"))),
     Paragraph("F4: 15-Min Predictive Trend", table_cell),
     Paragraph("Time-of-day decay sparkline showing anticipated congestion trend.", table_cell),
     Paragraph("NON-BLOCKING: Demo works with current telemetry.", table_cell)],
    [Paragraph("<b>SHOULD-HAVE</b>", ParagraphStyle('S', parent=table_cell, textColor=colors.HexColor("#0369a1"))),
     Paragraph("F5: Preference Weight Sliders", table_cell),
     Paragraph("Interactive sliders allowing user to adjust Time vs Fuel vs Choke-Point weights.", table_cell),
     Paragraph("NON-BLOCKING: Default balanced profile suffices.", table_cell)],
    [Paragraph("<b>COULD-HAVE</b>", ParagraphStyle('C', parent=table_cell, textColor=colors.HexColor("#15803d"))),
     Paragraph("F6: Multi-Palette Theme Switcher", table_cell),
     Paragraph("Accessible Dark / Cyber Knight / Emerald / Amber theme toggles.", table_cell),
     Paragraph("BONUS: Enhances visual polish and WOW factor.", table_cell)],
    [Paragraph("<b>COULD-HAVE</b>", ParagraphStyle('C', parent=table_cell, textColor=colors.HexColor("#15803d"))),
     Paragraph("F7: Incident & Jam Raster Tiles", table_cell),
     Paragraph("Live heatmapped tile layer overlay on Leaflet map.", table_cell),
     Paragraph("BONUS: Live visual enrichment.", table_cell)],
    [Paragraph("<b>WON'T-HAVE</b>", ParagraphStyle('W', parent=table_cell, textColor=colors.HexColor("#64748b"))),
     Paragraph("Turn-by-Turn Audio / Tolls", table_cell),
     Paragraph("Voice navigation, wallet integrations, crowdsourced incident chatting.", table_cell),
     Paragraph("OUT OF SCOPE: Explicitly omitted for 3:30 PM deadline.", table_cell)],
]
t_moscow = Table(moscow_data, colWidths=[1.1*inch, 1.8*inch, 2.7*inch, 1.4*inch])
t_moscow.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(t_moscow)
story.append(Spacer(1, 10))

# Section 3: Traceability Matrix
story.append(Paragraph("3. Persona to Feature Traceability Matrix", h1_style))
trace_data = [
    [Paragraph("Persona & Goal", table_cell_bold), Paragraph("Friction Point", table_cell_bold), Paragraph("Feature Addressing Friction", table_cell_bold), Paragraph("Live Demo Validation", table_cell_bold)],
    [Paragraph("<b>Karthik Sundaram (28)</b><br/>Daily 2W Commuter (Office Cutoff: 9 AM)", table_cell),
     Paragraph("Trapped at Central Bus Stand bottleneck for 22 mins; legacy maps reroute too late.", table_cell),
     Paragraph("<b>F1 + F2:</b> Identifies secondary bypass 400m away, prioritizing delay avoidance over raw length.", table_cell),
     Paragraph("Shows Route 1 bypasses junction, saving 11 minutes of delay.", table_cell)],
    [Paragraph("<b>Selvi Murugan (34)</b><br/>Quick Commerce Courier (8 orders/hr SLA)", table_cell),
     Paragraph("Sudden queue at 11th Cross; doesn't know if alternate route is actually faster.", table_cell),
     Paragraph("<b>F3:</b> Comparative Explanation Box displays: <i>'+400m extra saves 14 min queue delay'</i>.", table_cell),
     Paragraph("Side-by-side metric table renders explicit time and fuel trade-offs.", table_cell)],
]
t_trace = Table(trace_data, colWidths=[1.8*inch, 1.8*inch, 1.9*inch, 1.5*inch])
t_trace.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(t_trace)
story.append(Spacer(1, 10))

# Section 4: Technical Architecture & Pipeline
story.append(Paragraph("4. Technical Architecture & Data Pipeline", h1_style))
story.append(Paragraph(
    "RouteWise utilizes an agile, decoupled architecture optimized for fast evaluation and zero demo failure:",
    body_style
))
arch_desc = [
    "<b>Client Presentation Layer (Vite + React 18):</b> High-performance SPA with modern CSS theming, responsive Leaflet map, multi-route cards, and interactive comparison matrix.",
    "<b>API Gateway & Service Orchestrator (Node.js + Express):</b> Handles `/api/routes` requests, validates coordinates, and orchestrates telemetry retrieval.",
    "<b>Telemetry Aggregator:</b> Integrates with TomTom Live Routing & Traffic Flow APIs with an automatic in-memory fallback simulation engine for 100% offline uptime.",
    "<b>Ranking & Comparison Engine (server/src/services/routeRankingService.js):</b> Computes holistic penalty score, extracts comparative cross-route deltas, and synthesizes natural-language justification summaries."
]
for p in arch_desc:
    story.append(Paragraph(f"&bull; {p}", bullet_style))
story.append(Spacer(1, 8))

# Section 5: Acceptance Criteria (BDD)
story.append(Paragraph("5. Acceptance Criteria (Given / When / Then)", h1_style))
bdd_data = [
    [Paragraph("Feature ID", table_cell_bold), Paragraph("User Story / Given", table_cell_bold), Paragraph("Action / When", table_cell_bold), Paragraph("Expected Outcome / Then", table_cell_bold)],
    [Paragraph("<b>F1: Discovery</b>", table_cell_bold),
     Paragraph("Given commuter enters origin and destination near congested junction corridor", table_cell),
     Paragraph("When user clicks 'Search Live Alternatives'", table_cell),
     Paragraph("Returns 2–3 polyline routes with live duration, free-flow time, delay, and distance in < 1.5s.", table_cell)],
    [Paragraph("<b>F2: Ranking</b>", table_cell_bold),
     Paragraph("Given Route A has 27 min (18 min delay) and Route B has 13 min (1 min delay)", table_cell),
     Paragraph("When multi-criteria ranking algorithm executes", table_cell),
     Paragraph("Route B is badged as 'Rank 1: Recommended Alternative' with lowest penalty score.", table_cell)],
    [Paragraph("<b>F3: Explainability</b>", table_cell_bold),
     Paragraph("Given alternative routes have been ranked and rendered", table_cell),
     Paragraph("When commuter reviews Route B card", table_cell),
     Paragraph("Displays clear reason: 'Why this route? Route B saves 14 mins by avoiding bottleneck, despite 0.9km extra.'", table_cell)],
]
t_bdd = Table(bdd_data, colWidths=[1.1*inch, 2.0*inch, 1.8*inch, 2.1*inch])
t_bdd.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(t_bdd)
story.append(Spacer(1, 10))

# Section 6: Live Demo Success Metrics
story.append(Paragraph("6. Live Demo Measurable Success Metrics (5-Minute Verification)", h1_style))
metric_data = [
    [Paragraph("Metric ID", table_cell_bold), Paragraph("Metric Name", table_cell_bold), Paragraph("Target Threshold", table_cell_bold), Paragraph("Live Demo Verification Procedure", table_cell_bold)],
    [Paragraph("<b>M1</b>", table_cell_bold), Paragraph("Decision Latency", table_cell), Paragraph("<b>&le; 10 seconds</b>", table_cell_bold), Paragraph("Observer understands which route is superior within 10s of route display.", table_cell)],
    [Paragraph("<b>M2</b>", table_cell_bold), Paragraph("Time Savings vs Congested Route", table_cell), Paragraph("<b>&ge; 20% faster</b>", table_cell_bold), Paragraph("Recommended alternative proves &ge; 20% travel time savings over bottleneck.", table_cell)],
    [Paragraph("<b>M3</b>", table_cell_bold), Paragraph("End-to-End Query Latency", table_cell), Paragraph("<b>&le; 1500 ms</b>", table_cell_bold), Paragraph("Measured live in browser network tab from search click to map draw.", table_cell)],
    [Paragraph("<b>M4</b>", table_cell_bold), Paragraph("Explanation Coverage", table_cell), Paragraph("<b>100% of routes</b>", table_cell_bold), Paragraph("Every single route displays comparative badges and plain-language justification.", table_cell)],
]
t_metric = Table(metric_data, colWidths=[0.8*inch, 1.8*inch, 1.5*inch, 2.9*inch])
t_metric.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
    ('TOPPADDING', (0,0), (-1,-1), 4),
    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ('LEFTPADDING', (0,0), (-1,-1), 4),
    ('RIGHTPADDING', (0,0), (-1,-1), 4),
]))
story.append(t_metric)
story.append(Spacer(1, 10))

# Section 7: Edge Cases & Fault Tolerance
story.append(Paragraph("7. Edge Cases & Fault Tolerance", h1_style))
edge_data = [
    "<b>Third-Party API Rate Limit / Network Outage:</b> In-memory deterministic synthetic generator automatically catches failed external calls and returns realistic Tier-2 corridor routes, preventing blank screens.",
    "<b>Universal Arterial Congestion:</b> If all alternatives are saturated, system flags network severity and identifies the alternative with lowest deceleration variance and least severe incident probability.",
    "<b>GPS Inaccuracy / Missing Telemetry:</b> Snapping algorithm binds coordinates to nearest valid intersection node with fallback default origin/destination presets."
]
for e in edge_data:
    story.append(Paragraph(f"&bull; {e}", bullet_style))

# Build Document
doc.build(story, canvasmaker=NumberedCanvas)
print(f"PRD PDF successfully created: {pdf_file}")

# ==========================================
# DOCX GENERATION
# ==========================================
doc_docx = Document()

# Set standard margins (0.75 in)
for section in doc_docx.sections:
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)

# Styling helpers
def style_heading1(p):
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    for run in p.runs:
        run.font.name = 'Arial'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)

def style_heading2(p):
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    for run in p.runs:
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(3, 105, 161)

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{top}" w:type="dxa"/>
        <w:bottom w:w="{bottom}" w:type="dxa"/>
        <w:left w:w="{left}" w:type="dxa"/>
        <w:right w:w="{right}" w:type="dxa"/>
    </w:tcMar>''')
    tcPr.append(tcMar)

# Title
title_p = doc_docx.add_paragraph()
title_run = title_p.add_run("Product Requirements Document (PRD)")
title_run.font.name = 'Arial'
title_run.font.size = Pt(22)
title_run.font.bold = True
title_run.font.color.rgb = RGBColor(15, 23, 42)
title_p.paragraph_format.space_after = Pt(2)

sub_p = doc_docx.add_paragraph()
sub_run = sub_p.add_run("RouteWise: Junction-Centric Adaptive Traffic Advisory Tool")
sub_run.font.name = 'Arial'
sub_run.font.size = Pt(12)
sub_run.font.color.rgb = RGBColor(37, 99, 235)
sub_p.paragraph_format.space_after = Pt(12)

# Metadata Table
meta_t = doc_docx.add_table(rows=3, cols=4)
meta_t.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_t.autofit = False

meta_rows = [
    [("Team Name:", True), ("Cyber Knight", True), ("Evaluation Gate:", True), ("Gate 3 (Form 3 - 20 Marks)", True)],
    [("Target Segment:", True), ("Urban Peak-Hour Commuters & Couriers", False), ("Date / Deadline:", True), ("Oct 24, 2026 | 3:30 PM", True)],
    [("Problem Statement:", True), ("Commuters waste time at congested junctions without knowing which nearby route is less crowded.", False), ("Scope Discipline:", True), ("Max 3 Must-Haves (Strict Commitment)", True)]
]

for r_idx, r_data in enumerate(meta_rows):
    for c_idx, (text, is_bold) in enumerate(r_data):
        cell = meta_t.cell(r_idx, c_idx)
        cell.text = text
        set_cell_shading(cell, "F8FAFC" if c_idx % 2 == 0 else "FFFFFF")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(8.5)
        run.font.bold = is_bold
        run.font.color.rgb = RGBColor(15, 23, 42) if is_bold else RGBColor(51, 65, 85)

doc_docx.add_paragraph().paragraph_format.space_after = Pt(8)

# Section 1
p1 = doc_docx.add_paragraph()
p1.add_run("1. Executive Summary & Alignment to MRD")
style_heading1(p1)

body1 = doc_docx.add_paragraph()
body1.add_run(
    "RouteWise is an AI-powered traffic advisory system engineered to resolve junction-level traffic bottlenecks in dense Tier-2 urban corridors (Tiruchirappalli, Coimbatore, Madurai). Unlike legacy navigation platforms that route all drivers along identical high-capacity arteries—inadvertently compounding junction gridlock—RouteWise provides junction-level micro-telemetry, multi-criteria alternative route ranking, and plain-English cross-route explainability. This PRD defines the specifications for Gate 3, strictly committing to a maximum of 3 Must-Have features to guarantee a robust, end-to-end working demo by the 3:30 PM deadline."
)
body1.paragraph_format.space_after = Pt(8)

# Section 2
p2 = doc_docx.add_paragraph()
p2.add_run("2. MoSCoW Feature Prioritization")
style_heading1(p2)

# Must Have Box in docx
callout_t = doc_docx.add_table(rows=1, cols=1)
callout_t.alignment = WD_TABLE_ALIGNMENT.CENTER
callout_cell = callout_t.cell(0, 0)
set_cell_shading(callout_cell, "FEF2F2")
set_cell_margins(callout_cell, top=140, bottom=140, left=180, right=180)

cp = callout_cell.paragraphs[0]
c_head = cp.add_run("CORE MANDATE: MAXIMUM 3 MUST-HAVES (GATE 3 SCOPE DISCIPLINE)\n")
c_head.font.name = 'Arial'
c_head.font.size = Pt(9.5)
c_head.font.bold = True
c_head.font.color.rgb = RGBColor(185, 28, 28)

c_body = cp.add_run(
    "1. Feature 1 (F1): Real-Time Junction Alternative Discovery & Live Flow Telemetry - Queries multi-path routing candidates around congested junctions with live TomTom speed, free-flow baseline, delay (sec), and distance. Backed by synthetic fallback.\n\n"
    "2. Feature 2 (F2): Multi-Criteria Heuristic Ranking Engine - Evaluates routes holistically using penalty score: Time + (Delay * 1.5) + (Distance * 0.05). Sorts routes into 'Fastest & Smoothest', 'Secondary Alternative', and 'Avoid - Bottleneck Trap'.\n\n"
    "3. Feature 3 (F3): Transparent Cross-Route Comparative Explanation Box & Metric Matrix - Computes pairwise trade-off deltas across all alternative routes. Displays visual badges ('Saves 12m delay'), comparative sentences ('Why this route?'), and side-by-side metric tables."
)
c_body.font.name = 'Arial'
c_body.font.size = Pt(8.5)
c_body.font.italic = True
c_body.font.color.rgb = RGBColor(30, 41, 59)

doc_docx.add_paragraph().paragraph_format.space_after = Pt(8)

# MoSCoW Table
moscow_t = doc_docx.add_table(rows=1 + len(moscow_data) - 1, cols=4)
moscow_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for col_idx, h_text in enumerate(["Priority", "Feature ID & Name", "Summary & Technical Capability", "Demo Dependency"]):
    cell = moscow_t.cell(0, col_idx)
    cell.text = h_text
    set_cell_shading(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Arial'
    p.runs[0].font.size = Pt(8)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

for row_idx, r_items in enumerate(moscow_data[1:]):
    for col_idx in range(4):
        cell = moscow_t.cell(row_idx + 1, col_idx)
        # Extract text from reportlab paragraph
        raw_text = r_items[col_idx].text.replace("<b>", "").replace("</b>", "").replace("&times;", "*")
        cell.text = raw_text
        set_cell_shading(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(7.5)
        if col_idx == 0:
            run.font.bold = True
            if "MUST" in raw_text:
                run.font.color.rgb = RGBColor(185, 28, 28)
            elif "SHOULD" in raw_text:
                run.font.color.rgb = RGBColor(3, 105, 161)
            elif "COULD" in raw_text:
                run.font.color.rgb = RGBColor(21, 128, 61)
            else:
                run.font.color.rgb = RGBColor(100, 116, 139)

doc_docx.add_paragraph().paragraph_format.space_after = Pt(8)

# Section 3: Traceability
p3 = doc_docx.add_paragraph()
p3.add_run("3. Persona to Feature Traceability Matrix")
style_heading1(p3)

trace_t = doc_docx.add_table(rows=3, cols=4)
trace_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for col_idx, h_text in enumerate(["Persona & Goal", "Friction Point", "Feature Addressing Friction", "Live Demo Validation"]):
    cell = trace_t.cell(0, col_idx)
    cell.text = h_text
    set_cell_shading(cell, "1E293B")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Arial'
    p.runs[0].font.size = Pt(8)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

for row_idx, r_items in enumerate(trace_data[1:]):
    for col_idx in range(4):
        cell = trace_t.cell(row_idx + 1, col_idx)
        raw_text = r_items[col_idx].text.replace("<b>", "").replace("</b>", "").replace("<br/>", " ").replace("<i>", "").replace("</i>", "")
        cell.text = raw_text
        set_cell_shading(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(7.5)

doc_docx.add_paragraph().paragraph_format.space_after = Pt(8)

# Section 4: Technical Architecture
p4 = doc_docx.add_paragraph()
p4.add_run("4. Technical Architecture & Data Pipeline")
style_heading1(p4)

for p_text in arch_desc:
    bp = doc_docx.add_paragraph(style='List Bullet')
    run = bp.add_run(p_text.replace("<b>", "").replace("</b>", ""))
    run.font.name = 'Arial'
    run.font.size = Pt(8.5)
    bp.paragraph_format.space_after = Pt(3)

# Section 5: Acceptance Criteria
p5 = doc_docx.add_paragraph()
p5.add_run("5. Acceptance Criteria (Given / When / Then)")
style_heading1(p5)

bdd_t = doc_docx.add_table(rows=4, cols=4)
bdd_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for col_idx, h_text in enumerate(["Feature ID", "User Story / Given", "Action / When", "Expected Outcome / Then"]):
    cell = bdd_t.cell(0, col_idx)
    cell.text = h_text
    set_cell_shading(cell, "0F172A")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Arial'
    p.runs[0].font.size = Pt(8)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

for row_idx, r_items in enumerate(bdd_data[1:]):
    for col_idx in range(4):
        cell = bdd_t.cell(row_idx + 1, col_idx)
        raw_text = r_items[col_idx].text.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", "")
        cell.text = raw_text
        set_cell_shading(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(7.5)

doc_docx.add_paragraph().paragraph_format.space_after = Pt(8)

# Section 6: Live Demo Success Metrics
p6 = doc_docx.add_paragraph()
p6.add_run("6. Live Demo Measurable Success Metrics (5-Minute Verification)")
style_heading1(p6)

met_t = doc_docx.add_table(rows=5, cols=4)
met_t.alignment = WD_TABLE_ALIGNMENT.CENTER
for col_idx, h_text in enumerate(["Metric ID", "Metric Name", "Target Threshold", "Live Demo Verification Procedure"]):
    cell = met_t.cell(0, col_idx)
    cell.text = h_text
    set_cell_shading(cell, "1E3A8A")
    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
    p = cell.paragraphs[0]
    p.runs[0].font.name = 'Arial'
    p.runs[0].font.size = Pt(8)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

for row_idx, r_items in enumerate(metric_data[1:]):
    for col_idx in range(4):
        cell = met_t.cell(row_idx + 1, col_idx)
        raw_text = r_items[col_idx].text.replace("<b>", "").replace("</b>", "").replace("&le;", "<=").replace("&ge;", ">=")
        cell.text = raw_text
        set_cell_shading(cell, "FFFFFF" if row_idx % 2 == 0 else "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        run = p.runs[0]
        run.font.name = 'Arial'
        run.font.size = Pt(7.5)

doc_docx.save(docx_file)
print(f"PRD DOCX successfully created: {docx_file}")
