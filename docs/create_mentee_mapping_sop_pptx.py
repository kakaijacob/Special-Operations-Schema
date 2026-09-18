#!/usr/bin/env python3
"""
Mentee Mapping SOP — "The Pin"
A cartographic, typography-led deck. Structure only where it earns its place.
Animations via OOXML (fade / wipe / staggered reveal).
"""

from __future__ import annotations

import copy
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

# --- Palette: forest ink + Jacaranda signal orange (no purple template) ---
INK = RGBColor(0x0D, 0x1F, 0x1A)
TEAL = RGBColor(0x2A, 0x6B, 0x5A)
ORANGE = RGBColor(0xFD, 0x4F, 0x00)
MIST = RGBColor(0xEE, 0xF2, 0xEF)
SOFT = RGBColor(0x5C, 0x6E, 0x66)
MUTED = RGBColor(0x8A, 0x9A, 0x92)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
WHITE_SOFT = RGBColor(0xD8, 0xE0, 0xDB)

FONT_DISPLAY = "Source Serif 4"
FONT_BODY = "DM Sans"
FONT_DATA = "JetBrains Mono"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 14
ASSETS = Path("/workspace/docs/assets")

NSMAP = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def _font(run, size, bold, color, name):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name
    rPr = run._r.get_or_add_rPr()
    for tag in ("latin", "ea", "cs"):
        el = rPr.find(qn(f"a:{tag}"))
        if el is None:
            el = etree.SubElement(rPr, qn(f"a:{tag}"))
        el.set("typeface", name)


def textbox(slide, left, top, width, height, text, *, size=16, bold=False,
            color=INK, align=PP_ALIGN.LEFT, font=FONT_BODY, anchor=None):
    sh = slide.shapes.add_textbox(left, top, width, height)
    tf = sh.text_frame
    tf.word_wrap = True
    if anchor is not None:
        tf.anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    _font(r, size, bold, color, font)
    return sh


def multiline(slide, left, top, width, height, lines, *, size=15,
              color=INK, font=FONT_BODY, space_before=10, bullet=False):
    sh = slide.shapes.add_textbox(left, top, width, height)
    tf = sh.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, tuple):
            text, opts = item
        else:
            text, opts = item, {}
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_before = Pt(opts.get("space_before", space_before if i else 0))
        r = p.add_run()
        r.text = (("·  " if bullet else "") + text)
        _font(
            r,
            opts.get("size", size),
            opts.get("bold", False),
            opts.get("color", color),
            opts.get("font", font),
        )
    return sh


def rect(slide, left, top, width, height, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def oval(slide, left, top, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, left, top, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def picture(slide, path, left=0, top=0, width=None, height=None):
    width = width or SLIDE_W
    height = height or SLIDE_H
    return slide.shapes.add_picture(str(path), left, top, width=width, height=height)


def page_coord(slide, n, color=MUTED):
    """Tiny coordinate instead of a chrome footer."""
    return textbox(
        slide, Inches(11.6), Inches(7.1), Inches(1.4), Inches(0.28),
        f"{n:02d} / {TOTAL:02d}", size=10, color=color, align=PP_ALIGN.RIGHT,
        font=FONT_DATA,
    )


def pin_dot(slide, left, top, size=Inches(0.18)):
    return oval(slide, left, top, size, size, ORANGE)


# ---------------------------------------------------------------------------
# Animations (OOXML)
# ---------------------------------------------------------------------------

_anim_counter = {"id": 10}


def _next_id():
    _anim_counter["id"] += 1
    return _anim_counter["id"]


def _fade_effect_xml(shape_id: int, dur_ms: int, delay_ms: int, click: bool,
                     effect: str = "fade", preset_id: int = 10):
    """Build one entrance effect node (PowerPoint-compatible)."""
    nid = _next_id()
    node_type = "clickEffect" if click else "withEffect"
    # First withEffect uses delay ms; clickEffect uses indefinite until click
    if click:
        delay_attr = "indefinite"
    else:
        delay_attr = str(max(0, delay_ms))
    return f"""
      <p:par>
        <p:cTn id="{nid}" presetID="{preset_id}" presetClass="entr" presetSubtype="0"
               fill="hold" grpId="0" nodeType="{node_type}">
          <p:stCondLst>
            <p:cond delay="{delay_attr}"/>
          </p:stCondLst>
          <p:childTnLst>
            <p:set>
              <p:cBhvr>
                <p:cTn id="{_next_id()}" dur="1" fill="hold">
                  <p:stCondLst>
                    <p:cond delay="0"/>
                  </p:stCondLst>
                </p:cTn>
                <p:tgtEl>
                  <p:spTgt spid="{shape_id}"/>
                </p:tgtEl>
                <p:attrNameLst>
                  <p:attrName>style.visibility</p:attrName>
                </p:attrNameLst>
              </p:cBhvr>
              <p:to>
                <p:strVal val="visible"/>
              </p:to>
            </p:set>
            <p:animEffect transition="in" filter="{effect}">
              <p:cBhvr>
                <p:cTn id="{_next_id()}" dur="{dur_ms}"/>
                <p:tgtEl>
                  <p:spTgt spid="{shape_id}"/>
                </p:tgtEl>
              </p:cBhvr>
            </p:animEffect>
          </p:childTnLst>
        </p:cTn>
      </p:par>"""


def _ensure_bld_list(slide, shape_ids):
    """Register shapes in cSld/bldLst so PPT treats them as buildable."""
    cSld = slide._element.find(qn("p:cSld"))
    if cSld is None:
        return
    bld = cSld.find(qn("p:bldLst"))
    if bld is None:
        bld = etree.SubElement(cSld, qn("p:bldLst"))
    existing = {el.get("spid") for el in bld.findall(qn("p:bldP"))}
    for sid in shape_ids:
        if str(sid) in existing:
            continue
        el = etree.SubElement(bld, qn("p:bldP"))
        el.set("spid", str(sid))
        el.set("grpId", "0")
        el.set("animBg", "1")


def add_animations(slide, sequence, *, stagger_ms=280, dur_ms=650, on_click=False):
    """
    sequence: list of shapes (or lists of shapes that appear together).
    Auto-staggered fades by default; set on_click=True for presenter reveals.
    """
    if not sequence:
        return

    _anim_counter["id"] = 10
    flat_ids = []
    effects = []
    delay = 0
    for i, item in enumerate(sequence):
        shapes = item if isinstance(item, (list, tuple)) else [item]
        click = bool(on_click and i > 0)
        for sh in shapes:
            if sh is None:
                continue
            sid = sh.shape_id
            flat_ids.append(sid)
            effects.append(
                _fade_effect_xml(sid, dur_ms, 0 if click else delay, click=click)
            )
        if not on_click:
            delay += stagger_ms

    _ensure_bld_list(slide, flat_ids)

    effects_xml = "\n".join(effects)
    timing = etree.fromstring(f"""
    <p:timing xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <p:tnLst>
        <p:par>
          <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
            <p:childTnLst>
              <p:seq concurrent="1" nextAc="seek">
                <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
                  <p:childTnLst>
                    <p:par>
                      <p:cTn id="3" fill="hold">
                        <p:stCondLst>
                          <p:cond delay="0"/>
                        </p:stCondLst>
                        <p:childTnLst>
                          <p:par>
                            <p:cTn id="4" fill="hold">
                              <p:stCondLst>
                                <p:cond delay="0"/>
                              </p:stCondLst>
                              <p:childTnLst>
                                {effects_xml}
                              </p:childTnLst>
                            </p:cTn>
                          </p:par>
                        </p:childTnLst>
                      </p:cTn>
                    </p:par>
                  </p:childTnLst>
                </p:cTn>
                <p:prevCondLst>
                  <p:cond evt="onPrev" delay="0">
                    <p:tgtEl><p:sldTgt/></p:tgtEl>
                  </p:cond>
                </p:prevCondLst>
                <p:nextCondLst>
                  <p:cond evt="onNext" delay="0">
                    <p:tgtEl><p:sldTgt/></p:tgtEl>
                  </p:cond>
                </p:nextCondLst>
              </p:seq>
            </p:childTnLst>
          </p:cTn>
        </p:par>
      </p:tnLst>
    </p:timing>
    """)
    sld = slide._element
    existing = sld.find(qn("p:timing"))
    if existing is not None:
        sld.remove(existing)
    ext = sld.find(qn("p:extLst"))
    if ext is not None:
        ext.addprevious(timing)
    else:
        sld.append(timing)


# ---------------------------------------------------------------------------
# Slides
# ---------------------------------------------------------------------------

def slide_01(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "title_field.png")
    t1 = textbox(s, Inches(0.85), Inches(2.0), Inches(7.5), Inches(0.35),
                 "MENTORS  ·  STANDARD OPERATING PROCEDURE",
                 size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t2 = textbox(s, Inches(0.85), Inches(2.55), Inches(8), Inches(1.4),
                 "Mentee Mapping", size=48, bold=True, color=WHITE, font=FONT_DISPLAY)
    t3 = textbox(s, Inches(0.85), Inches(4.1), Inches(7.5), Inches(0.5),
                 "From the Mentee Database to Kobo Tool Updates",
                 size=18, color=WHITE_SOFT, font=FONT_BODY)
    t4 = textbox(s, Inches(0.85), Inches(6.5), Inches(6), Inches(0.3),
                 "Jacaranda Health", size=13, color=MUTED, font=FONT_BODY)
    add_animations(s, [t1, t2, t3, t4], stagger_ms=320, dur_ms=700)


def slide_02(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "journey_path.png")
    title = textbox(s, Inches(0.7), Inches(0.35), Inches(8), Inches(0.65),
                    "Where we came from", size=32, bold=True, color=INK, font=FONT_DISPLAY)
    sub = textbox(s, Inches(0.7), Inches(0.95), Inches(8), Inches(0.4),
                  "Four ways of seeing reach — until the pin was the mentee.",
                  size=14, color=SOFT, font=FONT_BODY)
    page_coord(s, 2)
    add_animations(s, [title, sub], stagger_ms=400, dur_ms=700)


def _story_slide(prs, page, kicker, title, lead, points, aside=None):
    """Sparse narrative slide — mist ground, type, optional aside."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55), Inches(0.14))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(10), Inches(0.3),
                kicker, size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(11.5), Inches(0.7),
                title, size=30, bold=True, color=INK, font=FONT_DISPLAY)
    lead_sh = textbox(s, Inches(0.7), Inches(1.85), Inches(8.2 if aside else 11.5), Inches(0.9),
                      lead, size=16, color=SOFT, font=FONT_BODY)

    body_w = Inches(8.0) if aside else Inches(11.5)
    pts = multiline(s, Inches(0.7), Inches(2.9), body_w, Inches(3.6),
                    points, size=15, color=INK, bullet=True, space_before=14)

    shapes = [k, t, lead_sh, pts]
    if aside:
        # Thin vertical rule + aside — not a card
        rule = rect(s, Inches(9.3), Inches(2.9), Inches(0.02), Inches(3.2), TEAL)
        a_title = textbox(s, Inches(9.6), Inches(2.9), Inches(3.2), Inches(0.35),
                          aside[0], size=12, bold=True, color=ORANGE, font=FONT_BODY)
        a_body = multiline(s, Inches(9.6), Inches(3.4), Inches(3.2), Inches(2.8),
                           aside[1], size=13, color=SOFT, space_before=10)
        shapes.extend([rule, a_title, a_body])
    page_coord(s, page)
    add_animations(s, shapes, stagger_ms=260, dur_ms=550)
    return s


def slide_03(prs):
    _story_slide(
        prs, 3,
        "2018 — 2023",
        "Facility-level mapping",
        "At the start of MENTORS, reach was counted by place — not by person.",
        [
            "A CME on AMTSL in a facility meant every HCW there was treated as trained.",
            "“7,441 HCWs trained” was an estimate from maternity-wing headcount.",
            "Retirements, transfers, and non-participation quietly inflated coverage.",
        ],
        aside=("What it cost us", [
            "Estimates, not individuals.",
            "Attrition invisible.",
            "No mentee-level truth.",
        ]),
    )


def slide_04(prs):
    _story_slide(
        prs, 4,
        "The pivot",
        "Random mentee mapping",
        "JH moved tracking to the mentee — but the identifier was still improvised.",
        [
            "IFMs selected a facility, typed name + phone (mentee_id), then activities.",
            "Better than facility assumptions — still dependent on memory and keystrokes.",
            "Mistyped phones and alternate numbers broke the unique ID.",
        ],
        aside=("The fracture", [
            "Manual entry.",
            "Duplicate IDs.",
            "Phone ≠ reliable key.",
        ]),
    )


def slide_05(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55), Inches(0.14))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(10), Inches(0.3),
                "Current state", size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.7),
                "PO-led mentee mapping", size=30, bold=True, color=INK, font=FONT_DISPLAY)

    # Three short columns — no boxes
    cols = [
        ("Map", "POs visit facilities and register HCWs eligible for MENTORS."),
        ("Preload", "Mentee details are loaded into Kobo before collection — IFMs select, not invent."),
        ("Link", "WhatsApp numbers now supplement mentee_id so in-person and DELTA connect."),
    ]
    shapes = [k, t]
    for i, (h, b) in enumerate(cols):
        x = Inches(0.7) + i * Inches(4.1)
        rule = rect(s, x, Inches(2.2), Inches(0.5), Inches(0.05), ORANGE if i == 2 else TEAL)
        hh = textbox(s, x, Inches(2.5), Inches(3.7), Inches(0.4),
                     h, size=18, bold=True, color=INK, font=FONT_DISPLAY)
        bb = textbox(s, x, Inches(3.1), Inches(3.7), Inches(1.8),
                     b, size=14, color=SOFT, font=FONT_BODY)
        shapes.extend([rule, hh, bb])

    vision = textbox(
        s, Inches(0.7), Inches(5.5), Inches(12), Inches(0.9),
        "Vision — a mentee finishes entirely in person, or mixes modules on DELTA. Same person. Same pin.",
        size=16, color=INK, font=FONT_BODY,
    )
    shapes.append(vision)
    page_coord(s, 5)
    add_animations(s, shapes, stagger_ms=300, dur_ms=600)


def slide_06(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    t = textbox(s, Inches(0.7), Inches(0.55), Inches(12), Inches(0.7),
                "What forced the change", size=32, bold=True, color=INK, font=FONT_DISPLAY)
    problems = [
        ("Mentee-level truth", "Facility counts could not tell us who was actually mentored."),
        ("Field noise", "IFM-entered names and phones drifted under pressure."),
        ("Manual preload", "Quality jumped — maintenance did not. Spreadsheets broke."),
        ("Attrition lag", "Inactive mentees lingered in tools long after they left."),
    ]
    shapes = [t]
    for i, (h, b) in enumerate(problems):
        y = Inches(1.6) + i * Inches(1.2)
        num = textbox(s, Inches(0.7), y, Inches(0.8), Inches(0.5),
                      f"{i+1:02d}", size=22, bold=True, color=ORANGE, font=FONT_DATA)
        hh = textbox(s, Inches(1.7), y, Inches(10), Inches(0.4),
                     h, size=18, bold=True, color=INK, font=FONT_DISPLAY)
        bb = textbox(s, Inches(1.7), y + Inches(0.4), Inches(10.5), Inches(0.4),
                     b, size=14, color=SOFT, font=FONT_BODY)
        shapes.append([num, hh, bb])
    page_coord(s, 6)
    add_animations(s, shapes, stagger_ms=320, dur_ms=550, on_click=True)


def slide_07(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "process_spine.png")
    t = textbox(s, Inches(2.0), Inches(0.45), Inches(10), Inches(0.6),
                "How the tools stay true", size=30, bold=True, color=INK, font=FONT_DISPLAY)
    sub = textbox(s, Inches(2.0), Inches(1.05), Inches(10), Inches(0.35),
                  "One spine. Five moments between database and deployment.",
                  size=14, color=SOFT, font=FONT_BODY)
    steps = [
        ("Sync", "Mentee + IFM databases — cleaned, normalized, deduplicated."),
        ("Blocks", "Reusable survey / choice / settings fragments."),
        ("Builders", "XLSForm-ready sheets for each Kobo tool."),
        ("Validate", "Active-only, logic-checked, no duplicate choices."),
        ("Deploy", "Upload. Version. Ready for the field."),
    ]
    shapes = [t, sub]
    for i, (h, b) in enumerate(steps):
        y = Inches(1.55) + i * Inches(1.0)
        hh = textbox(s, Inches(2.0), y, Inches(2.2), Inches(0.4),
                     h, size=18, bold=True, color=INK, font=FONT_DISPLAY)
        bb = textbox(s, Inches(4.3), y + Inches(0.05), Inches(8), Inches(0.45),
                     b, size=14, color=SOFT, font=FONT_BODY)
        shapes.append([hh, bb])
    page_coord(s, 7)
    add_animations(s, shapes, stagger_ms=280, dur_ms=500)


def slide_08(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(8), Inches(0.3),
                "Sync", size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.65),
                "Bring the source of truth into one place",
                size=28, bold=True, color=INK, font=FONT_DISPLAY)
    items = [
        ("Pull", "Latest mentee and IFM records into the working sheet."),
        ("Clean", "Names, IDs, counties, facilities — Kobo-safe."),
        ("Normalize", "Status → Active / Inactive. Program → MENTORS / Newborn / Both."),
        ("Drop", "Incomplete rows (missing ID, name, county, facility, or code)."),
        ("Dedupe", "Facility–program–status combinations before anything is built."),
    ]
    shapes = [k, t]
    for i, (h, b) in enumerate(items):
        y = Inches(1.9) + i * Inches(0.9)
        hh = textbox(s, Inches(0.7), y, Inches(2.0), Inches(0.4),
                     h, size=16, bold=True, color=TEAL, font=FONT_BODY)
        bb = textbox(s, Inches(2.9), y, Inches(9.5), Inches(0.5),
                     b, size=15, color=INK, font=FONT_BODY)
        shapes.append([hh, bb])
    page_coord(s, 8)
    add_animations(s, shapes, stagger_ms=240, dur_ms=500)


def slide_09(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(8), Inches(0.3),
                "Building blocks", size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.65),
                "Fragments every form builder shares",
                size=28, bold=True, color=INK, font=FONT_DISPLAY)

    groups = [
        ("Survey", TEAL, [
            "type · name · label · hint",
            "required / messages",
            "relevant · constraint",
            "calculation · choice_filter",
            "appearance · notes",
        ]),
        ("Choices", ORANGE, [
            "list_name",
            "name",
            "label",
            "choice_filter",
        ]),
        ("Settings", INK, [
            "allow_choice_duplicates",
        ]),
    ]
    shapes = [k, t]
    for i, (name, accent, lines) in enumerate(groups):
        x = Inches(0.7) + i * Inches(4.1)
        rule = rect(s, x, Inches(2.0), Inches(1.2), Inches(0.05), accent)
        hh = textbox(s, x, Inches(2.25), Inches(3.7), Inches(0.4),
                     name, size=18, bold=True, color=INK, font=FONT_DISPLAY)
        bb = multiline(s, x, Inches(2.85), Inches(3.7), Inches(3.5),
                       lines, size=14, color=SOFT, space_before=12)
        shapes.extend([rule, hh, bb])
    page_coord(s, 9)
    add_animations(s, shapes, stagger_ms=280, dur_ms=550)


def slide_10(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(8), Inches(0.3),
                "Form builders", size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.65),
                "Five tools. One grammar.",
                size=28, bold=True, color=INK, font=FONT_DISPLAY)
    forms = [
        "EmONC Curriculum Tracking Form",
        "Newborn Curriculum Tracking Form",
        "MoH Skills Assessment Checklist",
        "EmONC Knowledge Assessment",
        "Newborn Knowledge Assessment",
    ]
    shapes = [k, t]
    for i, name in enumerate(forms):
        y = Inches(2.0) + i * Inches(0.85)
        n = textbox(s, Inches(0.7), y, Inches(0.9), Inches(0.45),
                    f"{i+1:02d}", size=18, bold=True, color=ORANGE, font=FONT_DATA)
        nm = textbox(s, Inches(1.8), y, Inches(10), Inches(0.45),
                     name, size=18, bold=True, color=INK, font=FONT_DISPLAY)
        shapes.append([n, nm])
    page_coord(s, 10)
    add_animations(s, shapes, stagger_ms=260, dur_ms=500)


def slide_11(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    pin_dot(s, Inches(0.7), Inches(0.55))
    k = textbox(s, Inches(1.0), Inches(0.48), Inches(8), Inches(0.3),
                "Validate before upload", size=12, bold=True, color=ORANGE, font=FONT_BODY)
    t = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.65),
                "Trust, then deploy",
                size=28, bold=True, color=INK, font=FONT_DISPLAY)
    checks = [
        "Only Active, correctly programmed records in mentee builders",
        "Relevance / skip logic matches field names",
        "Choice lists align with select_one / select_multiple fields",
        "Required fields + choice filters behave as intended",
        "Messages, notes, and hints read cleanly",
        "Hide logic waits for required answers",
        "No duplicate facilities, mentees, or IFMs in choices",
    ]
    shapes = [k, t]
    for i, c in enumerate(checks):
        y = Inches(1.85) + i * Inches(0.68)
        mark = textbox(s, Inches(0.7), y, Inches(0.5), Inches(0.35),
                       "→", size=14, bold=True, color=TEAL, font=FONT_BODY)
        line = textbox(s, Inches(1.3), y, Inches(11.2), Inches(0.45),
                       c, size=14, color=INK, font=FONT_BODY)
        shapes.append([mark, line])
    page_coord(s, 11)
    add_animations(s, shapes, stagger_ms=200, dur_ms=450)


def slide_12(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_mist.png")
    t = textbox(s, Inches(0.7), Inches(0.4), Inches(12), Inches(0.55),
                "When a pin doesn’t appear", size=28, bold=True, color=INK, font=FONT_DISPLAY)
    sub = textbox(s, Inches(0.7), Inches(1.0), Inches(12), Inches(0.35),
                  "Usual reasons a mentee, mentor, or facility is missing from the Kobo tool.",
                  size=14, color=SOFT, font=FONT_BODY)

    groups = [
        ("Identity", [
            "Invalid mentee_id — format, spaces, length, or not starting with 1 / 7",
            "Inactive or blank status / date_activated",
            "Absent from Mentee or IFM database",
        ]),
        ("Program", [
            "Wrong Program (Newborn vs EmONC vs Both)",
            "EmONC In-person = No for an EmONC mentee",
            "Both Newborn in-person flags blank / No → Error!",
        ]),
        ("Facility", [
            "Name typos (Centre vs Center) break relevance",
            "Reused facility codes — one dropped as duplicate",
            "Code blank or mapped to the wrong site",
        ]),
    ]
    shapes = [t, sub]
    for i, (name, lines) in enumerate(groups):
        x = Inches(0.7) + i * Inches(4.15)
        rule = rect(s, x, Inches(1.6), Inches(0.55), Inches(0.05), ORANGE if i == 0 else TEAL)
        hh = textbox(s, x, Inches(1.85), Inches(3.9), Inches(0.4),
                     name, size=16, bold=True, color=INK, font=FONT_DISPLAY)
        bb = multiline(s, x, Inches(2.4), Inches(3.9), Inches(4.2),
                       lines, size=13, color=SOFT, bullet=True, space_before=14)
        shapes.extend([rule, hh, bb])
    page_coord(s, 12)
    add_animations(s, shapes, stagger_ms=300, dur_ms=550)


def slide_13(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "bg_contours_dark.png")
    k = textbox(s, Inches(0.9), Inches(2.6), Inches(10), Inches(0.35),
                "DEPLOY", size=13, bold=True, color=ORANGE, font=FONT_DATA)
    t = textbox(s, Inches(0.9), Inches(3.15), Inches(11), Inches(0.9),
                "Upload the builders.\nVersion the forms. Release to the field.",
                size=32, bold=True, color=WHITE, font=FONT_DISPLAY)
    add_animations(s, [k, t], stagger_ms=400, dur_ms=800)
    page_coord(s, 13, color=WHITE_SOFT)


def slide_14(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    picture(s, ASSETS / "future_field.png")
    k = textbox(s, Inches(0.9), Inches(2.5), Inches(10), Inches(0.35),
                "LOOKING AHEAD", size=13, bold=True, color=ORANGE, font=FONT_DATA)
    t = textbox(s, Inches(0.9), Inches(3.05), Inches(10), Inches(0.8),
                "Mentee mapping, next",
                size=36, bold=True, color=WHITE, font=FONT_DISPLAY)
    b = textbox(s, Inches(0.9), Inches(4.1), Inches(9), Inches(0.7),
                "IFM-led mapping through a dedicated Kobo tool —\nthe pin placed where care happens.",
                size=17, color=WHITE_SOFT, font=FONT_BODY)
    add_animations(s, [k, t, b], stagger_ms=380, dur_ms=750)
    page_coord(s, 14, color=WHITE_SOFT)


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_01(prs)
    slide_02(prs)
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

    out = Path("/workspace/docs/Mentee_Mapping_SOP.pptx")
    prs.save(out)
    print(f"Saved {out} ({len(prs.slides)} slides)")
    return out


if __name__ == "__main__":
    build()
