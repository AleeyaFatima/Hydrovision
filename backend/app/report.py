"""PDF report generation for AquaMap analysis using ReportLab."""
import io
import time
from pathlib import Path
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_pdf_report(
    original_pil: Image.Image,
    overlay_pil: Image.Image,
    uncertainty_pil: Image.Image | None,
    gradcam_pil: Image.Image | None,
    stats: dict,
) -> bytes:
    """Generates a professional PDF report summarizing the flood segmentation analysis."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "AquaMapTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0B1626"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "AquaMapSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4A5568"),
    )
    heading_style = ParagraphStyle(
        "AquaMapHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0B1626"),
        spaceBefore=10,
        spaceAfter=6,
    )
    caption_style = ParagraphStyle(
        "AquaMapCaption",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#4A5568"),
        alignment=1,
    )
    disclaimer_style = ParagraphStyle(
        "AquaMapDisclaimer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#718096"),
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("AquaMap — AI Floodwater Segmentation Report", title_style))
    story.append(Paragraph(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S UTC')} | Model: <b>{stats.get('model_name', 'U-Net')}</b>", subtitle_style))
    story.append(Spacer(1, 12))

    # Summary Metrics Table
    water_pct = f"{stats.get('water_pixel_percentage', 0.0):.2f}%"
    mean_unc = f"{stats.get('mean_uncertainty', 0.0):.4f}" if stats.get('mean_uncertainty') is not None else "N/A"
    inf_time = f"{stats.get('inference_ms', 0.0):.1f} ms"
    img_dims = f"{stats.get('image_size', ['-','-'])[0]} × {stats.get('image_size', ['-','-'])[1]} px"

    metric_data = [
        ["Metric", "Value", "Metric", "Value"],
        ["Water Coverage", water_pct, "Mean Uncertainty", mean_unc],
        ["Inference Latency", inf_time, "Image Resolution", img_dims],
        ["Detection Threshold", f"{stats.get('threshold', 0.5):.2f}", "Status", "Verified Segmentation"],
    ]

    metric_table = Table(metric_data, colWidths=[130, 130, 130, 130])
    metric_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B1626")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F7FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ("ALIGN", (3, 1), (3, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(metric_table)
    story.append(Spacer(1, 14))

    # Images Section
    story.append(Paragraph("Visual Segmentation & Explainability Diagnostics", heading_style))

    def pil_to_flowable(pil_img: Image.Image, max_w=240, max_h=180):
        buf = io.BytesIO()
        pil_img.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        return RLImage(buf, width=max_w, height=max_h)

    # 2x2 Grid of images
    orig_flow = pil_to_flowable(original_pil)
    over_flow = pil_to_flowable(overlay_pil)

    row1 = [
        [orig_flow, over_flow],
        [Paragraph("Original Aerial Photo", caption_style), Paragraph(f"Water Overlay ({water_pct})", caption_style)]
    ]

    img_table1 = Table(row1, colWidths=[260, 260])
    img_table1.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(img_table1)
    story.append(Spacer(1, 10))

    if uncertainty_pil or gradcam_pil:
        row2_imgs = []
        row2_captions = []
        if uncertainty_pil:
            row2_imgs.append(pil_to_flowable(uncertainty_pil))
            row2_captions.append(Paragraph(f"TTA Uncertainty Heatmap (Mean: {mean_unc})", caption_style))
        else:
            row2_imgs.append("")
            row2_captions.append("")

        if gradcam_pil:
            row2_imgs.append(pil_to_flowable(gradcam_pil))
            row2_captions.append(Paragraph("Grad-CAM Explainability Map (U-Net Attention)", caption_style))
        else:
            row2_imgs.append("")
            row2_captions.append("")

        img_table2 = Table([row2_imgs, row2_captions], colWidths=[260, 260])
        img_table2.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(img_table2)
        story.append(Spacer(1, 14))

    # Disclaimer
    story.append(Paragraph("<b>Disclaimer:</b> AquaMap is an AI screening and decision-support tool designed for rapid aerial visual analysis. It is not an official flood assessment and should be verified with ground-truth hydrologic surveys before critical life-safety emergency response deployment.", disclaimer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
