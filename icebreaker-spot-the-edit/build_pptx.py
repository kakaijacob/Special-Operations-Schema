"""Build the Spot the Edit ice-breaker deck."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUT = ROOT / "Spot_the_Edit_Icebreaker.pptx"

# 16:9
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(0x12, 0x10, 0x0E)
CREAM = RGBColor(0xF3, 0xED, 0xE3)
MUTED = RGBColor(0xA3, 0x9B, 0x90)
RED = RGBColor(0xC4, 0x3A, 0x2F)
CARD = RGBColor(0x1C, 0x19, 0x16)
SOFT = RGBColor(0xD8, 0xCF, 0xC2)


def set_run(run, text, font, size, color, bold=False, italic=False):
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.color.rgb = color
    run.font.bold = bold
    run.font.italic = italic


def textbox(slide, l, t, w, h):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.clear()
    return box, tf


def para(tf, text, font, size, color, bold=False, italic=False, align=PP_ALIGN.LEFT, space_before=0, space_after=0, first=False):
    p = tf.paragraphs[0] if first and tf.paragraphs else tf.add_paragraph()
    if first and tf.paragraphs[0].text == "" and not tf.paragraphs[0].runs:
        p = tf.paragraphs[0]
    p.alignment = align
    p.space_before = Pt(space_before)
    p.space_after = Pt(space_after)
    r = p.add_run()
    set_run(r, text, font, size, color, bold, italic)
    return p


def rect(slide, l, t, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def new_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    rect(slide, 0, 0, SLIDE_W, SLIDE_H, BG)
    return slide


def add_picture_fitted(slide, path, l, t, w, h):
    """Place a picture inside a box, letterboxed, centered."""
    from PIL import Image

    with Image.open(path) as im:
        iw, ih = im.size
    box_aspect = w / h
    img_aspect = iw / ih
    if img_aspect > box_aspect:
        pw = w
        ph = int(w * ih / iw)
        pl = l
        pt = t + (h - ph) // 2
    else:
        ph = h
        pw = int(h * iw / ih)
        pt = t
        pl = l + (w - pw) // 2
    return slide.shapes.add_picture(str(path), pl, pt, pw, ph)


def eyebrow_bar(slide, label):
    rect(slide, Inches(0.7), Inches(0.42), Inches(0.28), Inches(0.08), RED)
    box, tf = textbox(slide, Inches(1.08), Inches(0.32), Inches(8), Inches(0.28))
    para(tf, label.upper(), "Calibri", 12, RED, bold=True, first=True)


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    # ------------------------------------------------------------------
    # 1. Title
    # ------------------------------------------------------------------
    s = new_slide(prs)
    rect(s, 0, 0, Inches(0.14), SLIDE_H, RED)
    box, tf = textbox(s, Inches(0.85), Inches(1.55), Inches(11.5), Inches(0.4))
    para(tf, "ICE BREAKER  ·  5 MINUTES", "Calibri", 14, RED, bold=True, first=True)

    box, tf = textbox(s, Inches(0.85), Inches(2.05), Inches(11.8), Inches(1.6))
    para(tf, "Spot the Edit", "Georgia", 54, CREAM, first=True)

    box, tf = textbox(s, Inches(0.85), Inches(3.55), Inches(10.5), Inches(1.2))
    para(
        tf,
        "Two photographs. One rooftop in Berlin, 1945.\nFind what Soviet editors changed before the picture went public.",
        "Georgia",
        20,
        SOFT,
        first=True,
    )

    box, tf = textbox(s, Inches(0.85), Inches(6.55), Inches(11), Inches(0.4))
    para(tf, "Raising a Flag over the Reichstag  ·  Yevgeny Khaldei  ·  2 May 1945", "Calibri", 13, MUTED, first=True)
    notes(
        s,
        "Welcome people in. Do not explain the history yet. Promise it is a 5-minute game, not a lecture. "
        "Ask them to pair with the person next to them.",
    )

    # ------------------------------------------------------------------
    # 2. How to play
    # ------------------------------------------------------------------
    s = new_slide(prs)
    eyebrow_bar(s, "How we play")
    box, tf = textbox(s, Inches(0.7), Inches(0.75), Inches(11.5), Inches(1.0))
    para(tf, "90 seconds. Two differences.", "Georgia", 36, CREAM, first=True)

    steps = [
        ("01", "Pair up", "Turn to the person next to you. One screen, two pairs of eyes."),
        ("02", "Look twice", "First the original photograph, then the version Soviet editors shared."),
        ("03", "Find two changes", "Same rooftop. Same flag. Two quiet edits. Shout them out when you see them."),
    ]
    lefts = [0.7, 4.75, 8.8]
    for i, ((num, title, body), left) in enumerate(zip(steps, lefts)):
        x = Inches(left)
        rect(s, x, Inches(2.15), Inches(3.7), Inches(3.55), CARD)
        rect(s, x, Inches(2.15), Inches(0.08), Inches(3.55), RED)
        box, tf = textbox(s, x + Inches(0.28), Inches(2.35), Inches(3.2), Inches(0.4))
        para(tf, num, "Calibri", 14, RED, bold=True, first=True)
        box, tf = textbox(s, x + Inches(0.28), Inches(2.85), Inches(3.2), Inches(0.7))
        para(tf, title, "Georgia", 22, CREAM, first=True)
        box, tf = textbox(s, x + Inches(0.28), Inches(3.65), Inches(3.2), Inches(1.6))
        para(tf, body, "Calibri", 15, SOFT, first=True)

    box, tf = textbox(s, Inches(0.7), Inches(6.55), Inches(11.5), Inches(0.4))
    para(tf, "No phones. No zooming in on a second device. Trust your eyes.", "Calibri", 14, MUTED, italic=True, first=True)
    notes(
        s,
        "Read the three steps quickly. Start a 90-second timer after slide 4 (the edited photo) is up, "
        "or after the side-by-side if the group needs it. Do not hint at smoke or the watch.",
    )

    # ------------------------------------------------------------------
    # 3. Original
    # ------------------------------------------------------------------
    s = new_slide(prs)
    add_picture_fitted(s, ASSETS / "01-original.jpg", Inches(0.35), Inches(0.22), Inches(12.63), Inches(6.28))
    box, tf = textbox(s, Inches(0.5), Inches(6.62), Inches(3.4), Inches(0.5))
    para(tf, "THE ORIGINAL", "Calibri", 13, RED, bold=True, first=True)
    box, tf = textbox(s, Inches(3.9), Inches(6.62), Inches(8.9), Inches(0.5))
    para(tf, "Khaldei’s photograph, before the darkroom. Look carefully — then we flip.", "Calibri", 14, MUTED, first=True)
    notes(
        s,
        "Leave this up for about 20 seconds. Ask people to scan the soldier, the flag, the sky, and the people on the right. "
        "Then go to the next slide without commenting.",
    )

    # ------------------------------------------------------------------
    # 4. Edited
    # ------------------------------------------------------------------
    s = new_slide(prs)
    add_picture_fitted(s, ASSETS / "02-soviet-edit.jpg", Inches(0.35), Inches(0.22), Inches(12.63), Inches(6.28))
    box, tf = textbox(s, Inches(0.5), Inches(6.62), Inches(4.4), Inches(0.5))
    para(tf, "SOVIET PRESS VERSION", "Calibri", 13, RED, bold=True, first=True)
    box, tf = textbox(s, Inches(5.0), Inches(6.62), Inches(7.8), Inches(0.5))
    para(tf, "Same frame. Two edits. Timer starts now.", "Calibri", 14, MUTED, first=True)
    notes(
        s,
        "This is the 'Soviet shared' version: slightly more smoke in the sky, and the wristwatch on the supporting "
        "soldier’s right hand is gone. Start the 90-second clock. Collect guesses out loud. Do not confirm yet.",
    )

    # ------------------------------------------------------------------
    # 5. Side by side
    # ------------------------------------------------------------------
    s = new_slide(prs)
    eyebrow_bar(s, "Look again")
    box, tf = textbox(s, Inches(0.7), Inches(0.7), Inches(12), Inches(0.45))
    para(tf, "Original on the left. Soviet edit on the right.", "Georgia", 22, CREAM, first=True)

    photo_top = Inches(1.35)
    photo_h = Inches(5.15)
    photo_w = Inches(5.95)
    gap = Inches(0.25)
    left_x = Inches(0.55)
    right_x = left_x + photo_w + gap
    add_picture_fitted(s, ASSETS / "01-original.jpg", left_x, photo_top, photo_w, photo_h)
    add_picture_fitted(s, ASSETS / "02-soviet-edit.jpg", right_x, photo_top, photo_w, photo_h)

    box, tf = textbox(s, left_x, Inches(6.6), photo_w, Inches(0.4))
    para(tf, "Original", "Calibri", 13, MUTED, align=PP_ALIGN.CENTER, first=True)
    box, tf = textbox(s, right_x, Inches(6.6), photo_w, Inches(0.4))
    para(tf, "Soviet press version", "Calibri", 13, MUTED, align=PP_ALIGN.CENTER, first=True)
    notes(
        s,
        "Give the room another 20–30 seconds if needed. Then take 3–4 shouted answers before revealing.",
    )

    # ------------------------------------------------------------------
    # 6. Reveal
    # ------------------------------------------------------------------
    s = new_slide(prs)
    eyebrow_bar(s, "The two edits")
    box, tf = textbox(s, Inches(0.7), Inches(0.7), Inches(12), Inches(0.5))
    para(tf, "Both changes were made on purpose.", "Georgia", 28, CREAM, first=True)

    # Card 1 — smoke
    rect(s, Inches(0.55), Inches(1.4), Inches(6.0), Inches(5.55), CARD)
    add_picture_fitted(s, ASSETS / "05-sky-original.jpg", Inches(0.75), Inches(1.58), Inches(2.7), Inches(1.85))
    add_picture_fitted(s, ASSETS / "06-sky-edited.jpg", Inches(3.55), Inches(1.58), Inches(2.7), Inches(1.85))
    box, tf = textbox(s, Inches(0.75), Inches(3.48), Inches(2.7), Inches(0.28))
    para(tf, "ORIGINAL SKY", "Calibri", 10, MUTED, bold=True, align=PP_ALIGN.CENTER, first=True)
    box, tf = textbox(s, Inches(3.55), Inches(3.48), Inches(2.7), Inches(0.28))
    para(tf, "ADDED SMOKE", "Calibri", 10, RED, bold=True, align=PP_ALIGN.CENTER, first=True)
    box, tf = textbox(s, Inches(0.8), Inches(3.88), Inches(5.5), Inches(0.4))
    para(tf, "01   More smoke", "Georgia", 22, CREAM, first=True)
    box, tf = textbox(s, Inches(0.8), Inches(4.4), Inches(5.5), Inches(2.2))
    para(
        tf,
        "Editors darkened the sky and thickened the haze over ruined Berlin. The battle looks bigger, harder, more heroic — a victory worth the flag.",
        "Calibri",
        16,
        SOFT,
        first=True,
    )

    # Card 2 — watch
    rect(s, Inches(6.75), Inches(1.4), Inches(6.0), Inches(5.55), CARD)
    add_picture_fitted(s, ASSETS / "03-watch-original.jpg", Inches(6.95), Inches(1.58), Inches(2.7), Inches(1.85))
    add_picture_fitted(s, ASSETS / "04-watch-edited.jpg", Inches(9.75), Inches(1.58), Inches(2.7), Inches(1.85))
    box, tf = textbox(s, Inches(6.95), Inches(3.48), Inches(2.7), Inches(0.28))
    para(tf, "WATCH ON THE RIGHT HAND", "Calibri", 10, MUTED, bold=True, align=PP_ALIGN.CENTER, first=True)
    box, tf = textbox(s, Inches(9.75), Inches(3.48), Inches(2.7), Inches(0.28))
    para(tf, "WATCH REMOVED", "Calibri", 10, RED, bold=True, align=PP_ALIGN.CENTER, first=True)
    box, tf = textbox(s, Inches(7.0), Inches(3.88), Inches(5.5), Inches(0.4))
    para(tf, "02   The wristwatch", "Georgia", 22, CREAM, first=True)
    box, tf = textbox(s, Inches(7.0), Inches(4.4), Inches(5.5), Inches(2.2))
    para(
        tf,
        "The supporting soldier’s right hand wore a bright watch. Extra watches looked like looting. The published print quietly erased it.",
        "Calibri",
        16,
        SOFT,
        first=True,
    )
    notes(
        s,
        "Confirm the two answers. Celebrate people who found the watch — it is easy to miss. "
        "Mention that these are the real historical edits Khaldei and Soviet censors made: extra smoke from another negative, "
        "and a watch scratched out of the print.",
    )

    # ------------------------------------------------------------------
    # 7. Why + discussion
    # ------------------------------------------------------------------
    s = new_slide(prs)
    eyebrow_bar(s, "Why it was changed")
    box, tf = textbox(s, Inches(0.7), Inches(0.75), Inches(12), Inches(1.1))
    para(tf, "Glorify the scene. Protect the story.", "Georgia", 32, CREAM, first=True)

    points = [
        ("Smoke", "A second negative of smoke was printed over the sky so Berlin looked like a harder-won inferno."),
        ("Watch", "Jewelry on a soldier’s wrist suggested plunder. That did not fit the hero the editors needed."),
        ("The lesson", "The photograph is still true — and it is also an argument. Every picture we share does the same."),
    ]
    for i, (title, body) in enumerate(points):
        y = Inches(2.05 + i * 1.15)
        rect(s, Inches(0.7), y, Inches(0.08), Inches(0.95), RED)
        box, tf = textbox(s, Inches(1.05), y, Inches(11.4), Inches(0.4))
        para(tf, title, "Georgia", 18, CREAM, first=True)
        box, tf = textbox(s, Inches(1.05), y + Inches(0.38), Inches(11.4), Inches(0.55))
        para(tf, body, "Calibri", 16, SOFT, first=True)

    box, tf = textbox(s, Inches(0.7), Inches(5.7), Inches(12), Inches(1.2))
    para(tf, "Your turn", "Calibri", 12, RED, bold=True, first=True)
    para(
        tf,
        "If a photographer took a picture of our team this week, what would you add — or quietly remove — before you shared it?",
        "Georgia",
        20,
        CREAM,
        space_before=6,
    )
    notes(
        s,
        "Keep the history to 30 seconds. Then ask the discussion question. Take 2–3 answers and close. "
        "If you have extra time: 'What do we airbrush in our own status updates?'",
    )

    prs.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
