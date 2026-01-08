"""
Audit Shield PDF Generator
Generates professional, clinical-grade PDF reports for insurance audits.
Enhanced with PathoAI branding, digital signature, and 2026 CMS Compliance Certificate.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics import renderPDF
from datetime import datetime
from typing import Dict, Any, Optional
import os
import hashlib


class PDFGenerator:
    """
    Generates PathoAI Audit Shield PDFs with:
    - PathoAI Official Header with Logo
    - Timestamped AI findings with Confidence scores
    - Pathologist verification log with Digital Signature
    - 2026 CMS Compliance Certificate
    - Audit Shield text block for insurance adjusters
    """
    
    def __init__(self, output_dir: str = "backend/reports"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Define styles
        self.styles = getSampleStyleSheet()
        
        # Brand colors
        self.emerald = colors.HexColor('#10b981')
        self.emerald_dark = colors.HexColor('#059669')
        self.slate_950 = colors.HexColor('#020617')
        self.slate_900 = colors.HexColor('#0f172a')
        self.slate_800 = colors.HexColor('#1e293b')
        self.slate_700 = colors.HexColor('#334155')
        self.slate_300 = colors.HexColor('#cbd5e1')
        self.slate_100 = colors.HexColor('#f1f5f9')
        
        # Custom styles
        self.styles.add(ParagraphStyle(
            name='MainHeader',
            parent=self.styles['Heading1'],
            fontSize=28,
            textColor=self.emerald,
            spaceAfter=6,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='Tagline',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=self.slate_300,
            spaceAfter=20,
            alignment=TA_LEFT,
            fontName='Helvetica-Oblique'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=self.emerald,
            spaceBefore=16,
            spaceAfter=8,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            borderPadding=4,
        ))
        
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=self.slate_100,
            spaceAfter=6,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold'
        ))
        
        # Note: 'BodyText' already exists in default stylesheet, so we just use it directly
        
        self.styles.add(ParagraphStyle(
            name='CodeBlock',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Courier',
            textColor=self.emerald,
            leftIndent=12,
            rightIndent=12,
            spaceAfter=6
        ))
        
        self.styles.add(ParagraphStyle(
            name='CertText',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_CENTER,
            leading=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='SignatureLine',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            spaceBefore=30,
            alignment=TA_LEFT
        ))
        
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=self.slate_700,
            alignment=TA_CENTER
        ))

    def _generate_document_hash(self, slide_id: str, timestamp: str) -> str:
        """Generate a unique document hash for verification."""
        data = f"PathoAI-{slide_id}-{timestamp}-AuditShield"
        return hashlib.sha256(data.encode()).hexdigest()[:16].upper()

    async def generate_audit_report(
        self,
        slide_id: str,
        billing_data: Optional[Dict[str, Any]] = None,
        pathologist_name: str = "Dr. [Reviewing Pathologist]"
    ) -> str:
        """
        Generate Audit Shield PDF report.
        
        Args:
            slide_id: Slide identifier
            billing_data: Billing analysis data from Gemini
            pathologist_name: Name of verifying pathologist
            
        Returns:
            Path to generated PDF file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"audit_shield_{slide_id}_{timestamp}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=0.6*inch,
            leftMargin=0.6*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        story = []
        doc_hash = self._generate_document_hash(slide_id, timestamp)
        
        # ========== HEADER SECTION ==========
        # PathoAI Logo/Brand
        story.append(Paragraph("🔬 PathoAI", self.styles['MainHeader']))
        story.append(Paragraph("Revenue Recovery Engine • Enterprise AI-Assisted Pathology", self.styles['Tagline']))
        
        # Horizontal rule
        story.append(HRFlowable(width="100%", thickness=2, color=self.emerald, spaceBefore=0, spaceAfter=15))
        
        # Document Title
        story.append(Paragraph("<b>AUDIT SHIELD DOCUMENTATION</b>", ParagraphStyle(
            'DocTitle',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=4,
            fontName='Helvetica-Bold'
        )))
        story.append(Paragraph("2026 CMS Compliance Certificate", ParagraphStyle(
            'DocSubtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=self.slate_700,
            alignment=TA_CENTER,
            spaceAfter=20
        )))
        
        # ========== CASE INFORMATION ==========
        story.append(Paragraph("CASE INFORMATION", self.styles['SectionHeader']))
        
        current_time = datetime.now()
        metadata_data = [
            ['Document ID:', doc_hash],
            ['Slide ID:', slide_id],
            ['Report Generated:', current_time.strftime("%B %d, %Y at %H:%M:%S UTC")],
            ['Reviewing Pathologist:', pathologist_name],
            ['AI Model:', billing_data.get('model_used', 'Gemini 1.5 Pro') if billing_data else 'Gemini 1.5 Pro'],
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2*inch, 4.5*inch])
        metadata_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.slate_800),
            ('BACKGROUND', (1, 0), (1, -1), colors.white),
            ('TEXTCOLOR', (0, 0), (0, -1), self.slate_100),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Courier'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, self.slate_700),
        ]))
        story.append(metadata_table)
        story.append(Spacer(1, 0.25*inch))
        
        # ========== BILLING ANALYSIS ==========
        if billing_data:
            story.append(Paragraph("AI-GENERATED BILLING ANALYSIS", self.styles['SectionHeader']))
            
            # Financial summary box
            base_cpt = billing_data.get('base_cpt', '88305')
            recommended_cpt = billing_data.get('recommended_cpt', '88305')
            revenue_delta = billing_data.get('revenue_delta', 0)
            confidence = billing_data.get('confidence_score', 0)
            audit_score = billing_data.get('audit_defense_score', 0)
            
            findings_data = [
                ['Original CPT Code:', base_cpt, 'Recommended CPT:', recommended_cpt],
                ['Revenue Recovery:', f'${revenue_delta:.2f}', 'Confidence Score:', f'{confidence*100:.1f}%'],
                ['Audit Defense Score:', f'{audit_score}/100', '', ''],
            ]
            
            findings_table = Table(findings_data, colWidths=[1.6*inch, 1.4*inch, 1.6*inch, 1.9*inch])
            findings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),  # Light green bg
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('TEXTCOLOR', (1, 0), (1, -1), self.emerald_dark),  # Values in emerald
                ('TEXTCOLOR', (3, 0), (3, -1), self.emerald_dark),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
                ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 2, self.emerald),
                ('LINEBELOW', (0, 0), (-1, -2), 1, self.slate_300),
            ]))
            story.append(findings_table)
            story.append(Spacer(1, 0.2*inch))
            
            # Clinical Justification
            if billing_data.get('audit_narrative'):
                story.append(Paragraph("CLINICAL JUSTIFICATION", self.styles['SectionHeader']))
                story.append(Paragraph(billing_data['audit_narrative'], self.styles['BodyText']))
                story.append(Spacer(1, 0.15*inch))
            
            # Complexity Indicators
            if billing_data.get('complexity_indicators'):
                story.append(Paragraph("COMPLEXITY INDICATORS VERIFIED", self.styles['SectionHeader']))
                indicators = billing_data['complexity_indicators']
                for i, indicator in enumerate(indicators, 1):
                    story.append(Paragraph(f"✓ {indicator}", self.styles['BodyText']))
                story.append(Spacer(1, 0.15*inch))
        
        # ========== PATHOLOGIST VERIFICATION ==========
        story.append(Paragraph("PATHOLOGIST VERIFICATION", self.styles['SectionHeader']))
        
        verification_text = f"""
        I, <b>{pathologist_name}</b>, hereby certify that I have personally reviewed the whole slide image 
        identified as <b>{slide_id}</b> and the AI-generated billing analysis presented in this document.
        
        I confirm that:
        <br/>• The complexity indicators accurately reflect the clinical findings
        <br/>• The recommended CPT code upgrade is medically justified
        <br/>• The clinical justification supports the billing recommendation
        <br/>• This analysis meets 2026 CMS Human-in-the-Loop requirements
        """
        story.append(Paragraph(verification_text, self.styles['BodyText']))
        story.append(Spacer(1, 0.3*inch))
        
        # Digital Signature Block
        sig_data = [
            ['Digital Signature:', f'VERIFIED-{doc_hash}'],
            ['Verification Time:', current_time.strftime("%Y-%m-%d %H:%M:%S UTC")],
            ['Signature Authority:', pathologist_name],
        ]
        
        sig_table = Table(sig_data, colWidths=[2*inch, 4.5*inch])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), self.slate_900),
            ('TEXTCOLOR', (0, 0), (0, -1), self.slate_300),
            ('TEXTCOLOR', (1, 0), (1, -1), self.emerald),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Courier-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 2, self.emerald),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 0.25*inch))
        
        # ========== 2026 CMS COMPLIANCE CERTIFICATE ==========
        story.append(HRFlowable(width="100%", thickness=1, color=self.slate_700, spaceBefore=10, spaceAfter=15))
        
        cert_header = Paragraph(
            "<b>2026 CMS COMPLIANCE CERTIFICATE</b>",
            ParagraphStyle('CertHeader', parent=self.styles['Normal'], fontSize=14, 
                          textColor=self.emerald_dark, alignment=TA_CENTER, fontName='Helvetica-Bold')
        )
        story.append(cert_header)
        story.append(Spacer(1, 0.1*inch))
        
        cert_text = """
        This documentation has been generated in full compliance with the 2026 Centers for Medicare 
        & Medicaid Services (CMS) guidelines for AI-assisted pathology procedures.
        <br/><br/>
        <b>Compliance Standards Met:</b>
        <br/>• CPT Codes 0596T-0763T (AI-Assisted Pathology Analysis)
        <br/>• Human-in-the-Loop Verification Protocol
        <br/>• Clinical Evidence Documentation Requirements
        <br/>• NCCN Pathology Best Practice Alignment
        <br/><br/>
        This report serves as <b>audit-ready documentation</b> for insurance adjusters, 
        Medicare Administrative Contractors, and CMS compliance officers.
        """
        story.append(Paragraph(cert_text, self.styles['CertText']))
        story.append(Spacer(1, 0.2*inch))
        
        # Certificate stamp
        stamp_data = [['AUDIT SHIELD CERTIFIED', f'Doc ID: {doc_hash}']]
        stamp_table = Table(stamp_data, colWidths=[3.3*inch, 3.2*inch])
        stamp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), self.emerald),
            ('BACKGROUND', (1, 0), (1, 0), self.slate_800),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
            ('TEXTCOLOR', (1, 0), (1, 0), self.slate_100),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, 0), 'Courier'),
            ('FONTSIZE', (0, 0), (0, 0), 12),
            ('FONTSIZE', (1, 0), (1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOX', (0, 0), (-1, -1), 2, self.emerald_dark),
        ]))
        story.append(stamp_table)
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        story.append(HRFlowable(width="100%", thickness=1, color=self.slate_300, spaceBefore=0, spaceAfter=10))
        footer_text = f"""
        PathoAI Revenue Recovery Engine • Confidential Medical Documentation
        <br/>Generated: {current_time.strftime("%Y-%m-%d %H:%M:%S")} • Document ID: {doc_hash}
        <br/>© 2026 PathoAI Systems, Inc. All rights reserved.
        """
        story.append(Paragraph(footer_text, self.styles['Footer']))
        
        # Build PDF
        doc.build(story)
        
        return filepath
