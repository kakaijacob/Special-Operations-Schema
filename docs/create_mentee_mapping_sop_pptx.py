#!/usr/bin/env python3
"""Generate a presentation-ready Mentee Mapping SOP PowerPoint deck.

Design: navy-led editorial SOP — Source Serif 4 display + DM Sans body,
Jacaranda orange accent, open layouts (minimal cards), atmospheric geometry.
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

# --- Jacaranda Health brand (orange-led; lavender used sparingly) ---
ORANGE = RGBColor(0xFD, 0x4F, 0x00)
ORANGE_DEEP = RGBColor(0xD9, 0x42, 0x00)
LAVENDER = RGBColor(0x74, 0x78, 0xB6)
LAVENDER_SOFT = RGBColor(0xA9, 0xAE, 0xFF)
NAVY = RGBColor(0x06, 0x12, 0x1B)
NAVY_MID = RGBColor(0x21, 0x2B, 0x35)
NAVY_SOFT = RGBColor(0x2E, 0x35, 0x45)
INK = RGBColor(0x1A, 0x22, 0x2C)
SLATE = RGBColor(0x4A, 0x55, 0x63)         # darker for readability
MUTED = RGBColor(0x8B, 0x93, 0xA0)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PAPER = RGBColor(0xF5, 0xF4, 0xF1)          # warm paper — not cream/terracotta AI look
PAPER_WARM = RGBColor(0xFB, 0xF0, 0xE8)     # soft orange wash
WASH = RGBColor(0xEE, 0xF0, 0xF4)
LINE = RGBColor(0xD0, 0xD4, 0xDA)
WATERMARK = RGBColor(0xE6, 0xE2, 0xDC)     # soft warm watermark

FONT_DISPLAY = "Source Serif 4"
FONT_BODY = "DM Sans"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 14


def set_run_font(run, size=14, bold=False, color=INK, name=FONT_BODY):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name
    # Also set east asian / complex script to same family for LO
    rPr = run._r.get_or_add_rPr()
    for attr in ("latin", "ea", "cs"):
        el = rPr.find(qn(f"a:{attr}"))
        if el is None:
            el = etree.SubElement(rPr, qn(f"a:{attr}"))
        el.set("typeface", name)


def add_text_box(slide, left, top, width, height, text, size=14, bold=False,
                 color=INK, align=PP_ALIGN.LEFT, font=FONT_BODY, anchor=None):
    shape = slide.shapes.add_textbox(left, top, width, height)
    tf = shape.text_frame
    tf.word_wrap = True
    if anchor is not None:
        tf.anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run_font(run, size=size, bold=bold, color=color, name=font)
    return shape


def add_multiline(slide, left, top, width, height, lines, size=13,
                  color=INK, bold=False, bullet=False, font=FONT_BODY,
                  space_before=8):
    shape = slide.shapes.add_textbox(left, top, width, height)
    tf = shape.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, tuple):
            text, opts = item
        else:
            text, opts = item, {}
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_before = Pt(opts.get("space_before", space_before if i else 0))
        p.space_after = Pt(opts.get("space_after", 2))
        run = p.add_run()
        prefix = "•  " if (bullet or opts.get("bullet")) else ""
        run.text = prefix + text
        set_run_font(
            run,
            size=opts.get("size", size),
            bold=opts.get("bold", bold),
            color=opts.get("color", color),
            name=opts.get("font", font),
        )
    return shape


def add_rect(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    # Send decorative shapes behind by default via z-order isn't easy;
    # callers order shapes carefully.
    return shape


def add_oval(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape


def add_rounded(slide, left, top, width, height, fill, adj=0.06):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    try:
        shape.adjustments[0] = adj
    except Exception:
        pass
    shape.line.fill.background()
    return shape


def set_shape_alpha(shape, alpha_pct):
    """Set solid fill transparency (0=opaque, 100=invisible) via OOXML."""
    solid = shape.fill._xPr.solidFill
    srgb = solid.find(qn("a:srgbClr"))
    if srgb is None:
        return
    alpha = srgb.find(qn("a:alpha"))
    if alpha is None:
        alpha = etree.SubElement(srgb, qn("a:alpha"))
    # alpha is 0–100000 (pct * 1000)
    alpha.set("val", str(int((100 - alpha_pct) * 1000)))


def paper_bg(slide):
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, PAPER)
    # Soft orange wash — top-right atmosphere
    blob = add_oval(slide, Inches(8.5), Inches(-2.2), Inches(7), Inches(7), PAPER_WARM)
    set_shape_alpha(blob, 55)
    # Cool wash — bottom-left
    blob2 = add_oval(slide, Inches(-2.5), Inches(4.5), Inches(6.5), Inches(5.5), WASH)
    set_shape_alpha(blob2, 50)


def content_chrome(slide, page):
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.06), ORANGE)
    add_rect(slide, 0, Inches(7.22), SLIDE_W, Inches(0.28), NAVY)
    add_text_box(
        slide, Inches(0.55), Inches(7.24), Inches(7), Inches(0.24),
        "Mentee Mapping SOP", size=9, bold=False, color=MUTED, font=FONT_BODY,
    )
    add_text_box(
        slide, Inches(11.0), Inches(7.24), Inches(1.8), Inches(0.24),
        f"{page}  ·  {TOTAL}", size=9, bold=False, color=MUTED,
        align=PP_ALIGN.RIGHT, font=FONT_BODY,
    )


def eyebrow(slide, text, top=Inches(0.28)):
    add_text_box(
        slide, Inches(0.55), top, Inches(12), Inches(0.28),
        text.upper(), size=11, bold=True, color=ORANGE, font=FONT_BODY,
    )


def title_block(slide, title, subtitle=None, top=Inches(0.5), size=30):
    add_text_box(
        slide, Inches(0.55), top, Inches(12.2), Inches(0.65),
        title, size=size, bold=True, color=NAVY, font=FONT_DISPLAY,
    )
    if subtitle:
        add_text_box(
            slide, Inches(0.55), top + Inches(0.58), Inches(12.2), Inches(0.35),
            subtitle, size=14, bold=False, color=SLATE, font=FONT_BODY,
        )


def hairline(slide, left, top, width):
    add_rect(slide, left, top, width, Inches(0.015), LINE)


def watermark_number(slide, text, left=Inches(10.4), top=Inches(5.2), size=96):
    """Large faded step number near bottom-right (above footer)."""
    add_text_box(
        slide, left, top, Inches(2.6), Inches(1.4),
        text, size=size, bold=True, color=WATERMARK, font=FONT_DISPLAY,
        align=PP_ALIGN.RIGHT,
    )


# ---------------------------------------------------------------------------
# Slides
# ---------------------------------------------------------------------------

def slide_01_title(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    # Atmospheric orbs
    o1 = add_oval(slide, Inches(8.8), Inches(-1.5), Inches(6.5), Inches(6.5), NAVY_SOFT)
    set_shape_alpha(o1, 35)
    o2 = add_oval(slide, Inches(-2), Inches(4), Inches(5), Inches(5), RGBColor(0x0C, 0x1C, 0x28))
    set_shape_alpha(o2, 20)
    add_rect(slide, 0, 0, Inches(0.18), SLIDE_H, ORANGE)

    add_text_box(
        slide, Inches(0.85), Inches(1.7), Inches(11), Inches(0.35),
        "STANDARD OPERATING PROCEDURE", size=12, bold=True, color=ORANGE, font=FONT_BODY,
    )
    add_text_box(
        slide, Inches(0.85), Inches(2.2), Inches(11.5), Inches(1.3),
        "Mentee Mapping SOP", size=46, bold=True, color=WHITE, font=FONT_DISPLAY,
    )
    add_rect(slide, Inches(0.85), Inches(3.55), Inches(1.4), Inches(0.07), ORANGE)
    add_text_box(
        slide, Inches(0.85), Inches(3.85), Inches(10), Inches(0.55),
        "From the Mentee Database to Kobo Tool Updates",
        size=20, bold=False, color=LAVENDER_SOFT, font=FONT_BODY,
    )

    add_text_box(
        slide, Inches(0.85), Inches(6.35), Inches(6), Inches(0.35),
        "Jacaranda Health  ·  MENTORS Program", size=13, color=MUTED, font=FONT_BODY,
    )
    add_text_box(
        slide, Inches(8.2), Inches(6.35), Inches(4.3), Inches(0.35),
        "Data Quality  ·  Automation  ·  Scale", size=13, color=MUTED,
        align=PP_ALIGN.RIGHT, font=FONT_BODY,
    )


def slide_02_journey(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 2)
    title_block(slide, "Where did we come from?", "Evolution of mentee mapping approaches")

    phases = [
        ("01", "Facility Level", "Tracked mentorship at facility level — not at mentee level."),
        ("02", "Random Mapping", "IFMs keyed in mentee details on Kobo with activities undertaken."),
        ("03", "PO-led Mapping", "Preloaded mentee names on Kobo so IFMs simply select names."),
        ("04", "Facility-led", "IFM-led mentee mapping via a dedicated Kobo tool — proposed future."),
    ]

    # Continuous timeline
    add_rect(slide, Inches(0.85), Inches(2.85), Inches(11.6), Inches(0.035), ORANGE)

    for i, (num, title, body) in enumerate(phases):
        x = Inches(0.7) + i * Inches(3.1)
        # Soft column wash for the proposed future step
        if i == 3:
            wash = add_rounded(slide, x, Inches(3.2), Inches(2.95), Inches(3.4), PAPER_WARM, adj=0.04)
            set_shape_alpha(wash, 35)
        # Node
        add_oval(slide, x + Inches(1.05), Inches(2.7), Inches(0.35), Inches(0.35), ORANGE)
        add_text_box(
            slide, x + Inches(1.05), Inches(2.74), Inches(0.35), Inches(0.28),
            num, size=9, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font=FONT_BODY,
        )
        y_title = Inches(3.4)
        if i == 3:
            add_text_box(
                slide, x + Inches(0.15), Inches(3.35), Inches(2.8), Inches(0.28),
                "PROPOSED", size=10, bold=True, color=ORANGE, font=FONT_BODY,
            )
            y_title = Inches(3.65)
        add_text_box(
            slide, x + Inches(0.15), y_title, Inches(2.8), Inches(0.55),
            title, size=16, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, x + Inches(0.15), y_title + Inches(0.7), Inches(2.8), Inches(1.9),
            body, size=13, bold=False, color=SLATE, font=FONT_BODY,
        )


def approach_slide(prs, page, num, title, eyebrow_text, paragraphs, pull_title, pull_lines):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, page)
    eyebrow(slide, eyebrow_text)
    title_block(slide, title, top=Inches(0.52), size=28)

    # Main column
    y = Inches(1.4)
    for para in paragraphs:
        lines_est = max(1, (len(para) // 78) + 1)
        h = Inches(0.28 + lines_est * 0.28)
        add_multiline(
            slide, Inches(0.55), y, Inches(8.0), h,
            [para], size=14, color=INK, bullet=True, space_before=4,
        )
        y += h + Inches(0.08)

    # Pull quote panel — solid navy, not a white card
    add_rect(slide, Inches(9.0), Inches(1.4), Inches(3.75), Inches(5.2), NAVY)
    add_rect(slide, Inches(9.0), Inches(1.4), Inches(3.75), Inches(0.08), ORANGE)
    add_text_box(
        slide, Inches(9.3), Inches(1.75), Inches(3.2), Inches(0.4),
        pull_title, size=13, bold=True, color=ORANGE, font=FONT_BODY,
    )
    add_multiline(
        slide, Inches(9.3), Inches(2.35), Inches(3.2), Inches(3.8),
        pull_lines, size=13, color=WHITE, bullet=True, space_before=10,
    )
    # Soft step watermark tucked under the panel bottom
    watermark_number(slide, num, left=Inches(9.2), top=Inches(5.55), size=72)


def slide_03(prs):
    approach_slide(
        prs, 3, "01",
        "Facility Level Mapping Approach",
        "Approach 01  ·  2018–2023",
        [
            "At the inception of the MENTORS program, data was tracked at facility level.",
            "If a mentorship session — e.g. a CME on AMTSL — took place in a facility, we assumed that all HCWs in that facility were trained on that module.",
            "When we say we trained 7,441 HCWs in the pre-cohort model (2018–2023), it is an estimate based on HCWs working in the maternity wing of partner facilities at that time.",
            "This method was not very accurate — HCWs attrited through retirements, promotions, transfers, or lack of participation.",
        ],
        "Key takeaway",
        [
            "Facility-level counts were estimates, not individual reach.",
            "Attrition and non-participation inflated reported coverage.",
            "Drove the shift to mentee-level tracking.",
        ],
    )


def slide_04(prs):
    approach_slide(
        prs, 4, "02",
        "Random Mapping Approach",
        "Approach 02  ·  Mentee-level pivot",
        [
            "JH pivoted to mentee-level tracking of MENTORS Program reach.",
            "IFMs keyed in mentee details: select facility → enter mentee name → enter phone number (mentee_id) → select activities participated in.",
            "This was an improvement over facility-level assumptions.",
            "Key limitation: heavy reliance on IFM memory and accuracy. Errors in mentee_id and inconsistent phone numbers limited reliability as a unique identifier.",
        ],
        "Limitation",
        [
            "Manual entry of names & phone numbers.",
            "Duplicate / mistyped mentee_ids.",
            "Phone number unreliable as unique ID.",
            "Data quality depended on IFM recall.",
        ],
    )


def slide_05(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 5)
    eyebrow(slide, "Approach 03  ·  Current state")
    title_block(slide, "PO-led Mentee Mapping Approach", top=Inches(0.52), size=28)

    bullets = [
        "POs visit facilities and map HCWs eligible for the MENTORS Program.",
        "Mapped mentee data is used to preload mentee details on Kobo before data collection.",
        "Immensely improved mentorship data quality — phone number (mentee_id) became a reliable unique identifier.",
        "Hybrid program need: WhatsApp numbers now collected to supplement mentee_id, linking in-person mentorship to virtual DELTA.",
        "Vision: a mentee can complete the curriculum entirely in-person, or take some modules virtually via DELTA (hybrid).",
    ]
    y = Inches(1.35)
    for b in bullets:
        add_rect(slide, Inches(0.55), y + Inches(0.12), Inches(0.08), Inches(0.08), ORANGE)
        add_text_box(
            slide, Inches(0.85), y, Inches(11.8), Inches(0.7),
            b, size=14, color=INK, font=FONT_BODY,
        )
        y += Inches(0.78)

    # Impact strip
    add_rect(slide, Inches(0.55), Inches(5.95), Inches(12.2), Inches(0.9), NAVY)
    add_text_box(
        slide, Inches(0.85), Inches(6.2), Inches(11.6), Inches(0.5),
        "Impact — Preloading mentee details on Kobo significantly increased the reliability of mentee_id and overall data quality.",
        size=13, color=WHITE, font=FONT_BODY,
    )


def slide_06(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 6)
    title_block(slide, "What was the problem?", "Why automation became necessary")

    problems = [
        ("01", "Mentee-level tracking", "Need to track mentorship at the mentee level — not only at facility level."),
        ("02", "Field data errors", "Inaccurate mentee data entered by IFMs during data collection in the field."),
        ("03", "Manual preloading", "Preloading mentee details into Kobo improved quality, but remained manual and error-prone."),
        ("04", "Painful updates", "Mentee attrition is expected; keeping Kobo Tools up to date was a painful, ongoing process."),
    ]
    for i, (num, title, body) in enumerate(problems):
        col, row = i % 2, i // 2
        x = Inches(0.55) + col * Inches(6.35)
        y = Inches(1.55) + row * Inches(2.45)
        # Open panel with top hairline — not a floated card
        add_rect(slide, x, y, Inches(6.05), Inches(0.04), ORANGE if i % 2 == 0 else LAVENDER)
        add_text_box(
            slide, x, y + Inches(0.25), Inches(1.0), Inches(0.45),
            num, size=22, bold=True, color=ORANGE if i % 2 == 0 else LAVENDER, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, x + Inches(1.1), y + Inches(0.3), Inches(4.7), Inches(0.4),
            title, size=18, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, x, y + Inches(1.0), Inches(5.8), Inches(1.1),
            body, size=14, color=SLATE, font=FONT_BODY,
        )


def slide_07(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 7)
    title_block(slide, "Kobo Tool Update Process", "Five steps from database sync to deployed forms")

    steps = [
        ("01", "Sync Databases", "Mentee & IFM databases synced, cleaned, and filtered for valid records."),
        ("02", "Building Blocks", "Reusable intermediate sheets: types, names, labels, relevance, calculations, choices."),
        ("03", "Form Builders", "Assemble XLSForm-ready survey, choice, and settings sheets."),
        ("04", "Validation", "Confirm builders are complete, filtered, and logically consistent."),
        ("05", "Deployment", "Upload validated builders and update form versions in KoboToolbox."),
    ]
    for i, (num, title, body) in enumerate(steps):
        y = Inches(1.35) + i * Inches(1.05)
        # Large editorial number + content, separator line
        add_text_box(
            slide, Inches(0.55), y, Inches(1.1), Inches(0.7),
            num, size=28, bold=True, color=ORANGE, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, Inches(1.8), y + Inches(0.05), Inches(10.5), Inches(0.35),
            title, size=17, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, Inches(1.8), y + Inches(0.45), Inches(10.5), Inches(0.35),
            body, size=13, color=SLATE, font=FONT_BODY,
        )
        if i < 4:
            hairline(slide, Inches(1.8), y + Inches(0.95), Inches(10.5))


def slide_08(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 8)
    eyebrow(slide, "Step 01")
    title_block(slide, "Syncing of Mentor-Mentee Database", top=Inches(0.52), size=28)

    items = [
        ("Pull latest records", "Bring the newest mentee and IFM records into the spreadsheet."),
        ("Clean for Kobo", "Clean names, IDs, counties, and facilities for Kobo compatibility."),
        ("Normalize values", "Normalize status (Active / Inactive) and program (MENTORS, Newborn, Both)."),
        ("Drop incomplete rows", "Remove rows missing ID, name, county, facility, or facility code."),
        ("Deduplicate", "Deduplicate facility–program–status combinations before any sheet is built."),
    ]
    for i, (title, body) in enumerate(items):
        y = Inches(1.3) + i * Inches(1.0)
        add_text_box(
            slide, Inches(0.55), y, Inches(0.7), Inches(0.45),
            f"{i+1:02d}", size=18, bold=True, color=ORANGE, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, Inches(1.4), y, Inches(11), Inches(0.35),
            title, size=16, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, Inches(1.4), y + Inches(0.4), Inches(11), Inches(0.35),
            body, size=13, color=SLATE, font=FONT_BODY,
        )


def slide_09(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 9)
    eyebrow(slide, "Step 02")
    title_block(slide, "Constructing Kobo Building Blocks", top=Inches(0.52), size=28)

    cols = [
        ("Survey sheets", ORANGE, [
            "type, name, label, hint",
            "required & required_message",
            "constraint & constraint_message",
            "relevant / skip logic",
            "choice_filter & calculation",
            "appearance (e.g. tables)",
            "enumerator notes / parameters",
        ]),
        ("Choice sheets", LAVENDER, [
            "list_name",
            "name",
            "label",
            "choice_filter",
        ]),
        ("Settings sheets", NAVY_SOFT, [
            "allow_choice_duplicates",
        ]),
    ]
    for i, (title, accent, items) in enumerate(cols):
        x = Inches(0.55) + i * Inches(4.2)
        add_rect(slide, x, Inches(1.35), Inches(3.95), Inches(0.06), accent)
        add_text_box(
            slide, x, Inches(1.6), Inches(3.95), Inches(0.45),
            title, size=18, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        add_multiline(
            slide, x, Inches(2.25), Inches(3.95), Inches(4.3),
            items, size=14, color=INK, bullet=True, space_before=12,
        )


def slide_10(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 10)
    eyebrow(slide, "Step 03")
    title_block(
        slide, "Construction of Kobo Tool Form Builders",
        "Assemble XLSForm-ready survey, choice, and settings sheets",
        top=Inches(0.52), size=26,
    )

    forms = [
        "EmONC Curriculum Tracking Form",
        "Newborn Curriculum Tracking Form",
        "MoH Skills Assessment Checklist",
        "EmONC Knowledge Assessment",
        "Newborn Knowledge Assessment",
    ]
    for i, name in enumerate(forms):
        y = Inches(1.7) + i * Inches(0.9)
        # Number in orange circle-ish via oval
        add_oval(slide, Inches(0.7), y + Inches(0.05), Inches(0.55), Inches(0.55), ORANGE)
        add_text_box(
            slide, Inches(0.7), y + Inches(0.15), Inches(0.55), Inches(0.4),
            f"{i+1:02d}", size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font=FONT_BODY,
        )
        add_text_box(
            slide, Inches(1.55), y + Inches(0.12), Inches(10.5), Inches(0.45),
            name, size=18, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        if i < 4:
            hairline(slide, Inches(1.55), y + Inches(0.75), Inches(10.5))

    add_text_box(
        slide, Inches(0.55), Inches(6.4), Inches(12.2), Inches(0.4),
        "Each builder is generated from shared building blocks — consistent field logic across all tools.",
        size=12, color=SLATE, font=FONT_BODY,
    )


def slide_11(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 11)
    eyebrow(slide, "Step 04")
    title_block(slide, "Validation of Kobo Form Builders", top=Inches(0.52), size=28)

    checks = [
        "Confirm only Active (and correctly programmed) records appear in mentee / survey builders.",
        "Spot-check relevance / skip logic against field names.",
        "Verify choice fields match survey sheet fields (select_one / select_multiple).",
        "Review required fields and choice-filter logic for functionality and errors.",
        "Review required messages, notes, and hints on survey sheets.",
        "Review hide logic — sections appear only after required fields are filled.",
        "Confirm no duplicate facility fields, mentees, or IFMs in choice sheets.",
    ]
    for i, text in enumerate(checks):
        y = Inches(1.25) + i * Inches(0.75)
        add_text_box(
            slide, Inches(0.55), y, Inches(0.7), Inches(0.4),
            f"{i+1:02d}", size=15, bold=True, color=ORANGE, font=FONT_DISPLAY,
        )
        add_text_box(
            slide, Inches(1.4), y + Inches(0.05), Inches(11.2), Inches(0.5),
            text, size=13, color=INK, font=FONT_BODY,
        )


def slide_12(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    paper_bg(slide)
    content_chrome(slide, 12)
    title_block(
        slide,
        "Why a mentee / mentor / facility may be missing",
        "Common exclusion reasons when generating Kobo tools",
        top=Inches(0.28), size=24,
    )

    groups = [
        ("Mentee identity", [
            ("Invalid mentee_id", "Missing, wrong format (2547… / 07…), spaces, <9 digits, or not starting with 1 or 7."),
            ("Inactive mentees", "Status is Inactive or blank, or date_activated is blank."),
            ("Missing from source DBs", "Absent from Mentee Database or IFM Database."),
        ]),
        ("Program flags", [
            ("Wrong Program value", "e.g. Newborn when they should be EmONC or Both."),
            ("EmONC In-person = No", "EmONC mentee flagged as not doing in-person EmONC."),
            ("Newborn flags wrong", "Essential & Comprehensive Newborn both blank/No → allowed = Error!."),
        ]),
        ("Facility data", [
            ("Facility name typos", "Inconsistent spelling (Centre vs Center) breaks list_name / relevance."),
            ("Invalid Facility Code", "Reused codes (e.g. two sites coded 10157) — one dropped as duplicate."),
            ("Code / name mismatch", "Facility code blank or belonging to another site."),
        ]),
    ]

    accents = [ORANGE, LAVENDER, NAVY_SOFT]
    for gi, ((gname, items), accent) in enumerate(zip(groups, accents)):
        x = Inches(0.45) + gi * Inches(4.25)
        add_rect(slide, x, Inches(1.25), Inches(4.0), Inches(0.06), accent)
        add_text_box(
            slide, x, Inches(1.45), Inches(4.0), Inches(0.4),
            gname, size=15, bold=True, color=NAVY, font=FONT_DISPLAY,
        )
        for j, (title, body) in enumerate(items):
            y = Inches(2.05) + j * Inches(1.55)
            add_text_box(
                slide, x, y, Inches(4.0), Inches(0.35),
                title, size=13, bold=True, color=INK, font=FONT_BODY,
            )
            add_text_box(
                slide, x, y + Inches(0.4), Inches(4.0), Inches(1.0),
                body, size=12, color=SLATE, font=FONT_BODY,
            )


def slide_divider(prs, page, label, title, subtitle):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    o1 = add_oval(slide, Inches(9), Inches(-2), Inches(7), Inches(7), NAVY_SOFT)
    set_shape_alpha(o1, 40)
    o2 = add_oval(slide, Inches(-3), Inches(4.5), Inches(6), Inches(6), RGBColor(0x0C, 0x1C, 0x28))
    set_shape_alpha(o2, 25)
    add_rect(slide, 0, 0, Inches(0.18), SLIDE_H, ORANGE)

    add_text_box(
        slide, Inches(0.9), Inches(2.3), Inches(11), Inches(0.35),
        label.upper(), size=13, bold=True, color=ORANGE, font=FONT_BODY,
    )
    add_text_box(
        slide, Inches(0.9), Inches(2.85), Inches(11.5), Inches(1.0),
        title, size=36, bold=True, color=WHITE, font=FONT_DISPLAY,
    )
    add_rect(slide, Inches(0.9), Inches(4.0), Inches(1.4), Inches(0.07), ORANGE)
    add_text_box(
        slide, Inches(0.9), Inches(4.3), Inches(10), Inches(0.6),
        subtitle, size=18, color=LAVENDER_SOFT, font=FONT_BODY,
    )
    add_text_box(
        slide, Inches(0.9), Inches(6.55), Inches(3), Inches(0.3),
        f"{page}  ·  {TOTAL}", size=11, color=MUTED, font=FONT_BODY,
    )


def slide_13(prs):
    slide_divider(
        prs, 13, "Step 05",
        "Deployment of Kobo Form Builder",
        "Upload validated builders and update form versions in KoboToolbox",
    )


def slide_14(prs):
    slide_divider(
        prs, 14, "Looking ahead",
        "Mentee Mapping in Future",
        "IFM-led mentee mapping using a dedicated Kobo tool",
    )


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_01_title(prs)
    slide_02_journey(prs)
    slide_03(prs)
    slide_04(prs)
    slide_05(prs)
    slide_06(prs)
    slide_07(prs)
    slide_08(prs)
    slide_09(prs)
    slide_10(prs)
    slide_11(prs)
    slide_12(prs)
    slide_13(prs)
    slide_14(prs)

    out = "/workspace/docs/Mentee_Mapping_SOP.pptx"
    prs.save(out)
    print(f"Saved: {out}")
    return out


if __name__ == "__main__":
    build()
