#!/usr/bin/env python3
"""Generate a presentation-ready Mentee Mapping SOP PowerPoint deck."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# --- Jacaranda Health brand palette ---
ORANGE = RGBColor(0xFD, 0x4F, 0x00)
LAVENDER = RGBColor(0x74, 0x78, 0xB6)
LAVENDER_SOFT = RGBColor(0xA9, 0xAE, 0xFF)
NAVY = RGBColor(0x06, 0x12, 0x1B)
NAVY_MID = RGBColor(0x21, 0x2B, 0x35)
NAVY_SOFT = RGBColor(0x2E, 0x35, 0x45)
SLATE = RGBColor(0x5F, 0x6D, 0x7E)
MUTED = RGBColor(0xA5, 0xAC, 0xBA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
OFF_WHITE = RGBColor(0xF7, 0xF8, 0xFA)
SOFT_ORANGE = RGBColor(0xFF, 0xEE, 0xE6)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 14


def set_run_font(run, size=14, bold=False, color=NAVY_MID, name="Calibri"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name


def add_text_box(slide, left, top, width, height, text, size=14, bold=False,
                 color=NAVY_MID, align=PP_ALIGN.LEFT, font="Calibri"):
    shape = slide.shapes.add_textbox(left, top, width, height)
    tf = shape.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run_font(run, size=size, bold=bold, color=color, name=font)
    return shape


def add_multiline(slide, left, top, width, height, lines, size=13,
                  color=NAVY_MID, bold=False, bullet=False, font="Calibri"):
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
        p.space_before = Pt(opts.get("space_before", 6 if i else 0))
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
    return shape


def add_rounded(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    try:
        shape.adjustments[0] = 0.08
    except Exception:
        pass
    shape.line.fill.background()
    return shape


def add_circle(slide, left, top, size, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, size, size)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape


def numbered_badge(slide, left, top, size, num, fill=ORANGE):
    add_circle(slide, left, top, size, fill)
    add_text_box(
        slide, left, top + size * 0.22, size, size * 0.6,
        f"{num:02d}" if isinstance(num, int) else str(num),
        size=max(10, int(size.pt * 0.32)) if hasattr(size, "pt") else 12,
        bold=True, color=WHITE, align=PP_ALIGN.CENTER,
    )


def content_chrome(slide, page, section="Mentee Mapping SOP"):
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.08), ORANGE)
    add_rect(slide, 0, Inches(7.15), SLIDE_W, Inches(0.35), NAVY)
    add_text_box(
        slide, Inches(0.5), Inches(7.18), Inches(8), Inches(0.28),
        section, size=10, bold=False, color=MUTED,
    )
    add_text_box(
        slide, Inches(11.2), Inches(7.18), Inches(1.6), Inches(0.28),
        f"{page}  /  {TOTAL}", size=10, bold=False, color=MUTED,
        align=PP_ALIGN.RIGHT,
    )


def section_title(slide, title, subtitle=None, top=Inches(0.35)):
    add_text_box(
        slide, Inches(0.55), top, Inches(12.2), Inches(0.55),
        title, size=28, bold=True, color=NAVY,
    )
    if subtitle:
        add_text_box(
            slide, Inches(0.55), top + Inches(0.5), Inches(12.2), Inches(0.35),
            subtitle, size=14, bold=False, color=SLATE,
        )


# ---------------------------------------------------------------------------
# Slides
# ---------------------------------------------------------------------------

def slide_01_title(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    add_rect(slide, 0, 0, Inches(0.22), SLIDE_H, ORANGE)
    add_rect(slide, Inches(0.22), Inches(5.9), SLIDE_W - Inches(0.22), Inches(1.6), NAVY_SOFT)

    # Decorative soft band
    add_rect(slide, Inches(10.8), 0, Inches(2.53), SLIDE_H, RGBColor(0x0C, 0x1A, 0x26))

    add_text_box(
        slide, Inches(0.9), Inches(1.85), Inches(11), Inches(0.4),
        "STANDARD OPERATING PROCEDURE", size=13, bold=True, color=ORANGE,
    )
    add_text_box(
        slide, Inches(0.9), Inches(2.35), Inches(11.5), Inches(1.1),
        "Mentee Mapping SOP", size=44, bold=True, color=WHITE,
    )
    add_text_box(
        slide, Inches(0.9), Inches(3.5), Inches(10), Inches(0.55),
        "From the Mentee Database to Kobo Tool Updates", size=20,
        bold=False, color=LAVENDER_SOFT,
    )
    add_rect(slide, Inches(0.9), Inches(4.25), Inches(1.2), Inches(0.06), ORANGE)

    add_text_box(
        slide, Inches(0.9), Inches(6.25), Inches(6), Inches(0.35),
        "Jacaranda Health  ·  MENTORS Program", size=13, bold=False, color=MUTED,
    )
    add_text_box(
        slide, Inches(8.5), Inches(6.25), Inches(4), Inches(0.35),
        "Data Quality  ·  Automation  ·  Scale", size=13,
        bold=False, color=MUTED, align=PP_ALIGN.RIGHT,
    )


def slide_02_journey(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 2)
    section_title(slide, "Where did we come from?", "Evolution of mentee mapping approaches")

    phases = [
        ("01", "Facility Level", "Tracked mentorship at facility level — not at mentee level.", ORANGE),
        ("02", "Random Mapping", "IFMs keyed in mentee details on Kobo with activities undertaken.", LAVENDER),
        ("03", "PO-led Mapping", "Preloaded mentee names on Kobo so IFMs simply select names.", LAVENDER),
        ("04", "Facility-led\n(Proposed)", "IFM-led mentee mapping via a dedicated Kobo tool — future state.", ORANGE),
    ]

    add_rect(slide, Inches(0.9), Inches(2.55), Inches(11.5), Inches(0.04), MUTED)

    card_w = Inches(2.75)
    gap = Inches(0.25)
    start_x = Inches(0.7)
    for i, (num, title, body, accent) in enumerate(phases):
        x = start_x + i * (card_w + gap)
        add_circle(slide, x + Inches(1.1), Inches(2.4), Inches(0.35), accent)
        add_text_box(
            slide, x + Inches(1.1), Inches(2.45), Inches(0.35), Inches(0.28),
            num, size=9, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
        )
        add_rounded(slide, x, Inches(3.05), card_w, Inches(3.5), WHITE)
        add_rect(slide, x, Inches(3.05), card_w, Inches(0.08), accent)
        add_text_box(
            slide, x + Inches(0.2), Inches(3.35), card_w - Inches(0.35), Inches(0.95),
            title, size=15, bold=True, color=NAVY,
        )
        add_text_box(
            slide, x + Inches(0.2), Inches(4.4), card_w - Inches(0.35), Inches(1.8),
            body, size=12, bold=False, color=SLATE,
        )


def approach_detail_slide(prs, page, title, eyebrow, paragraphs, callout=None, callout_title=None):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, page)
    add_text_box(
        slide, Inches(0.55), Inches(0.3), Inches(12), Inches(0.3),
        eyebrow, size=11, bold=True, color=ORANGE,
    )
    section_title(slide, title, top=Inches(0.5))

    y = Inches(1.35)
    body_w = Inches(8.3) if callout else Inches(12.2)
    for para in paragraphs:
        lines_est = max(1, len(para) // 90 + 1)
        h = Inches(0.32 + lines_est * 0.26)
        add_multiline(
            slide, Inches(0.55), y, body_w, h,
            [para], size=14, color=NAVY_MID, bullet=True,
        )
        y += h + Inches(0.1)

    if callout:
        add_rounded(slide, Inches(9.15), Inches(1.35), Inches(3.6), Inches(5.0), WHITE)
        add_rect(slide, Inches(9.15), Inches(1.35), Inches(0.1), Inches(5.0), ORANGE)
        if callout_title:
            add_text_box(
                slide, Inches(9.5), Inches(1.6), Inches(3.05), Inches(0.4),
                callout_title, size=13, bold=True, color=ORANGE,
            )
            cy = Inches(2.15)
        else:
            cy = Inches(1.65)
        add_multiline(
            slide, Inches(9.5), cy, Inches(3.05), Inches(3.9),
            callout, size=13, color=NAVY_MID, bullet=True,
        )


def slide_03_facility(prs):
    approach_detail_slide(
        prs, 3,
        "Facility Level Mapping Approach",
        "APPROACH 01  ·  2018–2023",
        [
            "At the inception of the MENTORS program, data was tracked at facility level.",
            "If a mentorship session — e.g. a CME on AMTSL — took place in a facility, we assumed that all HCWs in that facility were trained on that module.",
            "When we say we trained 7,441 HCWs in the pre-cohort model (2018–2023), it is an estimate based on HCWs working in the maternity wing of partner facilities at that time.",
            "This method was not very accurate — HCWs attrited through retirements, promotions, transfers, or lack of participation.",
        ],
        callout_title="Key takeaway",
        callout=[
            "Facility-level counts were estimates, not individual reach.",
            "Attrition and non-participation inflated reported coverage.",
            "Drove the shift to mentee-level tracking.",
        ],
    )


def slide_04_random(prs):
    approach_detail_slide(
        prs, 4,
        "Random Mapping Approach",
        "APPROACH 02  ·  Mentee-level pivot",
        [
            "JH pivoted to mentee-level tracking of MENTORS Program reach.",
            "IFMs keyed in mentee details: select facility → enter mentee name → enter phone number (mentee_id) → select activities participated in.",
            "This was an improvement over facility-level assumptions.",
            "Key limitation: heavy reliance on IFM memory and accuracy. Errors in mentee_id and inconsistent phone numbers limited reliability as a unique identifier.",
        ],
        callout_title="Limitation",
        callout=[
            "Manual entry of names & phone numbers.",
            "Duplicate / mistyped mentee_ids.",
            "Phone number unreliable as unique ID.",
            "Data quality depended on IFM recall.",
        ],
    )


def slide_05_po_led(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 5)
    add_text_box(
        slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.28),
        "APPROACH 03  ·  Current state", size=11, bold=True, color=ORANGE,
    )
    section_title(slide, "PO-led Mentee Mapping Approach", top=Inches(0.48))

    bullets = [
        "POs visit facilities and map HCWs eligible for the MENTORS Program.",
        "Mapped mentee data is used to preload mentee details on Kobo before data collection.",
        "Immensely improved mentorship data quality — phone number (mentee_id) became a reliable unique identifier.",
        "Hybrid program need: WhatsApp numbers now collected to supplement mentee_id, linking in-person mentorship to virtual DELTA.",
        "Vision: a mentee can complete the curriculum entirely in-person, or take some modules virtually via DELTA (hybrid).",
    ]
    y = Inches(1.25)
    for b in bullets:
        add_multiline(slide, Inches(0.55), y, Inches(12.2), Inches(0.7), [b], size=14, color=NAVY_MID, bullet=True)
        y += Inches(0.72)

    add_rounded(slide, Inches(0.55), Inches(5.85), Inches(12.2), Inches(0.95), SOFT_ORANGE)
    add_text_box(
        slide, Inches(0.8), Inches(6.05), Inches(11.7), Inches(0.55),
        "Impact: Preloading mentee details on Kobo significantly increased the reliability of mentee_id and overall data quality.",
        size=13, bold=False, color=NAVY,
    )


def slide_06_problem(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 6)
    section_title(slide, "What was the problem?", "Why automation became necessary")

    problems = [
        ("Mentee-level tracking", "Need to track mentorship at the mentee level — not only at facility level."),
        ("Field data errors", "Inaccurate mentee data entered by IFMs during data collection in the field."),
        ("Manual preloading", "Preloading mentee details into Kobo improved quality, but remained manual and error-prone."),
        ("Painful updates", "Mentee attrition is expected; keeping Kobo Tools up to date was a painful, ongoing process."),
    ]
    positions = [
        (Inches(0.55), Inches(1.45)),
        (Inches(6.85), Inches(1.45)),
        (Inches(0.55), Inches(4.0)),
        (Inches(6.85), Inches(4.0)),
    ]
    for (title, body), (x, y) in zip(problems, positions):
        add_rounded(slide, x, y, Inches(5.95), Inches(2.15), WHITE)
        add_rect(slide, x, y, Inches(0.1), Inches(2.15), ORANGE)
        add_text_box(slide, x + Inches(0.35), y + Inches(0.35), Inches(5.3), Inches(0.45),
                     title, size=16, bold=True, color=NAVY)
        add_text_box(slide, x + Inches(0.35), y + Inches(0.95), Inches(5.3), Inches(0.9),
                     body, size=13, bold=False, color=SLATE)


def slide_07_process(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 7)
    section_title(slide, "Kobo Tool Update Process", "Five steps from database sync to deployed forms")

    steps = [
        ("01", "Sync Databases", "Mentee & IFM databases synced, cleaned, and filtered for valid records."),
        ("02", "Building Blocks", "Reusable intermediate sheets: types, names, labels, relevance, calculations, choices."),
        ("03", "Form Builders", "Assemble XLSForm-ready survey, choice, and settings sheets."),
        ("04", "Validation", "Confirm builders are complete, filtered, and logically consistent."),
        ("05", "Deployment", "Upload validated builders and update form versions in KoboToolbox."),
    ]
    for i, (num, title, body) in enumerate(steps):
        y = Inches(1.3) + i * Inches(1.05)
        add_rounded(slide, Inches(0.55), y, Inches(12.2), Inches(0.92), WHITE)
        fill = ORANGE if i % 2 == 0 else LAVENDER
        add_circle(slide, Inches(0.8), y + Inches(0.2), Inches(0.52), fill)
        add_text_box(
            slide, Inches(0.8), y + Inches(0.32), Inches(0.52), Inches(0.32),
            num, size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
        )
        add_text_box(
            slide, Inches(1.6), y + Inches(0.18), Inches(4), Inches(0.35),
            title, size=16, bold=True, color=NAVY,
        )
        add_text_box(
            slide, Inches(1.6), y + Inches(0.5), Inches(10.5), Inches(0.35),
            body, size=13, bold=False, color=SLATE,
        )


def slide_08_sync(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 8)
    add_text_box(
        slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.28),
        "STEP 01", size=11, bold=True, color=ORANGE,
    )
    section_title(slide, "Syncing of Mentor-Mentee Database", top=Inches(0.48))

    items = [
        ("Pull latest records", "Bring the newest mentee and IFM records into the spreadsheet."),
        ("Clean for Kobo", "Clean names, IDs, counties, and facilities for Kobo compatibility."),
        ("Normalize values", "Normalize status (Active / Inactive) and program (MENTORS, Newborn, Both)."),
        ("Drop incomplete rows", "Remove rows missing ID, name, county, facility, or facility code."),
        ("Deduplicate", "Deduplicate facility–program–status combinations before any sheet is built."),
    ]
    for i, (title, body) in enumerate(items):
        y = Inches(1.25) + i * Inches(1.0)
        add_rounded(slide, Inches(0.55), y, Inches(12.2), Inches(0.88), WHITE)
        add_rect(slide, Inches(0.55), y, Inches(0.1), Inches(0.88), ORANGE if i % 2 == 0 else LAVENDER)
        add_text_box(slide, Inches(0.9), y + Inches(0.12), Inches(11.5), Inches(0.3),
                     title, size=14, bold=True, color=NAVY)
        add_text_box(slide, Inches(0.9), y + Inches(0.45), Inches(11.5), Inches(0.35),
                     body, size=13, bold=False, color=SLATE)


def slide_09_building_blocks(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 9)
    add_text_box(
        slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.28),
        "STEP 02", size=11, bold=True, color=ORANGE,
    )
    section_title(slide, "Constructing Kobo Building Blocks", top=Inches(0.48))

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
        add_rounded(slide, x, Inches(1.3), Inches(3.95), Inches(5.4), WHITE)
        add_rect(slide, x, Inches(1.3), Inches(3.95), Inches(0.7), accent)
        add_text_box(slide, x + Inches(0.25), Inches(1.45), Inches(3.45), Inches(0.4),
                     title, size=16, bold=True, color=WHITE)
        add_multiline(
            slide, x + Inches(0.25), Inches(2.25), Inches(3.45), Inches(4.2),
            items, size=13, color=NAVY_MID, bullet=True,
        )


def slide_10_form_builders(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 10)
    add_text_box(
        slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.28),
        "STEP 03", size=11, bold=True, color=ORANGE,
    )
    section_title(
        slide, "Construction of Kobo Tool Form Builders",
        "Assemble XLSForm-ready survey, choice, and settings sheets",
        top=Inches(0.48),
    )

    forms = [
        ("01", "EmONC Curriculum\nTracking Form"),
        ("02", "Newborn Curriculum\nTracking Form"),
        ("03", "MoH Skills\nAssessment Checklist"),
        ("04", "EmONC Knowledge\nAssessment"),
        ("05", "Newborn Knowledge\nAssessment"),
    ]
    for i, (num, name) in enumerate(forms):
        x = Inches(0.55) + i * Inches(2.5)
        add_rounded(slide, x, Inches(2.0), Inches(2.3), Inches(3.8), WHITE)
        fill = ORANGE if i % 2 == 0 else LAVENDER
        add_circle(slide, x + Inches(0.75), Inches(2.5), Inches(0.8), fill)
        add_text_box(
            slide, x + Inches(0.75), Inches(2.72), Inches(0.8), Inches(0.4),
            num, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
        )
        add_text_box(
            slide, x + Inches(0.15), Inches(3.6), Inches(2.0), Inches(1.5),
            name, size=14, bold=True, color=NAVY, align=PP_ALIGN.CENTER,
        )

    add_text_box(
        slide, Inches(0.55), Inches(6.15), Inches(12.2), Inches(0.5),
        "Each builder is generated from the shared building blocks — ensuring consistent field logic across all tools.",
        size=13, bold=False, color=SLATE,
    )


def slide_11_validation(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 11)
    add_text_box(
        slide, Inches(0.55), Inches(0.28), Inches(12), Inches(0.28),
        "STEP 04", size=11, bold=True, color=ORANGE,
    )
    section_title(slide, "Validation of Kobo Form Builders", top=Inches(0.48))

    checks = [
        "Confirm only Active (and correctly programmed) records appear in mentee / survey builders.",
        "Spot-check relevance / skip logic against field names.",
        "Verify choice fields match survey sheet fields (select_one / select_multiple).",
        "Review required fields and choice-filter logic for functionality and errors.",
        "Review required messages, notes, and hints on survey sheets.",
        "Review hide logic — sections appear only after required fields are filled.",
        "Confirm no duplicate facility fields, mentees, or IFMs in choice sheets.",
    ]
    # Compact single-column checklist — denser, balanced
    for i, text in enumerate(checks):
        y = Inches(1.2) + i * Inches(0.78)
        add_rounded(slide, Inches(0.55), y, Inches(12.2), Inches(0.68), WHITE)
        fill = ORANGE if i % 2 == 0 else LAVENDER
        add_circle(slide, Inches(0.75), y + Inches(0.12), Inches(0.44), fill)
        add_text_box(
            slide, Inches(0.75), y + Inches(0.2), Inches(0.44), Inches(0.3),
            f"{i+1:02d}", size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER,
        )
        add_text_box(
            slide, Inches(1.45), y + Inches(0.18), Inches(11.0), Inches(0.4),
            text, size=13, bold=False, color=NAVY_MID,
        )


def slide_12_missing(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, OFF_WHITE)
    content_chrome(slide, 12)
    section_title(
        slide,
        "Why a mentee / mentor / facility may be missing",
        "Common exclusion reasons when generating Kobo tools",
        top=Inches(0.25),
    )

    groups = [
        ("Mentee identity", ORANGE, [
            ("Invalid mentee_id", "Missing, wrong format (2547… / 07…), spaces, <9 digits, or not starting with 1 or 7."),
            ("Inactive mentees", "Status is Inactive or blank, or date_activated is blank."),
            ("Missing from source DBs", "Mentee or facility absent from Mentee Database or IFM Database."),
        ]),
        ("Program flags", LAVENDER, [
            ("Wrong Program value", "e.g. Newborn when they should be EmONC or Both."),
            ("EmONC In-person = No", "EmONC mentee flagged as not doing in-person EmONC."),
            ("Newborn flags wrong", "Essential & Comprehensive Newborn both blank/No → allowed = Error!."),
        ]),
        ("Facility data", NAVY_SOFT, [
            ("Facility name typos", "Inconsistent spelling (Centre vs Center) breaks list_name / relevance."),
            ("Invalid Facility Code", "Reused codes (e.g. two sites coded 10157) — one dropped as duplicate."),
            ("Code / name mismatch", "Facility code blank or belonging to another site."),
        ]),
    ]

    for gi, (gname, accent, items) in enumerate(groups):
        x = Inches(0.45) + gi * Inches(4.25)
        add_rounded(slide, x, Inches(1.2), Inches(4.05), Inches(5.55), WHITE)
        add_rect(slide, x, Inches(1.2), Inches(4.05), Inches(0.55), accent)
        add_text_box(
            slide, x + Inches(0.2), Inches(1.32), Inches(3.65), Inches(0.35),
            gname, size=14, bold=True, color=WHITE,
        )
        for j, (title, body) in enumerate(items):
            y = Inches(1.95) + j * Inches(1.5)
            add_text_box(slide, x + Inches(0.2), y, Inches(3.65), Inches(0.35),
                         title, size=13, bold=True, color=NAVY)
            add_text_box(slide, x + Inches(0.2), y + Inches(0.4), Inches(3.65), Inches(0.95),
                         body, size=11, bold=False, color=SLATE)


def slide_section_divider(prs, page, title, subtitle, step_label=None):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_rect(slide, 0, 0, SLIDE_W, SLIDE_H, NAVY)
    add_rect(slide, 0, 0, Inches(0.22), SLIDE_H, ORANGE)
    add_rect(slide, Inches(10.8), 0, Inches(2.53), SLIDE_H, RGBColor(0x0C, 0x1A, 0x26))

    if step_label:
        add_text_box(
            slide, Inches(0.9), Inches(2.35), Inches(11), Inches(0.4),
            step_label, size=14, bold=True, color=ORANGE,
        )
        ty = Inches(2.85)
    else:
        ty = Inches(2.7)
    add_text_box(
        slide, Inches(0.9), ty, Inches(11.5), Inches(1.0),
        title, size=36, bold=True, color=WHITE,
    )
    add_rect(slide, Inches(0.9), ty + Inches(1.05), Inches(1.2), Inches(0.06), ORANGE)
    if subtitle:
        add_text_box(
            slide, Inches(0.9), ty + Inches(1.3), Inches(10), Inches(0.7),
            subtitle, size=18, bold=False, color=LAVENDER_SOFT,
        )
    add_text_box(
        slide, Inches(0.9), Inches(6.6), Inches(4), Inches(0.3),
        f"{page}  /  {TOTAL}", size=12, bold=False, color=MUTED,
    )


def slide_13_deployment(prs):
    slide_section_divider(
        prs, 13,
        "Deployment of Kobo Form Builder",
        "Upload validated builders and update form versions in KoboToolbox",
        step_label="STEP 05",
    )


def slide_14_future(prs):
    slide_section_divider(
        prs, 14,
        "Mentee Mapping in Future",
        "IFM-led mentee mapping using a dedicated Kobo tool",
        step_label="LOOKING AHEAD",
    )


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_01_title(prs)
    slide_02_journey(prs)
    slide_03_facility(prs)
    slide_04_random(prs)
    slide_05_po_led(prs)
    slide_06_problem(prs)
    slide_07_process(prs)
    slide_08_sync(prs)
    slide_09_building_blocks(prs)
    slide_10_form_builders(prs)
    slide_11_validation(prs)
    slide_12_missing(prs)
    slide_13_deployment(prs)
    slide_14_future(prs)

    out = "/workspace/Mentee_Mapping_SOP.pptx"
    prs.save(out)
    print(f"Saved: {out}")
    return out


if __name__ == "__main__":
    build()
