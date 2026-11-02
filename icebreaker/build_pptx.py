#!/usr/bin/env python3
"""Build a short Spot-the-Difference icebreaker PowerPoint."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches, Pt, Emu

ROOT = Path(__file__).resolve().parent
ORIG = ROOT / "images" / "original.jpg"
EDITED = ROOT / "images" / "edited.jpg"
OUT = ROOT / "artifacts" / "Spot_the_Difference_Icebreaker.pptx"

# Visual direction: dark archival / wartime documentary (not purple/cream AI defaults)
BG = RGBColor(0x14, 0x14, 0x16)
FG = RGBColor(0xF2, 0xEB, 0xDC)
MUTED = RGBColor(0xA8, 0xA0, 0x90)
ACCENT = RGBColor(0xC4, 0x5A, 0x3A)  # muted brick red
CARD = RGBColor(0x1E, 0x1E, 0x22)
RULE = RGBColor(0x3A, 0x38, 0x34)


def set_slide_bg(slide, color: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_textbox(
    slide,
    left,
    top,
    width,
    height,
    text,
    *,
    size=18,
    bold=False,
    color=FG,
    align=PP_ALIGN.LEFT,
    font_name="Georgia",
):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = align
    run = p.runs[0]
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font_name
    return box


def add_bullets(slide, left, top, width, height, items, *, size=18, color=FG):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = item
        p.level = 0
        p.space_after = Pt(10)
        run = p.runs[0]
        run.font.size = Pt(size)
        run.font.color.rgb = color
        run.font.name = "Calibri"
    return box


def fit_picture(slide, path, left, top, max_w, max_h):
    """Place image letterboxed within a max box, preserving aspect ratio."""
    from PIL import Image

    with Image.open(path) as im:
        iw, ih = im.size
    scale = min(max_w / iw, max_h / ih)
    w = int(iw * scale)
    h = int(ih * scale)
    # Center within the max box
    x = left + (max_w - w) // 2
    y = top + (max_h - h) // 2
    slide.shapes.add_picture(str(path), x, y, width=w, height=h)
    return x, y, w, h


def build() -> Path:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    # --- 1. Title ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.8),
        Inches(2.0),
        Inches(11.5),
        Inches(1.2),
        "Spot the Difference",
        size=54,
        bold=True,
        align=PP_ALIGN.CENTER,
        font_name="Georgia",
    )
    add_textbox(
        s,
        Inches(1.5),
        Inches(3.3),
        Inches(10.3),
        Inches(0.6),
        "Icebreaker  ·  Original vs. Edited Historical Photo",
        size=22,
        color=MUTED,
        align=PP_ALIGN.CENTER,
        font_name="Calibri",
    )
    # accent rule
    shape = s.shapes.add_shape(
        1,  # rectangle
        Inches(5.4),
        Inches(4.1),
        Inches(2.5),
        Inches(0.06),
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = ACCENT
    shape.line.fill.background()
    add_textbox(
        s,
        Inches(2),
        Inches(4.5),
        Inches(9.3),
        Inches(0.8),
        "Two photos. Same moment. What changed?",
        size=20,
        color=FG,
        align=PP_ALIGN.CENTER,
        font_name="Georgia",
    )

    # --- 2. How to play ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.8),
        Inches(0.5),
        Inches(11.5),
        Inches(0.7),
        "How we play",
        size=36,
        bold=True,
        font_name="Georgia",
    )
    add_bullets(
        s,
        Inches(1.2),
        Inches(1.8),
        Inches(10.5),
        Inches(4.5),
        [
            "1.  Pair up or form small groups (2–4 people).",
            "2.  You’ll see Photo A, then Photo B — both look almost identical.",
            "3.  You have 60 seconds to list every difference you notice.",
            "4.  Share your finds with the room — no phones, trust your eyes.",
            "5.  We’ll reveal the edits and the (true) historical story behind them.",
        ],
        size=24,
        color=FG,
    )
    add_textbox(
        s,
        Inches(0.8),
        Inches(6.5),
        Inches(11.5),
        Inches(0.4),
        "Tip: look closely at people, objects on wrists, and the sky.",
        size=16,
        color=MUTED,
        font_name="Calibri",
    )

    # --- 3. Photo A (original) ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.5),
        Inches(0.25),
        Inches(8),
        Inches(0.5),
        "Photo A  —  study this first",
        size=24,
        bold=True,
        font_name="Georgia",
    )
    add_textbox(
        s,
        Inches(0.5),
        Inches(0.7),
        Inches(12),
        Inches(0.35),
        "Raising a Flag over the Reichstag, Berlin — May 1945  (photographer: Yevgeny Khaldei)",
        size=14,
        color=MUTED,
        font_name="Calibri",
    )
    fit_picture(s, ORIG, Inches(1.2), Inches(1.15), Inches(10.9), Inches(5.9))

    # --- 4. Photo B (edited) ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.5),
        Inches(0.25),
        Inches(10),
        Inches(0.5),
        "Photo B  —  find what changed",
        size=24,
        bold=True,
        font_name="Georgia",
    )
    add_textbox(
        s,
        Inches(0.5),
        Inches(0.7),
        Inches(12),
        Inches(0.35),
        "60 seconds on the clock. Write down every difference you see.",
        size=14,
        color=ACCENT,
        font_name="Calibri",
    )
    fit_picture(s, EDITED, Inches(1.2), Inches(1.15), Inches(10.9), Inches(5.9))

    # --- 5. Side by side ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.5),
        Inches(0.25),
        Inches(12),
        Inches(0.45),
        "Side by side  —  compare carefully",
        size=24,
        bold=True,
        font_name="Georgia",
    )
    # labels
    add_textbox(
        s,
        Inches(0.4),
        Inches(0.85),
        Inches(6),
        Inches(0.35),
        "A · Original",
        size=16,
        color=MUTED,
        align=PP_ALIGN.CENTER,
        font_name="Calibri",
    )
    add_textbox(
        s,
        Inches(6.9),
        Inches(0.85),
        Inches(6),
        Inches(0.35),
        "B · Edited (as shared)",
        size=16,
        color=MUTED,
        align=PP_ALIGN.CENTER,
        font_name="Calibri",
    )
    fit_picture(s, ORIG, Inches(0.35), Inches(1.25), Inches(6.2), Inches(5.8))
    fit_picture(s, EDITED, Inches(6.8), Inches(1.25), Inches(6.2), Inches(5.8))

    # --- 6. Reveal ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.8),
        Inches(0.5),
        Inches(11.5),
        Inches(0.7),
        "The two edits",
        size=36,
        bold=True,
        font_name="Georgia",
    )
    # Two callout panels
    for i, (title, body, left) in enumerate(
        [
            (
                "1. The wristwatch",
                "On the supporting soldier’s right hand, "
                "a wristwatch was removed. Two watches could look like looting — "
                "so the published version cleaned that detail up.",
                Inches(0.8),
            ),
            (
                "2. Extra smoke",
                "Darker, heavier smoke was added in the sky "
                "to make the victory feel more dramatic — "
                "a more “glorious” battlefield atmosphere.",
                Inches(7.0),
            ),
        ]
    ):
        card = s.shapes.add_shape(1, left, Inches(1.6), Inches(5.4), Inches(3.6))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD
        card.line.color.rgb = RULE
        add_textbox(
            s,
            left + Inches(0.35),
            Inches(1.9),
            Inches(4.7),
            Inches(0.6),
            title,
            size=22,
            bold=True,
            color=ACCENT,
            font_name="Georgia",
        )
        add_textbox(
            s,
            left + Inches(0.35),
            Inches(2.7),
            Inches(4.7),
            Inches(2.2),
            body,
            size=18,
            color=FG,
            font_name="Calibri",
        )
    add_textbox(
        s,
        Inches(0.8),
        Inches(5.6),
        Inches(11.5),
        Inches(1.2),
        "Discussion: Why might publishers edit a “documentary” photo? "
        "What should we notice when images travel through media today?",
        size=18,
        color=MUTED,
        font_name="Georgia",
    )

    # --- 7. Close ---
    s = prs.slides.add_slide(blank)
    set_slide_bg(s, BG)
    add_textbox(
        s,
        Inches(0.8),
        Inches(2.2),
        Inches(11.5),
        Inches(1.0),
        "Look twice. Ask what changed — and why.",
        size=32,
        bold=True,
        align=PP_ALIGN.CENTER,
        font_name="Georgia",
    )
    add_textbox(
        s,
        Inches(1.5),
        Inches(3.5),
        Inches(10.3),
        Inches(0.8),
        "Thanks for playing. Go around: one difference you spotted, "
        "or one question this raised for you.",
        size=18,
        color=MUTED,
        align=PP_ALIGN.CENTER,
        font_name="Calibri",
    )

    prs.save(OUT)
    return OUT


if __name__ == "__main__":
    path = build()
    print(f"Wrote {path}")
