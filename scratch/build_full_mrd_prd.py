import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# --- Canvas with headers & dynamic footers ---
class NumberedCanvasMRD(canvas.Canvas):
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
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        if self._pageNumber > 1:
            self.drawString(54, 755, "JJCET AI-PDLC Hackathon 2026 · Stage 2: Market Requirements Document (MRD)")
            self.drawRightString(558, 755, "Team: Cyber Knight")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 747, 558, 747)
            
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(54, 45, 558, 45)
        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "Cyber Knight · Problem: Commuters Waste Time at Congested Junctions (Traffic Advisory Tool)")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class NumberedCanvasPRD(canvas.Canvas):
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
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        if self._pageNumber > 1:
            self.drawString(54, 755, "JJCET AI-PDLC Hackathon 2026 · Stage 3: Product Requirements Document (PRD)")
            self.drawRightString(558, 755, "Team: Cyber Knight")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 747, 558, 747)
            
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(54, 45, 558, 45)
        self.setFont("Helvetica", 8)
        self.drawString(54, 32, "Cyber Knight · Problem: Commuters Waste Time at Congested Junctions (Traffic Advisory Tool)")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def get_pdf_styles():
    styles = getSampleStyleSheet()
    primary = colors.HexColor("#1e1b4b")
    indigo = colors.HexColor("#4338ca")
    slate = colors.HexColor("#334155")
    
    return {
        'title': ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=primary, spaceAfter=3),
        'subtitle': ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=indigo, spaceAfter=8),
        'h1': ParagraphStyle('Heading1_Custom', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=primary, spaceBefore=8, spaceAfter=4, keepWithNext=True),
        'h2': ParagraphStyle('Heading2_Custom', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=indigo, spaceBefore=6, spaceAfter=3, keepWithNext=True),
        'body': ParagraphStyle('Body_Custom', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=slate, spaceAfter=4),
        'body_bold': ParagraphStyle('Body_Bold_Custom', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, leading=10.5, textColor=primary, spaceAfter=4),
        'callout': ParagraphStyle('Callout_Text', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.8, leading=11, textColor=colors.HexColor("#0f172a")),
        'table_cell': ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=6.8, leading=9, textColor=slate),
        'table_cell_bold': ParagraphStyle('TableCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=6.8, leading=9, textColor=primary),
        'table_header': ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.2, leading=9.5, textColor=colors.white),
        'meta_label': ParagraphStyle('MetaLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.2, leading=9.5, textColor=primary),
        'meta_val': ParagraphStyle('MetaVal', parent=styles['Normal'], fontName='Helvetica', fontSize=7.2, leading=9.5, textColor=slate)
    }

print("Canvas and styles defined successfully")
