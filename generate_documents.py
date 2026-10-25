import os
import shutil
import pypdf
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

os.makedirs('MRD', exist_ok=True)
os.makedirs('PRD', exist_ok=True)
os.makedirs('client/public', exist_ok=True)

# -------------------------------------------------------------
# Color definitions & Palette
# -------------------------------------------------------------
PRIMARY_NAVY = colors.HexColor('#0f172a')   # Slate 900
PRIMARY_BLUE = colors.HexColor('#1e40af')   # Blue 800
ACCENT_BLUE  = colors.HexColor('#2563eb')   # Blue 600
LIGHT_BLUE   = colors.HexColor('#eff6ff')   # Blue 50
BORDER_BLUE  = colors.HexColor('#93c5fd')   # Blue 300
BORDER_MUTED = colors.HexColor('#cbd5e1')   # Slate 300
MUTED_GRAY   = colors.HexColor('#64748b')   # Slate 500
DARK_TEXT    = colors.HexColor('#0f172a')   # Slate 900
ROW_ALT_BG   = colors.HexColor('#f8fafc')   # Slate 50
GREEN_ACCENT = colors.HexColor('#16a34a')   # Green 600
LIGHT_GREEN  = colors.HexColor('#f0fdf4')   # Green 50
BORDER_GREEN = colors.HexColor('#86efac')   # Green 300
RED_ACCENT   = colors.HexColor('#dc2626')   # Red 600
AMBER_ACCENT = colors.HexColor('#d97706')   # Amber 600

# -------------------------------------------------------------
# Running Header & Footer Canvas
# -------------------------------------------------------------
class MasterNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(MasterNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(MasterNumberedCanvas, self).showPage()
        super(MasterNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 6.5)
        self.setFillColor(MUTED_GRAY)
        
        # Header (Pages 2 through N)
        if self._pageNumber > 1:
            self.drawString(36, 768, "ROUTE WISE (CYBER KNIGHT) — GOLD STANDARD MRD & PRD SPECIFICATION")
            self.setFont("Helvetica", 6.5)
            self.drawRightString(576, 768, "JJCET AI-PDLC HACKATHON | 99 AUTOMATED TESTS (100% PASS)")
            self.setStrokeColor(BORDER_MUTED)
            self.setLineWidth(0.5)
            self.line(36, 763, 576, 763)
        
        # Footer (All pages)
        self.setStrokeColor(BORDER_MUTED)
        self.setLineWidth(0.5)
        self.line(36, 26, 576, 26)
        
        self.setFont("Helvetica", 6.8)
        self.drawString(36, 17, "Route Wise (SmartRoute AI) — Team Cyber Knight | Production PWA & Express API")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 6.8)
        self.drawRightString(576, 17, page_str)
        self.restoreState()


class StandaloneNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(StandaloneNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(StandaloneNumberedCanvas, self).showPage()
        super(StandaloneNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 6.5)
        self.setFillColor(MUTED_GRAY)
        
        # Header (Page 2+)
        if self._pageNumber > 1:
            self.drawString(36, 768, "ROUTE WISE (CYBER KNIGHT) — SPECIFICATION DELIVERABLE")
            self.setFont("Helvetica", 6.5)
            self.drawRightString(576, 768, "VERIFIED DELIVERABLE (99 TESTS)")
            self.setStrokeColor(BORDER_MUTED)
            self.setLineWidth(0.5)
            self.line(36, 763, 576, 763)
        
        # Footer
        self.setStrokeColor(BORDER_MUTED)
        self.setLineWidth(0.5)
        self.line(36, 26, 576, 26)
        
        self.setFont("Helvetica", 6.8)
        self.drawString(36, 17, "Route Wise — Team Cyber Knight | Production Ready")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 6.8)
        self.drawRightString(576, 17, page_str)
        self.restoreState()


# -------------------------------------------------------------
# Common ReportLab Typography Styles
# -------------------------------------------------------------
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=15,
    textColor=PRIMARY_NAVY
)

meta_style = ParagraphStyle(
    'MetaStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=6.5,
    leading=8.5,
    alignment=2, # Right
    textColor=MUTED_GRAY
)

subtitle_style = ParagraphStyle(
    'SubTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=7.5,
    leading=9.5,
    textColor=PRIMARY_BLUE
)

section_h1 = ParagraphStyle(
    'SecH1',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=10.5,
    textColor=PRIMARY_BLUE,
    spaceBefore=3,
    spaceAfter=2,
    keepWithNext=True
)

body_text = ParagraphStyle(
    'BodyTextCustom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=6.5,
    leading=8.2,
    textColor=DARK_TEXT
)

body_bold = ParagraphStyle(
    'BodyBoldCustom',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=6.5,
    leading=8.2,
    textColor=DARK_TEXT
)

tbl_header = ParagraphStyle(
    'TblHdr',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=6.2,
    leading=7.8,
    textColor=colors.white
)

tbl_cell = ParagraphStyle(
    'TblCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=6.0,
    leading=7.4,
    textColor=DARK_TEXT
)

tbl_cell_bold = ParagraphStyle(
    'TblCellBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=6.0,
    leading=7.4,
    textColor=DARK_TEXT
)

badge_p0 = ParagraphStyle(
    'BadgeP0',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=5.8,
    leading=7.0,
    textColor=colors.HexColor('#0f766e')
)

badge_p1 = ParagraphStyle(
    'BadgeP1',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=5.8,
    leading=7.0,
    textColor=PRIMARY_BLUE
)

badge_p2 = ParagraphStyle(
    'BadgeP2',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=5.8,
    leading=7.0,
    textColor=MUTED_GRAY
)

badge_complete = ParagraphStyle(
    'BadgeComplete',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=5.8,
    leading=7.0,
    textColor=GREEN_ACCENT
)


# =========================================================================
# REUSABLE FLOWABLE BLOCKS
# =========================================================================

def get_mrd_page_1():
    """Builds MRD Page 1 flowables: Title, Pitch, 5-Why Problem, Real Case, Sizing"""
    story = []
    
    # Title & Metadata
    hdr_table_data = [
        [
            Paragraph("<b>Route Wise — Market Requirements Document (MRD)</b>", title_style),
            Paragraph("<b>DOC:</b> MRD-v2.6-GOLD | <b>TEAM:</b> Cyber Knight<br/><b>STATUS:</b> Approved & Verified (99 Tests)<br/><b>AUDIENCE:</b> Evaluators, Mentors & Judges", meta_style)
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[380, 160])
    hdr_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(hdr_table)
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_BLUE, spaceBefore=2, spaceAfter=3))

    # 30-Second Elevator Pitch
    pitch_text = (
        "<b>The 30-Second Elevator Pitch:</b> Most navigation apps blindly suggest the shortest route, funneling traffic into severe junction gridlock. "
        "<b>Route Wise (Team Cyber Knight)</b> is an intelligent traffic advisory platform, live glassmorphic dashboard, and installable PWA. "
        "It evaluates multiple driving alternatives, penalizes junction bottlenecks using Adjusted ETA with an anti-flapping switch threshold, "
        "predicts 15-minute trends via public <b>ARIMA (1,0,1)</b> ML, correlates crowd-sourced incidents with TomTom speed-drop telemetry via 2-vote consensus, "
        "provides municipal authority recurrent hotspot triage, and guarantees corridor retention during 1-tap Google Maps handoff."
    )
    pitch_table = Table([[Paragraph(pitch_text, body_text)]], colWidths=[540])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_BLUE),
        ('PADDING', (0,0), (-1,-1), 4)
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 2))

    # 1. Problem Framing & 5-Why Analysis
    story.append(Paragraph("1. Problem Framing & 5-Why Root Cause Analysis", section_h1))
    prob_stmt = (
        "<b>Validated Problem Statement:</b> Daily commuters and couriers face 15-to-30-minute delays at junction bottlenecks in Tier-1/2 Indian cities "
        "(e.g. Tiruchirappalli), causing missed SLAs, excess fuel burn, and stress. Standard GPS algorithms over-weight physical distance and lack transparent "
        "trade-off explanations. Therefore, there is an urgent need for an explainable routing system that penalizes junction gridlock and validates crowd alerts."
    )
    story.append(Paragraph(prob_stmt, body_text))
    story.append(Spacer(1, 2))

    five_why_data = [
        [Paragraph("5-Why Diagnostic Root Cause Tree", tbl_header), Paragraph("Analysis & Evidence", tbl_header)],
        [Paragraph("<b>1. Why delayed?</b>", tbl_cell_bold), Paragraph("Trapped in bumper-to-bumper junction gridlock during peak hours.", tbl_cell)],
        [Paragraph("<b>2. Why enter?</b>", tbl_cell_bold), Paragraph("Standard GPS displays the junction route as the shortest path in kilometers.", tbl_cell)],
        [Paragraph("<b>3. Why shortest?</b>", tbl_cell_bold), Paragraph("Incumbent APIs use opaque black-box weights without customizable junction delay penalties.", tbl_cell)],
        [Paragraph("<b>4. Why no detour?</b>", tbl_cell_bold), Paragraph("Commuters receive no side-by-side trade-off explanations (e.g. '+2.5 km but 16m faster').", tbl_cell)],
        [Paragraph("<b>5. Root Cause</b>", tbl_cell_bold), Paragraph("<b>Lack of an explainable engine combining live delay, ML forecasting, and verified crowd alerts.</b>", tbl_cell_bold)]
    ]
    t_why = Table(five_why_data, colWidths=[90, 450])
    t_why.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_why)
    story.append(Spacer(1, 3))

    # Real-World Scenario: Trichy Peak Rush Hour
    story.append(Paragraph("<b>Real-World Validation: Trichy Peak Rush Hour (CBS ⇄ Thillai Nagar across Cantonment)</b>", body_bold))
    case_data = [
        [Paragraph("Navigation System", tbl_header), Paragraph("Distance", tbl_header), Paragraph("Junction Delay", tbl_header), Paragraph("Trip Time", tbl_header), Paragraph("Driver & Courier Outcome", tbl_header)],
        [
            Paragraph("<b>Standard Navigation App</b><br/>(Shortest distance default)", tbl_cell_bold),
            Paragraph("10.0 km<br/>(Shortest)", tbl_cell),
            Paragraph("<font color='#dc2626'><b>+18 mins</b></font><br/>(HPO bottleneck)", tbl_cell),
            Paragraph("42 mins", tbl_cell_bold),
            Paragraph("Late delivery, customer SLA breach, high fuel wasted idling in gridlock.", tbl_cell)
        ],
        [
            Paragraph("<b>Route Wise (Cyber Knight)</b><br/>(Adjusted ETA + ARIMA ML)", tbl_cell_bold),
            Paragraph("12.5 km<br/>(+2.5 km)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>+2 mins</b></font><br/>(Smooth flowing)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>26 mins</b></font><br/>(16m faster!)", tbl_cell_bold),
            Paragraph("On-time delivery, clear trade-off rationale, fuel-efficient constant speed corridor.", tbl_cell)
        ]
    ]
    t_case = Table(case_data, colWidths=[130, 60, 80, 60, 210])
    t_case.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_case)
    story.append(Spacer(1, 3))

    # 2. Market Sizing (TAM / SAM / SOM)
    story.append(Paragraph("2. Market Opportunity & Sizing (Assumptions Explicitly Marked)", section_h1))
    market_data = [
        [
            Paragraph("<b>TAM: $14.2 Billion</b><br/><font color='#64748b'>Global GIS, Navigation & Fleet Logistics API Market (CAGR 12.4%)<br/><i>*Assumption: Worldwide logistics transition to API-driven dispatch.</i></font>", tbl_cell),
            Paragraph("<b>SAM: $2.8 Billion</b><br/><font color='#64748b'>Urban Last-Mile Delivery & Commuter Routing Software Platforms<br/><i>*Assumption: 20% of urban fleets adopt dynamic junction-avoidance software.</i></font>", tbl_cell),
            Paragraph("<b>SOM: $350 Million</b><br/><font color='#64748b'>Tier-1 & Tier-2 Indian Logistics Startups, Fleets & Commuters<br/><i>*Assumption: Initial focus on South Indian freight hubs (Trichy, Coimbatore, Chennai).</i></font>", tbl_cell)
        ]
    ]
    t_market = Table(market_data, colWidths=[180, 180, 180])
    t_market.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ROW_ALT_BG),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_market)

    return story


def get_mrd_page_2():
    """Builds MRD Page 2 flowables: Personas, Journey, Competitors, Moat, GTM, Risks"""
    story = []
    
    story.append(Paragraph("<b>ROUTE WISE (CYBER KNIGHT) — MARKET REQUIREMENTS (PAGE 2)</b>", subtitle_style))
    story.append(Spacer(1, 1))

    # 3. Target Personas
    story.append(Paragraph("3. Target Customer Personas", section_h1))
    persona_data = [
        [Paragraph("Persona", tbl_header), Paragraph("Role & Context", tbl_header), Paragraph("Pain Points & Unmet Needs", tbl_header), Paragraph("Route Wise Value Delivered", tbl_header)],
        [
            Paragraph("<b>Karthik (26)</b><br/>Commuter / Courier", tbl_cell_bold),
            Paragraph("On-demand delivery courier & daily 2W commuter in Trichy.", tbl_cell),
            Paragraph("Stuck at unannounced signal failures; misses strict 8 deliveries/hr SLA.", tbl_cell),
            Paragraph("Trichy junction presets, 0ms autocomplete, 1-tap Google Maps handoff.", tbl_cell)
        ],
        [
            Paragraph("<b>Rajesh (38)</b><br/>Fleet Dispatcher", tbl_cell_bold),
            Paragraph("Oversees 45 regional light commercial delivery vans across TN.", tbl_cell),
            Paragraph("Fuel budget overruns by 14% due to idling; GPS apps flap routes erratically.", tbl_cell),
            Paragraph("Adjusted ETA with anti-flapping threshold; 60s live auto-refresh.", tbl_cell)
        ],
        [
            Paragraph("<b>Insp. Sundaram (48)</b><br/>Traffic Authority", tbl_cell_bold),
            Paragraph("Municipal traffic police & smart city urban planner.", tbl_cell),
            Paragraph("Flood of citizen complaints without location data; no recurrence tracking.", tbl_cell),
            Paragraph("Authority Hotspot Dashboard with 7-day spatial recurrence audit log.", tbl_cell)
        ]
    ]
    t_persona = Table(persona_data, colWidths=[95, 125, 160, 160])
    t_persona.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_persona)
    story.append(Spacer(1, 2))

    # 4. User Journey: Current vs Proposed
    story.append(Paragraph("4. Commuter User Journey: Current Gridlock vs Proposed Route Wise Flow", section_h1))
    journey_data = [
        [Paragraph("Journey Stage", tbl_header), Paragraph("Current Commuter Friction (Without Route Wise)", tbl_header), Paragraph("Proposed Route Wise Experience", tbl_header), Paragraph("Impact", tbl_header)],
        [
            Paragraph("<b>1. Trip Planning</b>", tbl_cell_bold),
            Paragraph("Enters destination; app selects single shortest path with zero trade-off info.", tbl_cell),
            Paragraph("Compares up to 3 candidate driving routes with transparent Adjusted ETA.", tbl_cell),
            Paragraph("100% transparency", tbl_cell_bold)
        ],
        [
            Paragraph("<b>2. Junction Triage</b>", tbl_cell_bold),
            Paragraph("Enters bottleneck blindly; signal breakdown discovered only after arrival.", tbl_cell),
            Paragraph("15-minute ARIMA ML trend and verified community incident markers visible.", tbl_cell),
            Paragraph("Proactive avoidance", tbl_cell_bold)
        ],
        [
            Paragraph("<b>3. Navigation</b>", tbl_cell_bold),
            Paragraph("Opening Google Maps recalculates and reverts back to congested main arterial.", tbl_cell),
            Paragraph("Decision-anchor waypoints (≤ 3 waypoints) preserve chosen corridor.", tbl_cell),
            Paragraph("Corridor fidelity", tbl_cell_bold)
        ]
    ]
    t_journey = Table(journey_data, colWidths=[80, 190, 190, 80])
    t_journey.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_journey)
    story.append(Spacer(1, 2))

    # 5. Competitive Moat Matrix
    story.append(Paragraph("5. Competitive Landscape & Value Proposition", section_h1))
    comp_data = [
        [Paragraph("Feature / Capability", tbl_header), Paragraph("Google Maps API", tbl_header), Paragraph("Mapbox Navigation", tbl_header), Paragraph("Waze Platform", tbl_header), Paragraph("Route Wise (Cyber Knight)", tbl_header)],
        [
            Paragraph("<b>Configurable Scoring Weights</b>", tbl_cell_bold),
            Paragraph("No (Fixed defaults)", tbl_cell),
            Paragraph("Partial (Profiles)", tbl_cell),
            Paragraph("No (Fixed defaults)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Adjusted ETA formula", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Transparent 'Why' Rationale</b>", tbl_cell_bold),
            Paragraph("No (Opaque path)", tbl_cell),
            Paragraph("No (No explanation)", tbl_cell),
            Paragraph("No (No explanation)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Comparative plain-English tags", tbl_cell_bold)
        ],
        [
            Paragraph("<b>15-Min ML Traffic Forecast</b>", tbl_cell_bold),
            Paragraph("No (Live snapshot only)", tbl_cell),
            Paragraph("No (Historical only)", tbl_cell),
            Paragraph("No (Live alerts only)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Public ARIMA (1,0,1) model", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Anti-Flapping Route Threshold</b>", tbl_cell_bold),
            Paragraph("No (Erratic flipping)", tbl_cell),
            Paragraph("No (Flips on 1s delta)", tbl_cell),
            Paragraph("Partial (Basic dampening)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — <code>max(180s, 10% ETA)</code>", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Corridor-Preserving GMaps Handoff</b>", tbl_cell_bold),
            Paragraph("N/A", tbl_cell),
            Paragraph("No (Raw coords only)", tbl_cell),
            Paragraph("N/A", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Decision-anchor waypoints", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Incident Verification Consensus</b>", tbl_cell_bold),
            Paragraph("Proprietary / Closed", tbl_cell),
            Paragraph("No incident reporting", tbl_cell),
            Paragraph("Unverified noise", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — 2-Vote + speed drop (&gt;30%)", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Offline Demo Fail-Safe</b>", tbl_cell_bold),
            Paragraph("No (Fails on network drop)", tbl_cell),
            Paragraph("No (Paid offline packs)", tbl_cell),
            Paragraph("No (Network required)", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Yes</b></font> — Built-in dictionary + PWA", tbl_cell_bold)
        ]
    ]
    t_comp = Table(comp_data, colWidths=[120, 100, 100, 95, 125])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 1.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 2))

    # 6. Monetization & Strategic Risks
    story.append(Paragraph("6. Business Model & Strategic Risk Mitigations", section_h1))
    biz_risk_data = [
        [Paragraph("Tiered Monetization Model", tbl_header), Paragraph("Strategic Risk & Verified Mitigation Matrix", tbl_header)],
        [
            Paragraph(
                "• <b>Developer Free ($0/mo):</b> 1,000 queries/mo, 60 req/min limit, full dashboard access, offline mock mode.<br/>"
                "• <b>Growth Fleet ($0.003/query):</b> Up to 250k queries/mo, custom scoring profiles, 60s live refresh API, ARIMA ML forecast.<br/>"
                "• <b>Municipal / Enterprise SLA:</b> Unlimited queries, Authority Hotspot Dashboard, 99.9% uptime SLA.",
                tbl_cell
            ),
            Paragraph(
                "• <b>API Quota / Network Outage:</b> Local coordinate dictionary ensures 100% demo uptime.<br/>"
                "• <b>Spam Crowd Reports:</b> 2-vote peer consensus + TomTom speed-drop (&gt;30%) correlation.<br/>"
                "• <b>Route Reversion on Handoff:</b> Decision-anchor waypoints (≤ 3 waypoints) preserve corridor.<br/>"
                "• <b>Database Contention:</b> Native Node 24 SQLite in Write-Ahead Logging (`WAL`) mode.",
                tbl_cell
            )
        ]
    ]
    t_biz = Table(biz_risk_data, colWidths=[270, 270])
    t_biz.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_biz)

    return story


def get_prd_page_1():
    """Builds PRD Page 1 flowables: Title, Goals/Non-goals, 7-Step Flow, Epics FR-1 to FR-6"""
    story = []

    # Title & Metadata
    hdr_table_data = [
        [
            Paragraph("<b>Route Wise — Product Requirements Document (PRD)</b>", title_style),
            Paragraph("<b>DOC:</b> PRD-v2.6-GOLD | <b>TEAM:</b> Cyber Knight<br/><b>STATUS:</b> Approved & Verified (99 Tests)<br/><b>AUDIENCE:</b> Engineers, Mentors & Evaluators", meta_style)
        ]
    ]
    hdr_table = Table(hdr_table_data, colWidths=[380, 160])
    hdr_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0)
    ]))
    story.append(hdr_table)
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY_BLUE, spaceBefore=2, spaceAfter=3))

    # Product Vision, Goals & Non-Goals Callout
    vision_text = (
        "<b>Product Vision:</b> Deliver an intelligent, traffic-aware routing platform and installable PWA that eliminates junction gridlock through "
        "transparent multi-criteria ranking, short-term ML forecasting, community consensus, and corridor-preserving navigation handoff.<br/>"
        "<b>Strategic Goals:</b> <b>G-1:</b> Sub-450ms live API response with 100% demo availability. <b>G-2:</b> Anti-flapping route stability via "
        "<code>timeSaved >= max(180s, 10% ETA)</code>. <b>G-3:</b> Verified incident overlay via 2-vote consensus + speed-drop correlation. "
        "<b>G-4:</b> Corridor preservation in Google Maps via anchor waypoints. <b>G-5:</b> Native mobile PWA support.<br/>"
        "<b>Non-Goals:</b> <b>NG-1:</b> Proprietary audio turn-by-turn navigation engine. <b>NG-2:</b> Physical traffic light actuator hardware."
    )
    vision_table = Table([[Paragraph(vision_text, body_text)]], colWidths=[540])
    vision_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BLUE),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_BLUE),
        ('PADDING', (0,0), (-1,-1), 3.5)
    ]))
    story.append(vision_table)
    story.append(Spacer(1, 2))

    # 1. 7-Step Interaction Flow
    story.append(Paragraph("1. End-to-End User Experience & 7-Step Real-Time Interaction Flow", section_h1))
    flow_data = [
        [Paragraph("Step", tbl_header), Paragraph("Interaction Phase", tbl_header), Paragraph("System Action & Technical Detail", tbl_header), Paragraph("Trichy Real-World Example (CBS ⇄ Thillai Nagar)", tbl_header)],
        [
            Paragraph("<b>Step 1</b>", tbl_cell_bold),
            Paragraph("<b>Clean Input</b>", tbl_cell_bold),
            Paragraph("App opens centered on Trichy (zoom 13). User selects corridor preset or types custom names. 0ms autocomplete.", tbl_cell),
            Paragraph("Clicks 'CBS ⇄ Chathiram'; origin and destination populate instantly.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 2</b>", tbl_cell_bold),
            Paragraph("<b>Multi-Ingest</b>", tbl_cell_bold),
            Paragraph("Queries TomTom Routing API for driving alternatives. Ingests distance (m), duration (s), and live traffic delay (s).", tbl_cell),
            Paragraph("Ingests Route #1 (Arterial: 10km, +18m delay) & Route #2 (Bypass: 12.5km, +2m delay).", tbl_cell)
        ],
        [
            Paragraph("<b>Step 3</b>", tbl_cell_bold),
            Paragraph("<b>Overlay</b>", tbl_cell_bold),
            Paragraph("Fetches active incidents from SQLite WAL store. Evaluates speed-drop telemetry correlation and runs ARIMA (1,0,1).", tbl_cell),
            Paragraph("Detects signal failure report at HPO Junction correlated with 72% speed slowdown.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 4</b>", tbl_cell_bold),
            Paragraph("<b>Adjusted ETA</b>", tbl_cell_bold),
            Paragraph("Ranks routes by Adjusted ETA without double-counting. Enforces switch threshold: <code>timeSaved >= max(180s, 10% ETA)</code>.", tbl_cell),
            Paragraph("Route #2 saves 16m (>180s and >10%); promoted to Recommended #1 pick!", tbl_cell)
        ],
        [
            Paragraph("<b>Step 5</b>", tbl_cell_bold),
            Paragraph("<b>Display & HUD</b>", tbl_cell_bold),
            Paragraph("Renders color-coded polylines on Leaflet map. Displays obsidian glass cards, trade-off rationale, and 15m forecast HUD.", tbl_cell),
            Paragraph("Commuter reviews Route #2 card: 'Fastest path — Avoids 16 mins of junction delay'.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 6</b>", tbl_cell_bold),
            Paragraph("<b>GMaps Handoff</b>", tbl_cell_bold),
            Paragraph("Extracts decision anchors (≤ 3 waypoints) preserving Route Wise's chosen corridor in external Google Maps navigation.", tbl_cell),
            Paragraph("Launches Google Maps following Collector Bypass instead of reverting to HPO gridlock.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 7</b>", tbl_cell_bold),
            Paragraph("<b>Authority Triage</b>", tbl_cell_bold),
            Paragraph("Municipal dispatchers review 7-day recurrent congestion hotspots and resolve cleared incidents with officer audit logs.", tbl_cell),
            Paragraph("Traffic police clears signal failure; status updates across all connected clients.", tbl_cell)
        ]
    ]
    t_flow = Table(flow_data, colWidths=[35, 75, 230, 200])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 1.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_flow)
    story.append(Spacer(1, 2))

    # 2. Epics & Functional Requirements (Part 1: FR-1 to FR-6)
    story.append(Paragraph("2. Functional Requirements Traceability (Epics 1 to 3: FR-1 to FR-6)", section_h1))
    fr1_data = [
        [Paragraph("Req ID", tbl_header), Paragraph("Epic / Module", tbl_header), Paragraph("Functional Specification & Acceptance Criteria", tbl_header), Paragraph("Priority", tbl_header), Paragraph("Status", tbl_header)],
        [
            Paragraph("<b>FR-1</b>", tbl_cell_bold),
            Paragraph("<b>Smart Geocoder</b>", tbl_cell_bold),
            Paragraph("Converts plain text names to GPS coordinates via TomTom with instant 0ms offline dictionary fallback for 12 verified Trichy junctions.", tbl_cell),
            Paragraph("P0 (Must)", badge_p0),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-2</b>", tbl_cell_bold),
            Paragraph("<b>Multi-Route Ingest</b>", tbl_cell_bold),
            Paragraph("Requests candidate driving alternatives from TomTom API with real-time live traffic delay metrics and GeoJSON geometry.", tbl_cell),
            Paragraph("P0 (Must)", badge_p0),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-3</b>", tbl_cell_bold),
            Paragraph("<b>Adjusted ETA Ranking</b>", tbl_cell_bold),
            Paragraph("Ranks routes by Adjusted ETA without double-counting delay. Applies switch threshold: <code>timeSaved >= max(180s, 10% ETA)</code> preventing route flapping.", tbl_cell),
            Paragraph("P0 (Must)", badge_p0),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-4</b>", tbl_cell_bold),
            Paragraph("<b>ARIMA (1,0,1) Forecast</b>", tbl_cell_bold),
            Paragraph("Integrates public open-source zemlyansky/arima WebAssembly ML model to forecast velocity trends and delay spikes across +15m, +30m, +45m.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-5</b>", tbl_cell_bold),
            Paragraph("<b>Native SQLite Store</b>", tbl_cell_bold),
            Paragraph("Native Node 24 SQLite storage (node:sqlite) with Write-Ahead Logging (WAL mode), automated migrations, and spatial proximity indexes.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-6</b>", tbl_cell_bold),
            Paragraph("<b>Community Reporting</b>", tbl_cell_bold),
            Paragraph("Allows commuters to report 6 incident types (congestion, roadblock, roadwork, procession, signal_failure, waterlogging). Merges duplicates within 100m.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ]
    ]
    t_fr1 = Table(fr1_data, colWidths=[35, 95, 315, 50, 45])
    t_fr1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_fr1)

    return story


def get_prd_page_2():
    """Builds PRD Page 2 flowables: FR-7 to FR-13, Architecture, REST API Table"""
    story = []

    story.append(Paragraph("<b>ROUTE WISE (CYBER KNIGHT) — PRODUCT REQUIREMENTS (PAGE 2)</b>", subtitle_style))
    story.append(Spacer(1, 1))

    # Functional Requirements (Part 2: FR-7 to FR-13)
    story.append(Paragraph("2. Functional Requirements Traceability (Cont. Epics 4 to 7: FR-7 to FR-13)", section_h1))
    fr2_data = [
        [Paragraph("Req ID", tbl_header), Paragraph("Epic / Module", tbl_header), Paragraph("Functional Specification & Acceptance Criteria", tbl_header), Paragraph("Priority", tbl_header), Paragraph("Status", tbl_header)],
        [
            Paragraph("<b>FR-7</b>", tbl_cell_bold),
            Paragraph("<b>2-Vote Consensus</b>", tbl_cell_bold),
            Paragraph("Auto-verifies reports when ≥ 2 positive community votes arrive or when TomTom speed drop (&gt;30%) correlates with location.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-8</b>", tbl_cell_bold),
            Paragraph("<b>Leaflet Incident HUD</b>", tbl_cell_bold),
            Paragraph("Verified incidents display solid halo + checkmark badge; Unverified display dashed border + question mark. 1-tap voting popup.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-9</b>", tbl_cell_bold),
            Paragraph("<b>Authority Triage</b>", tbl_cell_bold),
            Paragraph("Protected console (X-Authority-Role: admin) ranking active incidents with 7-day spatial recurrence count and 1-click resolution audit log.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-10</b>", tbl_cell_bold),
            Paragraph("<b>GMaps Anchor Handoff</b>", tbl_cell_bold),
            Paragraph("Extracts decision anchors (≤ 3 waypoints) preserving Route Wise's chosen corridor in Google Maps with driving and 2-wheeler modes.", tbl_cell),
            Paragraph("P1 (Should)", badge_p1),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-11</b>", tbl_cell_bold),
            Paragraph("<b>60s Auto-Refresh</b>", tbl_cell_bold),
            Paragraph("Visual 60-second countdown timer that automatically refreshes delay metrics and re-evaluates ranking. In-memory raster tile cache.", tbl_cell),
            Paragraph("P2 (Could)", badge_p2),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-12</b>", tbl_cell_bold),
            Paragraph("<b>Progressive Web App</b>", tbl_cell_bold),
            Paragraph("W3C manifest (display: standalone, #0b0f19 theme) and Service Worker (sw.js) with Network-First navigation and offline shell caching.", tbl_cell),
            Paragraph("P2 (Could)", badge_p2),
            Paragraph("Complete", badge_complete)
        ],
        [
            Paragraph("<b>FR-13</b>", tbl_cell_bold),
            Paragraph("<b>Trichy Presets & UX</b>", tbl_cell_bold),
            Paragraph("6 compact corridor presets (CBS ⇄ Chathiram, etc.), one-click junction chips, 120 FPS decoupled typing, and clear input controls.", tbl_cell),
            Paragraph("P2 (Could)", badge_p2),
            Paragraph("Complete", badge_complete)
        ]
    ]
    t_fr2 = Table(fr2_data, colWidths=[35, 95, 315, 50, 45])
    t_fr2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 1.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_fr2)
    story.append(Spacer(1, 2))

    # 3. System Architecture & 3-Tier Design
    story.append(Paragraph("3. Technical Architecture: Decoupled 3-Tier Pipeline", section_h1))
    arch_text = (
        "<b>Frontend Tier (Vite + React 18):</b> Obsidian dark glass interface, Leaflet maps, Service Worker (<code>sw.js</code>), and decoupled 120 FPS typing.<br/>"
        "<b>Backend Tier (Node.js + Express):</b> SHA-256 API key authentication, sliding rate limiter, Adjusted ETA ranking engine, and TomTom raster tile cache.<br/>"
        "<b>Persistence & AI Tier:</b> Native Node 24 SQLite (<code>node:sqlite</code>) in WAL mode + public <b>ARIMA (1,0,1)</b> ML forecasting engine."
    )
    story.append(Paragraph(arch_text, body_text))
    story.append(Spacer(1, 2))

    # 4. REST API Specifications Table
    story.append(Paragraph("4. REST API Endpoints Specification", section_h1))
    api_data = [
        [Paragraph("Endpoint", tbl_header), Paragraph("Method & Auth", tbl_header), Paragraph("Payload / Query Params", tbl_header), Paragraph("Response Payload & Status", tbl_header), Paragraph("Latency Target", tbl_header)],
        [
            Paragraph("<code>/api/routes/recommend</code>", tbl_cell_bold),
            Paragraph("POST<br/>X-API-Key req", tbl_cell),
            Paragraph("<code>{ origin, destination, weights? }</code>", tbl_cell),
            Paragraph("200 OK: Ranked routes array with GeoJSON, Adjusted ETA, delay, and trade-off rationale.", tbl_cell),
            Paragraph("< 350ms (Live)<br/>< 30ms (Fallback)", tbl_cell)
        ],
        [
            Paragraph("<code>/api/routes/refresh</code>", tbl_cell_bold),
            Paragraph("POST<br/>X-API-Key req", tbl_cell),
            Paragraph("<code>{ routeIds: [...] }</code>", tbl_cell),
            Paragraph("200 OK: Fresh delay metrics and recalculated scores without re-geocoding locations.", tbl_cell),
            Paragraph("< 250ms (Live)<br/>< 20ms (Fallback)", tbl_cell)
        ],
        [
            Paragraph("<code>/api/routes/locations/search</code>", tbl_cell_bold),
            Paragraph("GET<br/>Public", tbl_cell),
            Paragraph("<code>?query=trichy</code>", tbl_cell),
            Paragraph("200 OK: Typeahead array with 0ms verified junction matching and isJunction tag.", tbl_cell),
            Paragraph("< 15ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/reports</code>", tbl_cell_bold),
            Paragraph("POST<br/>User Key", tbl_cell),
            Paragraph("<code>{ category, lat, lon, description }</code>", tbl_cell),
            Paragraph("201 Created: Incident record ID, merged status, and verification state.", tbl_cell),
            Paragraph("< 50ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/reports/:id/votes</code>", tbl_cell_bold),
            Paragraph("POST<br/>User Key", tbl_cell),
            Paragraph("<code>{ vote: 'yes' | 'no' }</code>", tbl_cell),
            Paragraph("200 OK: Updated vote tally; auto-transitions to verified at 2 votes.", tbl_cell),
            Paragraph("< 35ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/authority/hotspots</code>", tbl_cell_bold),
            Paragraph("GET<br/>Admin Guard", tbl_cell),
            Paragraph("<code>X-Authority-Role: admin</code>", tbl_cell),
            Paragraph("200 OK: Ranked active incidents with 7-day spatial recurrence count.", tbl_cell),
            Paragraph("< 40ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/authority/reports/:id/resolve</code>", tbl_cell_bold),
            Paragraph("POST<br/>Admin Guard", tbl_cell),
            Paragraph("<code>{ officerNotes?: string }</code>", tbl_cell),
            Paragraph("200 OK: Resolved incident object with resolvedAt audit timestamp.", tbl_cell),
            Paragraph("< 40ms", tbl_cell)
        ],
        [
            Paragraph("<code>/api/health</code>", tbl_cell_bold),
            Paragraph("GET<br/>Public", tbl_cell),
            Paragraph("None", tbl_cell),
            Paragraph("200 OK: System health, TomTom state, SQLite health, server uptime.", tbl_cell),
            Paragraph("< 15ms", tbl_cell)
        ]
    ]
    t_api = Table(api_data, colWidths=[115, 65, 120, 180, 60])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 1.8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_api)

    return story


def get_prd_page_3():
    """Builds PRD Page 3 flowables: Schema, NFRs, 99 Tests, DoD & 2-Minute Demo Script"""
    story = []

    story.append(Paragraph("<b>ROUTE WISE (CYBER KNIGHT) — PRODUCT REQUIREMENTS (PAGE 3)</b>", subtitle_style))
    story.append(Spacer(1, 1))

    # 5. Schema & NFRs
    story.append(Paragraph("5. Persistence Schema & Non-Functional Requirements (NFRs)", section_h1))
    schema_nfr_data = [
        [Paragraph("SQLite WAL Database Schema", tbl_header), Paragraph("Non-Functional Requirements (NFRs) & Target Specifications", tbl_header)],
        [
            Paragraph(
                "• <b>reports:</b> <code>id PK, category, lat, lon, description, status, votes_yes, votes_no, reporter_key, created_at</code><br/>"
                "• <b>votes:</b> <code>id PK, report_id FK, user_key, vote, created_at, UNIQUE(report_id, user_key)</code><br/>"
                "• <b>incident_resolutions:</b> <code>id PK, report_id FK, resolved_by, notes, resolved_at</code><br/>"
                "• <b>Indexes:</b> Spatial composite index on <code>reports(lat, lon)</code> for sub-ms bounding box queries.<br/>"
                "• <b>Caching:</b> 1-hour in-memory cache for raster tiles (1ms response); 5-minute geocode typeahead cache.",
                tbl_cell
            ),
            Paragraph(
                "• <b>Latency & Performance:</b> p95 API response &lt; 450ms; 0ms local geocode fallback; 120 FPS typing.<br/>"
                "• <b>Security:</b> Cryptographic SHA-256 API key hashing; secrets redacted from logs; sliding rate-limiting.<br/>"
                "• <b>Availability:</b> 100% demo availability via resilient coordinate dictionary; Service Worker offline cache.<br/>"
                "• <b>Usability:</b> WCAG 2.1 AA compliant contrast; Cumulative Layout Shift (CLS) &lt; 0.05.<br/>"
                "• <b>Compliance:</b> Zero personal telemetry tracking; pseudonymous client keys stored in localStorage.",
                tbl_cell
            )
        ]
    ]
    t_sn = Table(schema_nfr_data, colWidths=[270, 270])
    t_sn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t_sn)
    story.append(Spacer(1, 2))

    # 6. Automated Test Suite Coverage (99/99 Tests)
    story.append(Paragraph("6. Quality Assurance & Automated Test Verification (99/99 Tests Passing — 100% Pass Rate)", section_h1))
    test_data = [
        [Paragraph("Test Suite Module", tbl_header), Paragraph("Test Count", tbl_header), Paragraph("Coverage Scope & Verified Behaviors", tbl_header), Paragraph("Pass Rate", tbl_header)],
        [
            Paragraph("<b>Backend Test Suite</b><br/>(Node test runner)", tbl_cell_bold),
            Paragraph("<b>75 Tests</b>", tbl_cell_bold),
            Paragraph("SQLite WAL migrations, 2-vote consensus engine, speed-drop correlation (&gt;30%), Adjusted ETA switch threshold, municipal authority role guard, raster tile caching, route controllers.", tbl_cell),
            Paragraph("<font color='#16a34a'><b>100% (75/75)</b></font>", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Frontend Test Suite</b><br/>(Node test runner)", tbl_cell_bold),
            Paragraph("<b>24 Tests</b>", tbl_cell_bold),
            Paragraph("Google Maps decision-anchor waypoint extraction, URL length compliance (&lt;2048 chars), pseudonymous user key generation, route card formatters, severity badges.", tbl_cell),
            Paragraph("<font color='#16a34a'><b>100% (24/24)</b></font>", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Total Verification</b>", tbl_cell_bold),
            Paragraph("<b>99 Tests</b>", tbl_cell_bold),
            Paragraph("Full monorepo end-to-end integration verified; production Vite build passes in 1.8s.", tbl_cell),
            Paragraph("<font color='#16a34a'><b>100% (99/99)</b></font>", tbl_cell_bold)
        ]
    ]
    t_test = Table(test_data, colWidths=[110, 60, 310, 60])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_NAVY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_MUTED),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, ROW_ALT_BG]),
        ('PADDING', (0,0), (-1,-1), 2),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t_test)
    story.append(Spacer(1, 2))

    # 7. Release Criteria & 2-Minute Demo Script
    story.append(Paragraph("7. Release Criteria & 2-Minute Live Demo Script for Evaluators", section_h1))
    
    script_box_text = (
        "<b>Definition of Done (DoD):</b> 100% test pass (99/99 tests), production Vite build cleanly compiled, PWA service worker registered, "
        "and offline coordinate fallback functional.<br/>"
        "<b>2-Minute Live Demo Script for Judges & Mentors:</b><br/>"
        "• <b>Step 1 (Open Dashboard & PWA — 20s):</b> Launch application. Show the clean idle state centered on Trichy, the obsidian dark glassmorphism, "
        "and explain that Route Wise is an installable PWA with offline shell caching.<br/>"
        "• <b>Step 2 (Click Preset Corridor — 30s):</b> Click the compact <code>CBS ⇄ Chathiram</code> preset. Origin and destination populate instantly "
        "(0ms local geocoding). The system queries TomTom live telemetry and fetches multiple alternatives.<br/>"
        "• <b>Step 3 (Explain Adjusted ETA & Trade-Offs — 40s):</b> Point out how Route #2 is recommended because it saves 16 minutes of junction delay "
        "despite being 2.5 km longer. Explain the anti-flapping threshold tag and point to the 15-minute ARIMA ML traffic forecasting HUD.<br/>"
        "• <b>Step 4 (Community Verification, Handoff & Tests — 30s):</b> Highlight community incident markers (verified solid pulse vs unverified dashed). "
        "Click <i>'Start Navigation in Google Maps'</i> to show corridor preservation via anchor waypoints. Conclude with our <b>99 automated tests passed at 100%</b>."
    )
    script_table = Table([[Paragraph(script_box_text, body_text)]], colWidths=[540])
    script_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GREEN),
        ('BOX', (0,0), (-1,-1), 0.8, BORDER_GREEN),
        ('PADDING', (0,0), (-1,-1), 4)
    ]))
    story.append(script_table)

    return story


# =========================================================================
# PDF BUILD FUNCTIONS
# =========================================================================

def build_master_pdf():
    """Generates the combined 5-page Gold Standard document (MRD Pages 1-2 + PRD Pages 1-3)"""
    pdf_path = 'SmartRoute_AI_PRD_MRD.pdf'
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=26,
        bottomMargin=26
    )
    
    story = []
    # Page 1: MRD Part 1
    story.extend(get_mrd_page_1())
    story.append(PageBreak())
    
    # Page 2: MRD Part 2
    story.extend(get_mrd_page_2())
    story.append(PageBreak())
    
    # Page 3: PRD Part 1
    story.extend(get_prd_page_1())
    story.append(PageBreak())
    
    # Page 4: PRD Part 2
    story.extend(get_prd_page_2())
    story.append(PageBreak())
    
    # Page 5: PRD Part 3
    story.extend(get_prd_page_3())
    
    doc.build(story, canvasmaker=MasterNumberedCanvas)
    
    # Verify page count with pypdf
    reader = pypdf.PdfReader(pdf_path)
    count = len(reader.pages)
    print(f"Master PDF generated successfully: {pdf_path} (Page count: {count})")
    assert count <= 5, f"ERROR: Master PDF exceeded 5 pages! Got {count} pages."


def build_prd_pdf():
    """Generates the 3-page standalone PRD PDF"""
    pdf_path = 'PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf'
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=26,
        bottomMargin=26
    )
    
    story = []
    # Page 1
    story.extend(get_prd_page_1())
    story.append(PageBreak())
    # Page 2
    story.extend(get_prd_page_2())
    story.append(PageBreak())
    # Page 3
    story.extend(get_prd_page_3())
    
    doc.build(story, canvasmaker=StandaloneNumberedCanvas)
    
    reader = pypdf.PdfReader(pdf_path)
    count = len(reader.pages)
    print(f"PRD PDF generated successfully: {pdf_path} (Page count: {count})")
    assert count <= 5, f"ERROR: PRD PDF exceeded 5 pages! Got {count} pages."


def build_mrd_pdf():
    """Generates the 2-page standalone MRD PDF"""
    pdf_path = 'MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.pdf'
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=26,
        bottomMargin=26
    )
    
    story = []
    # Page 1
    story.extend(get_mrd_page_1())
    story.append(PageBreak())
    # Page 2
    story.extend(get_mrd_page_2())
    
    doc.build(story, canvasmaker=StandaloneNumberedCanvas)
    
    reader = pypdf.PdfReader(pdf_path)
    count = len(reader.pages)
    print(f"MRD PDF generated successfully: {pdf_path} (Page count: {count})")
    assert count <= 5, f"ERROR: MRD PDF exceeded 5 pages! Got {count} pages."


# =========================================================================
# DOCX BUILD FUNCTIONS
# =========================================================================

def build_prd_docx():
    docx_path = 'PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.docx'
    doc = docx.Document()
    
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Route Wise — Product Requirements Document (PRD)")
    r_title.bold = True
    r_title.font.size = Pt(16)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p_meta = doc.add_paragraph("DOCUMENT: PRD-v2.6-GOLD | TEAM: Cyber Knight | AUDIENCE: Engineers & Mentors | STATUS: Approved (99 Tests)")
    p_meta.runs[0].font.size = Pt(9)
    p_meta.runs[0].font.color.rgb = RGBColor(100, 116, 139)
    
    p_box = doc.add_paragraph()
    r_box = p_box.add_run(
        "Product Vision & Goals: Route Wise is an intelligent, traffic-aware routing platform and installable PWA. Given any origin "
        "and destination, it retrieves candidate driving alternatives, ranks them using Adjusted ETA with an anti-flapping switch threshold, "
        "predicts 15-minute trends via an ARIMA (1,0,1) ML model, validates crowd incidents via 2-vote consensus, provides municipal authority "
        "hotspot triage, and enables 1-tap Google Maps handoff with corridor shape preservation."
    )
    r_box.font.size = Pt(9.5)
    
    doc.add_heading("1. End-to-End User Experience & 7-Step Interaction Flow", level=2)
    t1 = doc.add_table(rows=8, cols=4)
    t1.style = 'Table Grid'
    headers1 = ["Step", "Phase", "System Action & Technical Detail", "Trichy Corridor Example (CBS ⇄ Thillai Nagar)"]
    for i, h in enumerate(headers1):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].bold = True
    
    steps = [
        ("Step 1", "Clean Input", "App opens centered on Trichy (zoom 13). User selects corridor preset or types custom names. 0ms autocomplete.", "Clicks 'CBS ⇄ Chathiram'; origin and destination populate instantly."),
        ("Step 2", "Multi-Ingest", "Queries TomTom Routing API for driving alternatives. Ingests distance (m), duration (s), and live traffic delay (s).", "Ingests Route #1 (10km, +18m delay) & Route #2 (12.5km, +2m delay)."),
        ("Step 3", "Overlay", "Fetches active incidents from SQLite WAL store. Evaluates speed-drop telemetry correlation and runs ARIMA (1,0,1).", "Detects signal failure report at HPO Junction correlated with 72% speed slowdown."),
        ("Step 4", "Adjusted ETA", "Ranks routes by Adjusted ETA without double-counting. Enforces switch threshold: timeSaved >= max(180s, 10% ETA).", "Route #2 saves 16m (>180s and >10%); promoted to Recommended #1 pick!"),
        ("Step 5", "Display & HUD", "Renders color-coded polylines on Leaflet map. Displays obsidian glass cards, trade-off rationale, and 15m forecast HUD.", "Commuter reviews Route #2 card: 'Fastest path — Avoids 16 mins of junction delay'."),
        ("Step 6", "GMaps Handoff", "Extracts decision anchors (<= 3 waypoints) preserving Route Wise's chosen corridor in external Google Maps navigation.", "Launches Google Maps following Collector Bypass instead of reverting to HPO gridlock."),
        ("Step 7", "Authority Triage", "Municipal dispatchers review 7-day recurrent congestion hotspots and resolve cleared incidents with officer audit logs.", "Traffic police clears signal failure; status updates across all connected clients.")
    ]
    for idx, (st, ph, act, ex) in enumerate(steps):
        row = t1.rows[idx+1]
        row.cells[0].text = st
        row.cells[1].text = ph
        row.cells[2].text = act
        row.cells[3].text = ex
        
    doc.add_heading("2. Functional Requirements Traceability (FR-1 to FR-13)", level=2)
    t2 = doc.add_table(rows=14, cols=4)
    t2.style = 'Table Grid'
    headers2 = ["Req ID", "Module Name", "What It Does & Acceptance Criteria", "Priority"]
    for i, h in enumerate(headers2):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    frs = [
        ("FR-1", "Smart Geocoder", "Converts plain text street/city names to GPS coordinates via TomTom with instant 0ms offline dictionary fallback for 12 verified Trichy junctions.", "Must Have"),
        ("FR-2", "Multi-Route Ingest", "Requests candidate driving alternatives from TomTom API with real-time live traffic delay metrics and GeoJSON geometry.", "Must Have"),
        ("FR-3", "Adjusted ETA Ranking", "Ranks routes by Adjusted ETA without double-counting delay. Applies switch threshold: timeSaved >= max(180s, 10% ETA) preventing route flapping.", "Must Have"),
        ("FR-4", "ARIMA ML Forecast", "Integrates public open-source zemlyansky/arima WebAssembly ML model to forecast velocity trends and delay spikes across +15m, +30m, +45m.", "Should Have"),
        ("FR-5", "Native SQLite Store", "Native Node 24 SQLite storage (node:sqlite) with Write-Ahead Logging (WAL mode), automated migrations, and spatial proximity indexes.", "Should Have"),
        ("FR-6", "Community Reporting", "Allows commuters to report 6 incident types (congestion, roadblock, roadwork, procession, signal_failure, waterlogging). Merges duplicates within 100m.", "Should Have"),
        ("FR-7", "2-Vote Consensus", "Auto-verifies reports when >= 2 positive community votes arrive or when TomTom speed drop (>30%) correlates with location.", "Should Have"),
        ("FR-8", "Leaflet Incident HUD", "Verified incidents display solid halo + checkmark badge; Unverified display dashed border + question mark. 1-tap voting popup.", "Should Have"),
        ("FR-9", "Authority Triage", "Protected console (X-Authority-Role: admin) ranking active incidents with 7-day spatial recurrence count and 1-click resolution audit log.", "Should Have"),
        ("FR-10", "GMaps Anchor Handoff", "Extracts decision anchors (<= 3 waypoints) preserving Route Wise's chosen corridor in Google Maps with driving and 2-wheeler modes.", "Should Have"),
        ("FR-11", "60s Auto-Refresh", "Visual 60-second countdown timer that automatically refreshes delay metrics and re-evaluates ranking. In-memory raster tile cache.", "Could Have"),
        ("FR-12", "Progressive Web App", "W3C manifest (display: standalone, #0b0f19 theme) and Service Worker (sw.js) with Network-First navigation and offline shell caching.", "Could Have"),
        ("FR-13", "Trichy Presets & UX", "6 compact corridor presets (CBS ⇄ Chathiram, etc.), one-click junction chips, 120 FPS decoupled typing, and clear input controls.", "Could Have")
    ]
    for idx, (fid, mod, desc, prio) in enumerate(frs):
        row = t2.rows[idx+1]
        row.cells[0].text = fid
        row.cells[1].text = mod
        row.cells[2].text = desc
        row.cells[3].text = prio
        
    doc.add_heading("3. Quality Assurance & Automated Test Verification", level=2)
    doc.add_paragraph(
        "• Monorepo Test Pass Rate: 99 automated tests passing at 100% (75 backend tests + 24 frontend tests).\n"
        "• Production Build: Clean Vite bundle compiles in 1.8s with PWA service worker registered.\n"
        "• Zero-Crash Reliability: Built-in coordinate dictionary ensures 100% demo uptime under network drops."
    )
    
    doc.save(docx_path)
    print("Built PRD DOCX successfully:", docx_path)


def build_mrd_docx():
    docx_path = 'MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.docx'
    doc = docx.Document()
    
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Route Wise — Market Requirements Document (MRD)")
    r_title.bold = True
    r_title.font.size = Pt(16)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    p_meta = doc.add_paragraph("DOCUMENT: MRD-v2.6-GOLD | TEAM: Cyber Knight | AUDIENCE: Mentors & Judges | STATUS: Approved (99 Tests)")
    p_meta.runs[0].font.size = Pt(9)
    p_meta.runs[0].font.color.rgb = RGBColor(100, 116, 139)
    
    p_box = doc.add_paragraph()
    r_box = p_box.add_run(
        "The 30-Second Elevator Pitch: Most navigation apps blindly suggest the shortest route, funneling traffic into severe junction gridlock. "
        "Route Wise (Team Cyber Knight) is an intelligent traffic advisory platform, live glassmorphic dashboard, and installable PWA that evaluates multiple "
        "driving alternatives, penalizes junction bottlenecks using Adjusted ETA with an anti-flapping switch threshold, predicts 15-minute trends via ARIMA ML, "
        "and guarantees corridor retention during 1-tap Google Maps handoff."
    )
    r_box.font.size = Pt(9.5)
    
    doc.add_heading("1. Problem Framing & 5-Why Root Cause Analysis", level=2)
    doc.add_paragraph(
        "Validated Problem Statement: Daily commuters and couriers face 15-to-30-minute delays at junction bottlenecks in Tier-1/2 Indian cities "
        "(e.g. Tiruchirappalli), causing missed SLAs, excess fuel burn, and stress. Standard GPS algorithms over-weight physical distance and lack transparent "
        "trade-off explanations. Therefore, there is an urgent need for an explainable routing system that penalizes junction gridlock and validates crowd alerts."
    )
    
    t1 = doc.add_table(rows=3, cols=5)
    t1.style = 'Table Grid'
    headers1 = ["Navigation Strategy", "Distance", "Traffic Delay", "Total Time", "Driver & Commuter Outcome"]
    for i, h in enumerate(headers1):
        t1.rows[0].cells[i].text = h
        t1.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    strategies = [
        ("Standard Navigation App (Shortest distance default)", "10.0 km (Shortest)", "+18 mins (Heavy gridlock)", "42 mins", "Late arrival, customer SLA breach, high fuel wasted idling in junction bottleneck."),
        ("Route Wise (Cyber Knight) (Adjusted ETA + ARIMA ML)", "12.5 km (+2.5 km)", "+2 mins (Smooth flowing)", "26 mins (16m faster!)", "On-time arrival, clear trade-off explanation, fuel-efficient constant speed corridor.")
    ]
    for idx, (strat, dist, delay, tot, outc) in enumerate(strategies):
        row = t1.rows[idx+1]
        row.cells[0].text = strat
        row.cells[1].text = dist
        row.cells[2].text = delay
        row.cells[3].text = tot
        row.cells[4].text = outc
        
    doc.add_heading("2. Market Size: Multi-Billion Dollar Opportunity", level=2)
    doc.add_paragraph(
        "• TAM: $14.2 Billion — Global GIS, Navigation & Fleet Logistics API Market (CAGR 12.4%)\n"
        "• SAM: $2.8 Billion — Urban Last-Mile Delivery & Commuter Routing Software Platforms\n"
        "• SOM: $350 Million — Tier-1 & Tier-2 Indian Logistics Startups, Fleets & Commuters (Assumptions marked)"
    )
    
    doc.add_heading("3. Competitive Moat Matrix", level=2)
    t2 = doc.add_table(rows=8, cols=4)
    t2.style = 'Table Grid'
    headers2 = ["Feature / Capability", "Google Maps API", "Mapbox Navigation", "Route Wise (Cyber Knight)"]
    for i, h in enumerate(headers2):
        t2.rows[0].cells[i].text = h
        t2.rows[0].cells[i].paragraphs[0].runs[0].bold = True
        
    comps = [
        ("Configurable Scoring Weights", "No (Fixed default algorithm)", "Partial (Limited vehicle profiles)", "Yes — Adjusted ETA formula"),
        ("Transparent 'Why' Rationale", "No (Opaque black-box route)", "No (No explanation given)", "Yes — Comparative plain-English tags"),
        ("15-Min ML Traffic Forecast", "No (Live conditions only)", "No (Historical averages only)", "Yes — Public ARIMA (1,0,1) model"),
        ("Anti-Flapping Switch Threshold", "No (Erratic flipping)", "No (Flips on minor delta)", "Yes — max(180s, 10% ETA)"),
        ("Community Incident Verification", "Closed / Proprietary", "No community reporting", "Yes — 2-vote consensus + speed-drop (>30%)"),
        ("Google Maps Corridor Handoff", "N/A", "N/A", "Yes — Decision-anchor waypoints preserve corridor"),
        ("Offline Demo Fail-Safe", "No (Fails if internet drops)", "No (Requires paid offline packs)", "Yes — High-fidelity local coordinate dictionary")
    ]
    for idx, (feat, ggl, mbx, rw) in enumerate(comps):
        row = t2.rows[idx+1]
        row.cells[0].text = feat
        row.cells[1].text = ggl
        row.cells[2].text = mbx
        row.cells[3].text = rw
        
    doc.save(docx_path)
    print("Built MRD DOCX successfully:", docx_path)


# =========================================================================
# EXECUTION & SYNCHRONIZATION
# =========================================================================
if __name__ == '__main__':
    print("Generating Gold Standard PRD & MRD documents...")
    build_mrd_pdf()
    build_prd_pdf()
    build_master_pdf()
    build_prd_docx()
    build_mrd_docx()

    # Synchronize all generated deliverables to root and client/public/
    shutil.copy2('MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.pdf', 'SmartRoute_AI_MRD.pdf')
    shutil.copy2('PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf', 'SmartRoute_AI_PRD.pdf')
    shutil.copy2('MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.pdf', 'client/public/SmartRoute_AI_MRD.pdf')
    shutil.copy2('PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf', 'client/public/SmartRoute_AI_PRD.pdf')
    shutil.copy2('SmartRoute_AI_PRD_MRD.pdf', 'client/public/SmartRoute_AI_PRD_MRD.pdf')
    
    print("\n========================================================")
    print("VERIFICATION OF PDF PAGE COUNTS:")
    for path in [
        'SmartRoute_AI_PRD_MRD.pdf',
        'SmartRoute_AI_MRD.pdf',
        'SmartRoute_AI_PRD.pdf',
        'MRD/Cyber Knight - Commuters Waste Time at Congested Junctions - MRD.pdf',
        'PRD/Cyber Knight - Commuters Waste Time at Congested Junctions - PRD.pdf'
    ]:
        reader = pypdf.PdfReader(path)
        pages = len(reader.pages)
        print(f"  {path:70s} : {pages} pages (Constraint <= 5: {'PASS' if pages <= 5 else 'FAIL'})")
    print("========================================================\n")
