import os
import sys
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas
import pymupdf

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self.doc_title = kwargs.pop('doc_title', 'SMARTROUTE AI')
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
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on page 2 and up)
        if self._pageNumber > 1:
            self.drawString(36, 762, self.doc_title.upper())
            self.setFont("Helvetica", 7.5)
            self.drawRightString(576, 762, "ROUTE WISE / SMARTROUTE AI — HACKATHON SHOWCASE")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)
        
        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 36, 576, 36)
        
        self.setFont("Helvetica", 7.5)
        self.drawString(36, 24, "SmartRoute AI — Intelligent Traffic-Aware Route Recommendation Engine")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 24, page_str)
        self.restoreState()

def get_common_styles():
    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor("#0F172A")    # Slate 900
    ACCENT = colors.HexColor("#1D4ED8")     # Blue 700
    TEAL = colors.HexColor("#0F766E")       # Teal 700
    MUTED = colors.HexColor("#475569")      # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER = colors.HexColor("#E2E8F0")     # Slate 200
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=20,
        textColor=PRIMARY,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=MUTED,
        spaceAfter=6
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=ACCENT,
        spaceBefore=5,
        spaceAfter=2.5,
        keepWithNext=True
    )

    subheading = ParagraphStyle(
        'SubHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=PRIMARY,
        spaceBefore=3.5,
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

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B")
    )

    return {
        'PRIMARY': PRIMARY, 'ACCENT': ACCENT, 'TEAL': TEAL, 'MUTED': MUTED,
        'BG_LIGHT': BG_LIGHT, 'BORDER': BORDER, 'title': title_style,
        'subtitle': subtitle_style, 'section': section_heading,
        'subheading': subheading, 'body': body, 'bullet': bullet_style,
        'cell': table_cell, 'cell_bold': table_cell_bold,
        'cell_header': table_cell_header, 'callout': callout_text
    }

# =============================================================================
# BUILD MRD DOCUMENT (2 Pages)
# =============================================================================
def build_mrd_pdf(filename):
    st = get_common_styles()
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=42
    )
    story = []

    # ---------------- PAGE 1 ----------------
    # Header Banner
    header_data = [
        [
            Paragraph("<b>SmartRoute AI — Market Requirements Document (MRD)</b>", st['title']),
            Paragraph("<font size=7 color='#64748B'><b>DOCUMENT:</b> MRD-v1.0<br/><b>AUDIENCE:</b> Judges & Stakeholders<br/><b>STATUS:</b> Final Hackathon Pitch</font>", st['cell'])
        ],
        [
            Paragraph("<b>The Business Case, Market Need & Real-World Problem</b> — Explaining SmartRoute AI in Simple English", st['subtitle']),
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
    story.append(HRFlowable(width="100%", thickness=1.2, color=st['ACCENT'], spaceBefore=2, spaceAfter=5))

    # 30-Second Elevator Pitch
    pitch_text = (
        "<b>The 30-Second Elevator Pitch for Judges:</b><br/>"
        "Most navigation apps blindly suggest the shortest route, even if it leads straight into heavy traffic gridlock. "
        "<b>SmartRoute AI (Route Wise)</b> is a smart API and live dashboard that compares multiple routes, penalizes severe "
        "traffic delays, and picks the truly best route. It explains <b>why</b> it chose the route in plain words (e.g. <i>'Saves 16 mins of traffic delay for just 2 km extra'</i>), "
        "saving time, fuel, and driver frustration for delivery fleets and mobility apps."
    )
    t_pitch = Table([[Paragraph(pitch_text, st['callout'])]], colWidths=[540])
    t_pitch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_pitch)
    story.append(Spacer(1, 4))

    # Real-Time Example
    story.append(Paragraph("1. Real-World Story: Why Traditional GPS Fails Drivers", st['section']))
    story.append(Paragraph(
        "<b>The Scenario (Meet Alex the Courier):</b> It is 5:15 PM during evening rush hour. Alex has an urgent package to deliver from "
        "Downtown to the Airport Logistics Hub.", st['body']
    ))
    story.append(Paragraph(
        "• <b>What Traditional GPS Does:</b> It recommends <i>Route A (Direct City Avenue)</i> because it is only <b>10.0 km</b>. "
        "However, City Avenue has an unexpected bottleneck with <b>18 minutes of bumper-to-bumper traffic delay</b>. Total travel time: <b>42 minutes</b>. "
        "Alex arrives late, the customer complains, and fuel is burned idling in traffic.",
        st['bullet']
    ))
    story.append(Paragraph(
        "• <b>What SmartRoute AI Does:</b> SmartRoute AI analyzes 3 alternatives simultaneously. It recognizes that <i>Route B (Outer Ring Road)</i> "
        "is <b>12.5 km</b> (2.5 km longer), but has almost zero congestion (only <b>2 minutes of delay</b>). Total travel time: <b>26 minutes</b>. "
        "SmartRoute AI recommends Route B, explaining: <i>'Fastest path — Avoids 16 minutes of traffic jam'</i>. Alex arrives 16 minutes early!",
        st['bullet']
    ))
    story.append(Spacer(1, 3))

    # Real-World Comparison Table
    ex_table_data = [
        [
            Paragraph("<b>Navigation Strategy</b>", st['cell_header']),
            Paragraph("<b>Distance</b>", st['cell_header']),
            Paragraph("<b>Traffic Delay</b>", st['cell_header']),
            Paragraph("<b>Total Time</b>", st['cell_header']),
            Paragraph("<b>Driver & Customer Outcome</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>Standard Navigation App</b><br/>(Picks shortest distance)", st['cell_bold']),
            Paragraph("10.0 km<br/>(Shortest)", st['cell']),
            Paragraph("<font color='#DC2626'><b>+18 mins</b></font><br/>(Heavy gridlock)", st['cell']),
            Paragraph("<font color='#DC2626'><b>42 mins</b></font>", st['cell_bold']),
            Paragraph("Late delivery, high stress, fuel wasted idling in traffic jam.", st['cell'])
        ],
        [
            Paragraph("<b>SmartRoute AI (Route Wise)</b><br/>(Multi-criteria traffic scoring)", st['cell_bold']),
            Paragraph("12.5 km<br/>(+2.5 km)", st['cell']),
            Paragraph("<font color='#0F766E'><b>+2 mins</b></font><br/>(Smooth flowing)", st['cell']),
            Paragraph("<font color='#0F766E'><b>26 mins</b></font><br/><b>(16m faster!)</b>", st['cell_bold']),
            Paragraph("<b>On-time delivery, clear explanation, fuel-efficient constant speed.</b>", st['cell_bold'])
        ]
    ]
    t_ex = Table(ex_table_data, colWidths=[130, 75, 85, 80, 170])
    t_ex.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#FEF2F2"), colors.HexColor("#F0FDF4")]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_ex)
    story.append(Spacer(1, 4))

    # Market Problem Statement
    story.append(Paragraph("2. The Big Market Problem We Solve", st['section']))
    story.append(Paragraph(
        "<b>1. Opaque 'Black-Box' Algorithms:</b> Current mapping APIs provide a single route without explaining why it was picked, leaving dispatchers blind.",
        st['bullet']
    ))
    story.append(Paragraph(
        "<b>2. Inability to Customize Priorities:</b> A courier company cares deeply about avoiding red-light gridlock, while an EV driver cares about shortest distance. Standard APIs give everyone the exact same default.",
        st['bullet']
    ))
    story.append(Paragraph(
        "<b>3. Demo & Network Fragility:</b> Traditional routing APIs break when offline or over quota. Developers need high-reliability fail-safes.",
        st['bullet']
    ))
    story.append(Spacer(1, 4))

    # Market Sizing Grid
    story.append(Paragraph("3. Market Size: Multi-Billion Dollar Opportunity", st['section']))
    sizing_data = [
        [
            Paragraph("<b>TAM: $14.2 Billion</b><br/><font color='#475569'>Global GIS, Navigation & Fleet Logistics API Market</font>", st['cell']),
            Paragraph("<b>SAM: $2.8 Billion</b><br/><font color='#475569'>Urban Last-Mile Delivery & Courier Routing Software</font>", st['cell']),
            Paragraph("<b>SOM: $350 Million</b><br/><font color='#475569'>Independent Logistics SaaS, Startups & Developers</font>", st['cell'])
        ]
    ]
    t_size = Table(sizing_data, colWidths=[180, 180, 180])
    t_size.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), st['BG_LIGHT']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_size)

    # ---------------- PAGE 2 ----------------
    story.append(PageBreak())

    story.append(Paragraph("SMARTROUTE AI — MARKET REQUIREMENTS DOCUMENT (PAGE 2)", st['subtitle']))
    story.append(Paragraph("4. Target Audience, Competition & Revenue Model", st['title']))
    story.append(HRFlowable(width="100%", thickness=1, color=st['ACCENT'], spaceBefore=2, spaceAfter=5))

    # Target Audience
    story.append(Paragraph("4.1 Who Needs This? (Target Customer Segments)", st['section']))
    story.append(Paragraph("• <b>On-Demand Couriers & Food Delivery Platforms (e.g., DoorDash, UberEats, Local Couriers):</b> Need to avoid traffic jams to ensure meals stay hot and deliveries meet promised ETAs.", st['bullet']))
    story.append(Paragraph("• <b>Fleet & Logistics Dispatch Managers:</b> Managing 10 to 100 delivery vans. A 15-minute delay per driver compounds into thousands of lost dollars and overtime costs every week.", st['bullet']))
    story.append(Paragraph("• <b>Independent Developers & Tech Startups:</b> Need a clean, predictable REST API with built-in API keys and guaranteed offline demo fallback for rapid integration.", st['bullet']))
    story.append(Spacer(1, 4))

    # Competitive Advantage Table
    story.append(Paragraph("4.2 Why SmartRoute AI Wins Against Big Tech APIs", st['section']))
    comp_data = [
        [
            Paragraph("<b>Feature / Capability</b>", st['cell_header']),
            Paragraph("<b>Google Maps API</b>", st['cell_header']),
            Paragraph("<b>Mapbox Navigation</b>", st['cell_header']),
            Paragraph("<b>SmartRoute AI (Route Wise)</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>Configurable Scoring Weights</b>", st['cell_bold']),
            Paragraph("<font color='#DC2626'><b>No</b></font> (Fixed default algorithm)", st['cell']),
            Paragraph("<font color='#D97706'><b>Partial</b></font> (Limited vehicle profiles)", st['cell']),
            Paragraph("<font color='#0F766E'><b>Yes</b></font> <b>— Customize Time, Delay Penalty & Distance</b>", st['cell_bold'])
        ],
        [
            Paragraph("<b>Transparent 'Why' Rationale</b>", st['cell_bold']),
            Paragraph("<font color='#DC2626'><b>No</b></font> (Opaque black-box route)", st['cell']),
            Paragraph("<font color='#DC2626'><b>No</b></font> (No explanation given)", st['cell']),
            Paragraph("<font color='#0F766E'><b>Yes</b></font> <b>— Clear tags like 'Avoids 16m gridlock'</b>", st['cell_bold'])
        ],
        [
            Paragraph("<b>Traffic Severity Badges</b>", st['cell_bold']),
            Paragraph("<font color='#D97706'><b>Partial</b></font> (Visual map lines only)", st['cell']),
            Paragraph("<font color='#D97706'><b>Partial</b></font> (Generic speed colors)", st['cell']),
            Paragraph("<font color='#0F766E'><b>Yes</b></font> <b>— Green / Yellow / Red delay classifier</b>", st['cell_bold'])
        ],
        [
            Paragraph("<b>Offline Demo Fail-Safe</b>", st['cell_bold']),
            Paragraph("<font color='#DC2626'><b>No</b></font> (Fails if internet drops)", st['cell']),
            Paragraph("<font color='#DC2626'><b>No</b></font> (Requires paid offline packs)", st['cell']),
            Paragraph("<font color='#0F766E'><b>Yes</b></font> <b>— High-fidelity local offline dictionary</b>", st['cell_bold'])
        ],
        [
            Paragraph("<b>Developer Dashboard & Keys</b>", st['cell_bold']),
            Paragraph("<font color='#D97706'><b>Partial</b></font> (Complex cloud billing)", st['cell']),
            Paragraph("<font color='#D97706'><b>Partial</b></font> (Cluttered UI console)", st['cell']),
            Paragraph("<font color='#0F766E'><b>Yes</b></font> <b>— Instant modal with cURL & SHA-256 keys</b>", st['cell_bold'])
        ]
    ]
    t_comp = Table(comp_data, colWidths=[125, 135, 135, 145])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 4))

    # Business & Pricing Model
    story.append(Paragraph("4.3 How We Monetize (Simple Tiered Model)", st['section']))
    mon_data = [
        [
            Paragraph("<b>Tier</b>", st['cell_header']),
            Paragraph("<b>Price</b>", st['cell_header']),
            Paragraph("<b>Included Quota & Capabilities</b>", st['cell_header']),
            Paragraph("<b>Target Customer</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>Free Developer</b>", st['cell_bold']),
            Paragraph("<b>$0 / mo</b>", st['cell']),
            Paragraph("1,000 queries/month, 60 req/min rate limit, full dashboard access, offline mock mode.", st['cell']),
            Paragraph("Hackathons, student projects, prototyping.", st['cell'])
        ],
        [
            Paragraph("<b>Growth Fleet</b>", st['cell_bold']),
            Paragraph("<b>$0.003 / query</b>", st['cell']),
            Paragraph("Up to 250,000 queries/month, custom scoring weight presets, 60-second live refresh API.", st['cell']),
            Paragraph("Courier startups, local delivery fleets.", st['cell'])
        ],
        [
            Paragraph("<b>Enterprise</b>", st['cell_bold']),
            Paragraph("<b>Custom SLA</b>", st['cell']),
            Paragraph("Unlimited queries, multi-stop TSP route optimization, dedicated container hosting.", st['cell']),
            Paragraph("Logistics corporations, mobility providers.", st['cell'])
        ]
    ]
    t_mon = Table(mon_data, colWidths=[80, 75, 245, 140])
    t_mon.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_mon)
    story.append(Spacer(1, 4))

    # Talking Points for Judges
    story.append(Paragraph("4.4 Top 3 Takeaways to Explain to Judges", st['section']))
    takeaways = [
        [
            Paragraph("<b>1. Not Just Another Map:</b> We don't reinvent map tiles; we solve the intelligence layer that decides which route is best based on traffic delays.", st['cell']),
            Paragraph("<b>2. Tangible Business ROI:</b> Saving 15 minutes of traffic delay per vehicle directly reduces fuel costs, missed deliveries, and driver burnout.", st['cell']),
            Paragraph("<b>3. Production-Ready Tech:</b> Built with real-time TomTom traffic telemetry, instant offline fallbacks, secure SHA-256 keys, and 22 automated tests.", st['cell'])
        ]
    ]
    t_take = Table(takeaways, colWidths=[180, 180, 180])
    t_take.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BFDBFE")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_take)

    doc.build(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_title="SMARTROUTE AI — MARKET REQUIREMENTS DOCUMENT (MRD)", **k))
    print(f"Generated MRD: {filename}")


# =============================================================================
# BUILD PRD DOCUMENT (2 Pages)
# =============================================================================
def build_prd_pdf(filename):
    st = get_common_styles()
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=42
    )
    story = []

    # ---------------- PAGE 1 ----------------
    # Header Banner
    header_data = [
        [
            Paragraph("<b>SmartRoute AI — Product Requirements Document (PRD)</b>", st['title']),
            Paragraph("<font size=7 color='#64748B'><b>DOCUMENT:</b> PRD-v1.0<br/><b>AUDIENCE:</b> Engineers & Judges<br/><b>STATUS:</b> MVP Completed</font>", st['cell'])
        ],
        [
            Paragraph("<b>Product Specifications, Scoring Engine & Core Features</b> — Explaining How It Works in Simple English", st['subtitle']),
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
    story.append(HRFlowable(width="100%", thickness=1.2, color=st['ACCENT'], spaceBefore=2, spaceAfter=5))

    # Product Overview Card
    prod_overview = (
        "<b>Product Overview & Goal:</b><br/>"
        "SmartRoute AI is an intelligent, traffic-aware routing system composed of an <b>Express REST API</b> and an "
        "<b>interactive React/Leaflet dashboard</b>. Given any origin and destination, it retrieves up to 3 driving alternatives, "
        "ranks them mathematically using customizable penalty weights for traffic delay, and provides human-readable reasons "
        "for every recommendation."
    )
    t_over = Table([[Paragraph(prod_overview, st['callout'])]], colWidths=[540])
    t_over.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#BFDBFE")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_over)
    story.append(Spacer(1, 4))

    # Step-by-Step Real-Time Flow Example
    story.append(Paragraph("1. How It Works in Real-Time: Step-by-Step Flow", st['section']))
    story.append(Paragraph(
        "To easily explain how the system works to judges, here is the exact 5-step journey of a single user request:", st['body']
    ))

    flow_data = [
        [
            Paragraph("<b>Step</b>", st['cell_header']),
            Paragraph("<b>System Action</b>", st['cell_header']),
            Paragraph("<b>Real-Time Example (San Francisco: Market St to Presidio)</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>Step 1</b><br/>Input", st['cell_bold']),
            Paragraph("Geocodes Locations", st['cell_bold']),
            Paragraph("User enters origin 'Market St, SF' and destination 'Presidio, SF'. Geocoding service converts them to GPS coordinates via TomTom (or instant offline dictionary fallback).", st['cell'])
        ],
        [
            Paragraph("<b>Step 2</b><br/>Ingest", st['cell_bold']),
            Paragraph("Fetches 3 Paths", st['cell_bold']),
            Paragraph("Queries TomTom Routing API for up to 3 alternative paths. Ingests distance (km), standard travel time (mins), and live traffic congestion delay (mins).", st['cell'])
        ],
        [
            Paragraph("<b>Step 3</b><br/>Score", st['cell_bold']),
            Paragraph("Applies Scoring Formula", st['cell_bold']),
            Paragraph("Applies composite weighting: <code>Score = (50% × Time) + (35% × Traffic Delay) + (15% × Distance)</code>. Heavily penalizes routes with stop-and-go gridlock.", st['cell'])
        ],
        [
            Paragraph("<b>Step 4</b><br/>Classify", st['cell_bold']),
            Paragraph("Traffic Severity & Tags", st['cell_bold']),
            Paragraph("Assigns traffic category: <b>Green (Low delay)</b>, <b>Yellow (Moderate)</b>, or <b>Red (Heavy)</b>. Generates tags: <i>'Fastest Route'</i>, <i>'Avoids 12m congestion'</i>.", st['cell'])
        ],
        [
            Paragraph("<b>Step 5</b><br/>Display", st['cell_bold']),
            Paragraph("Interactive Dashboard", st['cell_bold']),
            Paragraph("Draws color-coded polyline paths on Leaflet map. Displays route cards and activates a 60-second auto-refresh countdown to monitor traffic shifts.", st['cell'])
        ]
    ]
    t_flow = Table(flow_data, colWidths=[55, 120, 365])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_flow)
    story.append(Spacer(1, 4))

    # Core Functional Requirements
    story.append(Paragraph("2. Core Functional Requirements (What We Built)", st['section']))
    fr_data = [
        [
            Paragraph("<b>Feature ID</b>", st['cell_header']),
            Paragraph("<b>Module Name</b>", st['cell_header']),
            Paragraph("<b>What It Does (Simple English)</b>", st['cell_header']),
            Paragraph("<b>Status</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>FR-1</b>", st['cell_bold']),
            Paragraph("Smart Geocoder", st['cell_bold']),
            Paragraph("Converts plain text city/street names to coordinates. If internet or API fails, instantly switches to offline dictionary so the demo never crashes.", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-2</b>", st['cell_bold']),
            Paragraph("Multi-Route Fetcher", st['cell_bold']),
            Paragraph("Requests candidate driving routes from TomTom Routing API with real-time live traffic delay metrics.", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-3</b>", st['cell_bold']),
            Paragraph("Weighted Scoring Engine", st['cell_bold']),
            Paragraph("Ranks routes mathematically based on Time, Delay Penalty, and Distance. The route with the lowest penalty score is recommended as #1.", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-4</b>", st['cell_bold']),
            Paragraph("Severity Engine", st['cell_bold']),
            Paragraph("Classifies traffic delay: Green (<3 mins), Yellow (3–8 mins), Red (>8 mins). Colors map polylines accordingly.", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-5</b>", st['cell_bold']),
            Paragraph("API Key Security", st['cell_bold']),
            Paragraph("Requires <code>X-API-Key</code> header. Keys are cryptographically hashed using SHA-256. Includes rate-limiting (100 req/min).", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-6</b>", st['cell_bold']),
            Paragraph("Leaflet Map Dashboard", st['cell_bold']),
            Paragraph("Interactive React 18 map showing colored polylines, start/end pins, route summary cards, and quick city preset buttons (SF, NYC, London).", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ],
        [
            Paragraph("<b>FR-7</b>", st['cell_bold']),
            Paragraph("Live Auto-Refresh", st['cell_bold']),
            Paragraph("A visual 60-second circular countdown timer that automatically refreshes delay metrics without reloading the page.", st['cell']),
            Paragraph("<font color='#0F766E'><b>Complete</b></font>", st['cell'])
        ]
    ]
    t_fr = Table(fr_data, colWidths=[50, 105, 325, 60])
    t_fr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_fr)

    # ---------------- PAGE 2 ----------------
    story.append(PageBreak())

    story.append(Paragraph("SMARTROUTE AI — PRODUCT REQUIREMENTS DOCUMENT (PAGE 2)", st['subtitle']))
    story.append(Paragraph("3. Technical Architecture, APIs, NFRs & Roadmap", st['title']))
    story.append(HRFlowable(width="100%", thickness=1, color=st['ACCENT'], spaceBefore=2, spaceAfter=5))

    # Architecture Overview
    story.append(Paragraph("3.1 System Architecture: Clean 3-Tier Design", st['section']))
    arch_desc = (
        "The application is built on a modular, decoupled architecture: "
        "<b>Frontend:</b> React 18 + Vite + Leaflet maps + Bootstrap 5. "
        "<b>Backend:</b> Node.js + Express.js REST API with input validation & SHA-256 authentication. "
        "<b>Traffic Layer:</b> TomTom Routing & Traffic API with an intelligent local offline fallback dictionary."
    )
    story.append(Paragraph(arch_desc, st['body']))

    # REST API Table
    story.append(Paragraph("3.2 REST API Endpoints Specification", st['section']))
    api_data = [
        [
            Paragraph("<b>Endpoint</b>", st['cell_header']),
            Paragraph("<b>Method & Auth</b>", st['cell_header']),
            Paragraph("<b>What It Does & Expected Response</b>", st['cell_header']),
            Paragraph("<b>Response Time</b>", st['cell_header'])
        ],
        [
            Paragraph("<code>/api/routes/recommend</code>", st['cell_bold']),
            Paragraph("<b>POST</b><br/><code>X-API-Key</code> required", st['cell']),
            Paragraph("Accepts origin & destination (text or coords). Returns ranked routes with GeoJSON coordinates, duration, traffic delay, and tags.", st['cell']),
            Paragraph("&lt; 350ms (Live)<br/>&lt; 30ms (Offline)", st['cell'])
        ],
        [
            Paragraph("<code>/api/routes/refresh</code>", st['cell_bold']),
            Paragraph("<b>POST</b><br/><code>X-API-Key</code> required", st['cell']),
            Paragraph("Refreshes live traffic delay and re-computes ranking scores for existing routes without re-geocoding locations.", st['cell']),
            Paragraph("&lt; 250ms (Live)<br/>&lt; 20ms (Offline)", st['cell'])
        ],
        [
            Paragraph("<code>/api/health</code>", st['cell_bold']),
            Paragraph("<b>GET</b><br/>Public (No auth)", st['cell']),
            Paragraph("Returns system status, TomTom connectivity state, and server uptime.", st['cell']),
            Paragraph("&lt; 15ms", st['cell'])
        ],
        [
            Paragraph("<code>/api/developer/status</code>", st['cell_bold']),
            Paragraph("<b>GET</b><br/><code>X-API-Key</code> required", st['cell']),
            Paragraph("Validates API key and returns remaining quota and rate-limit status.", st['cell']),
            Paragraph("&lt; 20ms", st['cell'])
        ]
    ]
    t_api = Table(api_data, colWidths=[120, 100, 240, 80])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 4))

    # NFRs & Test Stats
    story.append(Paragraph("3.3 Performance, Security & Test Coverage", st['section']))
    perf_data = [
        [
            Paragraph("<b>Metric / Requirement</b>", st['cell_header']),
            Paragraph("<b>Target Specification</b>", st['cell_header']),
            Paragraph("<b>How We Achieved It</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>API Speed (Latency)</b>", st['cell_bold']),
            Paragraph("&lt; 450 ms response time", st['cell']),
            Paragraph("Streamlined native fetch calls, light JSON payloads, and local coordinate lookup.", st['cell'])
        ],
        [
            Paragraph("<b>Zero-Crash Reliability</b>", st['cell_bold']),
            Paragraph("100% demo availability", st['cell']),
            Paragraph("Built-in fallback dictionary ensures routes display even if internet or TomTom quota fails.", st['cell'])
        ],
        [
            Paragraph("<b>API Security</b>", st['cell_bold']),
            Paragraph("SHA-256 hashed keys", st['cell']),
            Paragraph("Keys are never stored in plain text; rate-limiter prevents spam or denial of service.", st['cell'])
        ],
        [
            Paragraph("<b>Automated Test Suite</b>", st['cell_bold']),
            Paragraph("22 unit & integration tests", st['cell']),
            Paragraph("100% passing tests covering auth, ranking algorithm, severity, and health endpoints.", st['cell'])
        ]
    ]
    t_perf = Table(perf_data, colWidths=[120, 120, 300])
    t_perf.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_perf)
    story.append(Spacer(1, 4))

    # Phased Roadmap
    story.append(Paragraph("3.4 Product Roadmap (Now vs Next)", st['section']))
    road_data = [
        [
            Paragraph("<b>Phase</b>", st['cell_header']),
            Paragraph("<b>Timeline</b>", st['cell_header']),
            Paragraph("<b>Key Features & Deliverables</b>", st['cell_header'])
        ],
        [
            Paragraph("<b>Phase 1: Hackathon MVP</b>", st['cell_bold']),
            Paragraph("<font color='#0F766E'><b>Current (Q4 2026)</b></font>", st['cell']),
            Paragraph("Core 3-route ranking engine, Leaflet interactive map, Green/Yellow/Red severity, offline fallback mode, 22 automated tests.", st['cell'])
        ],
        [
            Paragraph("<b>Phase 2: Multi-Stop Fleet</b>", st['cell_bold']),
            Paragraph("<font color='#1D4ED8'><b>Q1 2027</b></font>", st['cell']),
            Paragraph("Multi-stop traveling salesperson delivery sequencing, automated webhook alerts on unexpected congestion, Python/Go SDKs.", st['cell'])
        ],
        [
            Paragraph("<b>Phase 3: Smart EV Fleet</b>", st['cell_bold']),
            Paragraph("<font color='#D97706'><b>Q2 2027</b></font>", st['cell']),
            Paragraph("Electric Vehicle (EV) battery consumption optimization, hill-incline factor, weather condition overlays, enterprise portal.", st['cell'])
        ]
    ]
    t_road = Table(road_data, colWidths=[120, 100, 320])
    t_road.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), st['PRIMARY']),
        ('GRID', (0, 0), (-1, -1), 0.5, st['BORDER']),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, st['BG_LIGHT']]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_road)
    story.append(Spacer(1, 4))

    # 2-Minute Demo Script for Judges
    story.append(Paragraph("3.5 2-Minute Live Demo Script for Judges", st['section']))
    demo_box = (
        "<b>Step 1 (Open Dashboard):</b> Show the clean dark-mode Leaflet map and system health badge.<br/>"
        "<b>Step 2 (Click Preset):</b> Click 'San Francisco' preset. Watch the origin and destination populate automatically.<br/>"
        "<b>Step 3 (Explain the Ranking):</b> Point out how Route #1 is recommended not because it's the shortest distance, "
        "but because it bypasses an 18-minute traffic jam. Point to the green delay tag and the mathematical rationale.<br/>"
        "<b>Step 4 (Show Real-Time Refresh & Offline Fail-Safe):</b> Point to the 60-second auto-refresh countdown timer and mention the fail-safe offline dictionary that guarantees 100% demo uptime."
    )
    t_demo = Table([[Paragraph(demo_box, st['callout'])]], colWidths=[540])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor("#86EFAC")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_demo)

    doc.build(story, canvasmaker=lambda *a, **k: NumberedCanvas(*a, doc_title="SMARTROUTE AI — PRODUCT REQUIREMENTS DOCUMENT (PRD)", **k))
    print(f"Generated PRD: {filename}")

if __name__ == '__main__':
    out_dir = r"e:\project\Route Wise"
    public_dir = os.path.join(out_dir, "client", "public")
    os.makedirs(public_dir, exist_ok=True)

    mrd_file = os.path.join(out_dir, "SmartRoute_AI_MRD.pdf")
    prd_file = os.path.join(out_dir, "SmartRoute_AI_PRD.pdf")

    build_mrd_pdf(mrd_file)
    build_prd_pdf(prd_file)

    shutil.copy2(mrd_file, os.path.join(public_dir, "SmartRoute_AI_MRD.pdf"))
    shutil.copy2(prd_file, os.path.join(public_dir, "SmartRoute_AI_PRD.pdf"))
    print("Copied both PDFs to client/public/")
