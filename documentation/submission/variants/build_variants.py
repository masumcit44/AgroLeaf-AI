"""Builds the AgroLeaf AI Buildathon deck variants (5 slides each, 16:9).

Variant A "Premium": light, screenshot-led product pitch.
Variant C "Technology": dark, diagram-led technical pitch.
Shared, verified content only (metrics from frontend/public/data/metrics-v10.json).
Usage: python build_variants.py <repo_root> <assets_dir> <out_dir>
assets_dir must contain photo_circle.png and qr.png (kept outside the repo: personal photo).
"""
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

REPO, ASSETS, OUT = (Path(p) for p in sys.argv[1:4])
SHOTS = REPO / "documentation/screenshots/release"
STICKER = REPO / "assets/brand/aignite-sticker-original.png"
LEAF = REPO / "frontend/public/samples/blast_1.jpg"
M = json.loads((REPO / "frontend/public/data/metrics-v10.json").read_text(encoding="utf-8"))
LIVE, CODE = "agroleaf-ai.pages.dev", "github.com/masumcit44/AgroLeaf-AI"

THEMES = {
    "A": dict(bg="FAF8F2", panel="FFFFFF", ink="16231A", sub="4B5B50", accent="1F6B35", accent2="E9A23B",
              line="DCE5DA", on_accent="FFFFFF", font="Segoe UI", head="Segoe UI Semibold"),
    "C": dict(bg="0E1B16", panel="16291F", ink="F2F7F3", sub="A9C2B2", accent="3DDC84", accent2="F5C04A",
              line="2A4436", on_accent="0E1B16", font="Segoe UI", head="Segoe UI Semibold"),
}


def rgb(h):
    return RGBColor.from_string(h)


class Deck:
    def __init__(self, key):
        self.t = THEMES[key]
        self.key = key
        self.prs = Presentation()
        self.prs.slide_width, self.prs.slide_height = Inches(13.333), Inches(7.5)

    def slide(self):
        s = self.prs.slides.add_slide(self.prs.slide_layouts[6])
        s.background.fill.solid()
        s.background.fill.fore_color.rgb = rgb(self.t["bg"])
        return s

    def box(self, s, x, y, w, h, fill, line=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08):
        sh = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
        sh.fill.solid()
        sh.fill.fore_color.rgb = rgb(fill)
        if line:
            sh.line.color.rgb = rgb(line)
            sh.line.width = Pt(1)
        else:
            sh.line.fill.background()
        if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
            sh.adjustments[0] = radius
        sh.shadow.inherit = False
        return sh

    def text(self, s, x, y, w, h, runs, size=14, color=None, bold=False, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, head=False, spacing=1.1):
        tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = anchor
        for m in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
            setattr(tf, m, 0)
        paras = runs if isinstance(runs, list) else [runs]
        for i, para in enumerate(paras):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.alignment = align
            p.line_spacing = spacing
            parts = para if isinstance(para, list) else [(para, {})] if isinstance(para, str) else [para]
            for part in parts:
                txt, opt = (part, {}) if isinstance(part, str) else part
                r = p.add_run()
                r.text = txt
                f = r.font
                f.name = self.t["head"] if (head or opt.get("head")) else self.t["font"]
                f.size = Pt(opt.get("size", size))
                f.bold = opt.get("bold", bold)
                f.color.rgb = rgb(opt.get("color", color or self.t["ink"]))
        return tb

    def pic(self, s, path, x, y, w=None, h=None):
        kw = {}
        if w:
            kw["width"] = Inches(w)
        if h:
            kw["height"] = Inches(h)
        return s.shapes.add_picture(str(path), Inches(x), Inches(y), **kw)

    def pic_crop(self, s, path, x, y, w, h, crop_top_only=True):
        """Phone screenshot cropped to the box from the top (keeps header + first content)."""
        from PIL import Image
        iw, ih = Image.open(path).size
        p = s.shapes.add_picture(str(path), Inches(x), Inches(y), Inches(w), Inches(h))
        target = w / h
        if iw / ih < target:  # too tall: crop the bottom
            keep = (iw / target) / ih
            p.crop_bottom = max(0.0, 1 - keep)
        else:
            keep = (ih * target) / iw
            p.crop_left = p.crop_right = max(0.0, (1 - keep) / 2)
        return p

    def header(self, s, kicker, title, y=0.55):
        t = self.t
        self.text(s, 0.75, y, 9.5, 0.3, kicker.upper(), size=12, bold=True, color=t["accent"])
        self.text(s, 0.75, y + 0.33, 11.5, 0.9, title, size=30, head=True, color=t["ink"])
        self.pic(s, STICKER, 11.35, 0.35, w=1.6)

    def footer(self, s, n):
        self.text(s, 0.75, 7.05, 6, 0.25, f"AgroLeaf AI  ·  {LIVE}", size=10, color=self.t["sub"])
        self.text(s, 12.0, 7.05, 0.6, 0.25, f"{n}/5", size=10, color=self.t["sub"], align=PP_ALIGN.RIGHT)

    def save(self, name):
        path = OUT / name
        self.prs.save(str(path))
        return path


# ------------------------------- shared content ---------------------------------------
PROBLEM_POINTS = [
    ("Diseases spread in days.", " Blast, brown spot, sheath blight and tungro can cut a rice harvest; early action matters."),
    ("Help is far away.", " A farmer often cannot show the leaf to an agriculture officer in time."),
    ("Wrong guesses cost money.", " Apps that are English-only, need a strong connection or always give an answer can lead to the wrong pesticide being bought."),
]
WORKFLOW = [
    ("01_home.png", "1  Take a photo", "Camera or gallery, Bangla-first home screen"),
    ("02_result_blast.png", "2  Get the result", "On-phone AI names the likely disease, or says “not sure”"),
    ("04_voice_assistant.png", "3  Ask & listen", "Bangla answer, read aloud in a recorded Bengali voice"),
]
FOLLOW = "Then: this-week plan  ·  save to history  ·  follow-up reminder  ·  one-tap 16123 helpline"
PIPELINE = [
    ("Leaf photo", "camera / gallery,\noptional crop"),
    ("Preprocess", "EXIF upright,\nresize 366 → crop 320"),
    ("EfficientNet-B0", "v10, PyTorch-trained,\n8 outputs"),
    ("ONNX Runtime Web", "WASM in the browser,\n15.3 MB, offline"),
    ("Calibrated decision", "temperature scaling,\n“not sure” / not a leaf"),
    ("Farmer guidance", "BAMIS/DAE knowledge,\nBengali audio"),
]
STACK = "React 19 · Vite · Tailwind · PWA (Workbox) · IndexedDB · Cloudflare Pages + Functions + D1 · edge-tts bn-BD · 509 automated tests"
INNOVATION = [
    ("Runs on the phone", "The photo never leaves the device. After the first visit, scans and recorded voice work offline."),
    ("Honest “not sure”", "Calibrated thresholds: low-confidence photos get “not sure” plus retake tips, not a forced guess."),
    ("Genuine Bengali voice", "Every result and 122 assistant answers are pre-recorded in bn-BD. Planner text uses the phone's Bengali voice only — never English."),
    ("Safe advice", "Never names a pesticide or a dose; chemical decisions go to the Upazila officer or 16123. Built-in fake-pesticide checklist."),
    ("Follow-through", "This-week plan, reminders, scan history and a 7-day weather disease-risk view (BAMIS rules, GPS rounded to ~1 km)."),
    ("Measured, in public", "Each result shows how often such results were right in testing (e.g. 80 of 100); full numbers on the in-app Accuracy page."),
]


def metric_rows():
    it = M["internal_test"]
    rows = [("Internal test (held-out)", it["n"], it["accuracy"], it.get("macro_f1"))]
    for e in M["external"]:
        name = e["name"]
        if "DIU" in name:
            rows.append(("DIU Bangladesh, independent half", e["n"], e["accuracy_mapped"], e.get("macro_f1_mapped")))
        elif "Aman 2025" in name:
            rows.append(("Aman 2025 field set (no duplicates)", e["n"], e["accuracy_mapped"], e.get("macro_f1_mapped")))
        elif "Sylhet" in name:
            rows.append(("Real-field Sylhet–Dhaka photos", e["n"], e["accuracy_mapped"], e.get("macro_f1_mapped")))
    return rows


# ------------------------------- Variant A: Premium -----------------------------------
def build_a():
    d = Deck("A")
    t = d.t
    # 1 Problem
    s = d.slide()
    d.pic(s, STICKER, 11.35, 0.35, w=1.6)
    d.text(s, 0.75, 0.6, 7, 0.3, "AGROLEAF AI  ·  এগ্রোলিফ এআই".replace("  ·  এগ্রোলিফ এআই", ""), size=13, bold=True, color=t["accent"])
    d.text(s, 0.75, 0.95, 7.2, 1.7, "Rice farmers lose crops to diseases they can't name in time.", size=34, head=True)
    y = 2.85
    for b, rest in PROBLEM_POINTS:
        d.box(s, 0.75, y + 0.05, 0.12, 0.62, t["accent"], shape=MSO_SHAPE.RECTANGLE)
        d.text(s, 1.05, y, 6.8, 0.8, [[(b, {"bold": True}), (rest, {"color": t["sub"]})]], size=15)
        y += 0.95
    d.box(s, 0.75, 5.85, 7.2, 1.0, t["accent"])
    d.text(s, 1.0, 5.85, 6.8, 1.0, [[("AgroLeaf AI: ", {"bold": True, "color": t["on_accent"]}),
                                    ("one photo → on-phone AI → an honest answer in Bangla, spoken in Bengali.", {"color": t["on_accent"]})]],
           size=16, anchor=MSO_ANCHOR.MIDDLE)
    d.pic(s, LEAF, 8.4, 1.6, w=4.2)
    d.text(s, 8.4, 6.25, 4.2, 0.4, "Blast lesions on a rice leaf (sample photo used in the app)", size=11, color=t["sub"], align=PP_ALIGN.CENTER)
    d.footer(s, 1)
    # 2 Product
    s = d.slide()
    d.header(s, "The product", "From a leaf photo to a clear next step — in Bangla.")
    for i, (img, title, sub) in enumerate(WORKFLOW):
        x = 0.75 + i * 4.05
        d.box(s, x, 1.95, 3.75, 4.45, t["panel"], line=t["line"])
        d.pic_crop(s, SHOTS / img, x + 0.95, 2.1, 1.85, 3.4)
        d.text(s, x + 0.2, 5.6, 3.35, 0.35, title, size=16, bold=True, color=t["accent"], align=PP_ALIGN.CENTER)
        d.text(s, x + 0.2, 5.95, 3.35, 0.45, sub, size=11.5, color=t["sub"], align=PP_ALIGN.CENTER)
    d.text(s, 0.75, 6.55, 11.8, 0.35, FOLLOW, size=14, bold=True, color=t["ink"], align=PP_ALIGN.CENTER)
    d.footer(s, 2)
    # 3 AI
    s = d.slide()
    d.header(s, "AI & technical implementation", "A real model, running inside the farmer's browser.")
    for i, (a, b) in enumerate(PIPELINE):
        x = 0.75 + i * 2.03
        d.box(s, x, 1.95, 1.85, 1.45, t["accent"] if i in (2, 3) else t["panel"], line=None if i in (2, 3) else t["line"])
        col = t["on_accent"] if i in (2, 3) else t["ink"]
        d.text(s, x + 0.1, 2.02, 1.65, 0.4, a, size=12.5, bold=True, color=col, align=PP_ALIGN.CENTER)
        d.text(s, x + 0.1, 2.48, 1.65, 0.85, b, size=10, color=col if i in (2, 3) else t["sub"], align=PP_ALIGN.CENTER)
        if i < len(PIPELINE) - 1:
            d.text(s, x + 1.84, 2.4, 0.2, 0.4, "›", size=20, bold=True, color=t["accent"], align=PP_ALIGN.CENTER)
    d.text(s, 0.75, 3.7, 6, 0.35, "Measured accuracy of the live model (v10)", size=15, bold=True)
    rows = metric_rows()
    for j, (name, n, acc, f1) in enumerate(rows):
        y = 4.15 + j * 0.52
        d.box(s, 0.75, y, 7.6, 0.44, t["panel"], line=t["line"], radius=0.2)
        d.text(s, 0.95, y, 4.6, 0.44, name, size=12.5, anchor=MSO_ANCHOR.MIDDLE)
        d.text(s, 5.45, y, 1.1, 0.44, f"n={n:,}", size=11.5, color=t["sub"], anchor=MSO_ANCHOR.MIDDLE)
        d.text(s, 6.55, y, 1.6, 0.44, f"{acc*100:.1f}%", size=14, bold=True, color=t["accent"], anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.RIGHT)
    d.text(s, 8.7, 3.7, 3.9, 2.5, [
        [("Honest about the hard case. ", {"bold": True}),
         ("Real field photos from a different region score lower; there the app abstains more often instead of guessing. All four sets were read once, never used for tuning.", {"color": t["sub"]})],
    ], size=12.5)
    d.text(s, 0.75, 6.35, 11.8, 0.5, STACK, size=11.5, color=t["sub"])
    d.footer(s, 3)
    # 4 Innovation
    s = d.slide()
    d.header(s, "Innovation & farmer impact", "Built for a basic phone, weak signal and no English.")
    for i, (a, b) in enumerate(INNOVATION):
        x = 0.75 + (i % 3) * 4.05
        y = 1.95 + (i // 3) * 2.35
        d.box(s, x, y, 3.8, 2.15, t["panel"], line=t["line"])
        d.box(s, x + 0.25, y + 0.28, 0.42, 0.42, t["accent"], shape=MSO_SHAPE.OVAL)
        d.text(s, x + 0.25, y + 0.28, 0.42, 0.42, str(i + 1), size=13, bold=True, color=t["on_accent"], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        d.text(s, x + 0.82, y + 0.3, 2.8, 0.4, a, size=15.5, bold=True)
        d.text(s, x + 0.25, y + 0.9, 3.35, 1.2, b, size=11.5, color=t["sub"])
    d.footer(s, 4)
    # 5 Builder
    s = d.slide()
    d.header(s, "About the builder & live project", "Solo-built, end to end, for Bangladeshi rice farmers.")
    d.pic(s, ASSETS / "photo_circle.png", 0.85, 2.0, w=2.6)
    d.text(s, 3.75, 2.1, 5.2, 0.5, "Md. Masum Akondha", size=24, head=True)
    d.text(s, 3.75, 2.65, 5.2, 0.4, "B.Sc. in CSE student, Eastern University, Bangladesh", size=14, color=t["sub"])
    d.text(s, 3.75, 3.25, 5.3, 2.3, [
        "Built AgroLeaf AI alone for this buildathon:",
        "•  curated Bangladeshi & regional rice-leaf datasets, trained and evaluated the model",
        "•  browser ML with ONNX Runtime Web, React PWA, offline caching",
        "•  Bengali voice pipeline and safety rules for agricultural advice",
        "•  deployment on Cloudflare Pages with automated tests",
    ], size=12.5, color=t["ink"], spacing=1.2)
    d.box(s, 9.35, 1.95, 3.25, 4.2, t["panel"], line=t["line"])
    d.pic(s, ASSETS / "qr.png", 9.75, 2.15, w=2.45)
    d.text(s, 9.45, 4.7, 3.05, 0.35, "Try it live", size=14, bold=True, align=PP_ALIGN.CENTER)
    d.text(s, 9.45, 5.05, 3.05, 0.3, LIVE, size=12, color=t["accent"], bold=True, align=PP_ALIGN.CENTER)
    d.text(s, 9.45, 5.4, 3.05, 0.6, CODE, size=10.5, color=t["sub"], align=PP_ALIGN.CENTER)
    d.box(s, 0.75, 6.0, 8.3, 0.75, t["accent"])
    d.text(s, 1.0, 6.0, 7.9, 0.75, [[("Next: ", {"bold": True, "color": t["on_accent"]}),
                                     ("agronomist review of the advice · field testing with farmers · more crops", {"color": t["on_accent"]})]],
           size=14, anchor=MSO_ANCHOR.MIDDLE)
    d.footer(s, 5)
    return d.save("AgroLeaf_AI_Variant_A_Premium.pptx")


# ------------------------------- Variant C: Technology --------------------------------
def build_c():
    d = Deck("C")
    t = d.t
    # 1 Problem: big statement left, three stat-like problem tiles right
    s = d.slide()
    d.pic(s, STICKER, 11.35, 0.35, w=1.6)
    d.box(s, 0, 0, 0.18, 7.5, t["accent"], shape=MSO_SHAPE.RECTANGLE)
    d.text(s, 0.75, 0.75, 6.4, 0.3, "AGROLEAF AI", size=13, bold=True, color=t["accent"])
    d.text(s, 0.75, 1.1, 6.4, 2.4, "A rice-disease screener that runs on a farmer's phone and speaks Bengali.", size=32, head=True)
    d.text(s, 0.75, 3.75, 6.2, 1.6, "Farmers often cannot identify a disease or reach an officer in time, and confident-but-wrong advice leads to the wrong pesticide. AgroLeaf AI gives an honest, on-device answer in Bangla — and says “not sure” when it should.", size=14.5, color=t["sub"])
    d.pic(s, LEAF, 0.75, 5.35, h=1.45)
    d.text(s, 2.75, 5.5, 4.3, 1.2, "Blast on a rice leaf — one of 5 conditions the model recognises (+ “not a rice leaf”, “other problem”).", size=11.5, color=t["sub"])
    for i, (b, rest) in enumerate(PROBLEM_POINTS):
        y = 1.75 + i * 1.75
        d.box(s, 7.6, y, 5.0, 1.5, t["panel"], line=t["line"])
        d.text(s, 7.9, y + 0.2, 4.5, 0.4, b, size=16, bold=True, color=t["accent2"])
        d.text(s, 7.9, y + 0.62, 4.5, 0.85, rest.strip(), size=11.5, color=t["sub"])
    d.footer(s, 1)
    # 2 Product: phones on the right, numbered steps on the left
    s = d.slide()
    d.header(s, "How a farmer uses it", "Three screens, one minute.")
    steps = [("Photograph the leaf", "Camera or gallery; optional crop to the sick part."),
             ("AI answers on the phone", "Likely disease, a reliability level (e.g. 80 of 100) — or “not sure”."),
             ("Read & listen in Bangla", "What it is, what to do this week, recorded Bengali voice."),
             ("Follow through", "Save to history, set a reminder, call 16123 in one tap, ask the voice assistant.")]
    for i, (a, b) in enumerate(steps):
        y = 1.95 + i * 1.18
        d.box(s, 0.75, y, 0.55, 0.55, t["accent"], shape=MSO_SHAPE.OVAL)
        d.text(s, 0.75, y, 0.55, 0.55, str(i + 1), size=15, bold=True, color=t["on_accent"], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        d.text(s, 1.5, y - 0.02, 4.4, 0.4, a, size=16, bold=True)
        d.text(s, 1.5, y + 0.38, 4.4, 0.7, b, size=11.5, color=t["sub"])
    for i, (img, title, _) in enumerate(WORKFLOW):
        x = 6.35 + i * 2.15
        d.box(s, x - 0.08, 1.87, 2.01, 4.66, t["panel"], line=t["line"], radius=0.06)
        d.pic_crop(s, SHOTS / img, x, 1.95, 1.85, 4.15)
        d.text(s, x, 6.12, 1.85, 0.35, title, size=11.5, bold=True, color=t["accent"], align=PP_ALIGN.CENTER)
    d.footer(s, 2)
    # 3 AI: vertical pipeline left, metric bars right
    s = d.slide()
    d.header(s, "Under the hood", "On-device computer vision with calibrated abstention.")
    for i, (a, b) in enumerate(PIPELINE):
        y = 1.85 + i * 0.83
        d.box(s, 0.75, y, 5.1, 0.7, t["accent"] if i in (2, 3) else t["panel"], line=None if i in (2, 3) else t["line"], radius=0.18)
        col = t["on_accent"] if i in (2, 3) else t["ink"]
        d.text(s, 0.95, y, 2.0, 0.7, a, size=12.5, bold=True, color=col, anchor=MSO_ANCHOR.MIDDLE)
        d.text(s, 3.0, y, 2.75, 0.7, b.replace("\n", " "), size=10, color=col if i in (2, 3) else t["sub"], anchor=MSO_ANCHOR.MIDDLE)
    d.text(s, 6.6, 1.85, 6, 0.35, "Accuracy of the live model (v10), sets read once", size=14, bold=True)
    for j, (name, n, acc, f1) in enumerate(metric_rows()):
        y = 2.4 + j * 0.92
        d.text(s, 6.6, y, 4.6, 0.3, f"{name}  (n={n:,})", size=11.5, color=t["sub"])
        d.box(s, 6.6, y + 0.35, 5.0, 0.32, t["panel"], line=t["line"], shape=MSO_SHAPE.RECTANGLE)
        d.box(s, 6.6, y + 0.35, 5.0 * acc, 0.32, t["accent"] if acc >= 0.7 else t["accent2"], shape=MSO_SHAPE.RECTANGLE)
        d.text(s, 11.7, y + 0.3, 0.95, 0.4, f"{acc*100:.1f}%", size=13, bold=True, color=t["ink"])
    d.text(s, 6.6, 6.1, 6.0, 0.6, "Field photos from another region are the hard case: the app abstains more there instead of guessing.", size=11, color=t["sub"])
    d.text(s, 0.75, 6.85 - 0.05, 0.1, 0.1, "", size=2)
    d.footer(s, 3)
    # 4 Innovation: 2 columns x 3 rows, accent number left
    s = d.slide()
    d.header(s, "What makes it different", "Designed around trust, language and connectivity.")
    for i, (a, b) in enumerate(INNOVATION):
        x = 0.75 + (i % 2) * 6.05
        y = 1.9 + (i // 2) * 1.62
        d.box(s, x, y, 5.8, 1.45, t["panel"], line=t["line"])
        d.text(s, x + 0.25, y + 0.15, 0.7, 1.1, f"0{i+1}", size=26, bold=True, color=t["accent"])
        d.text(s, x + 1.1, y + 0.18, 4.5, 0.4, a, size=15, bold=True)
        d.text(s, x + 1.1, y + 0.58, 4.5, 0.85, b, size=11, color=t["sub"])
    d.footer(s, 4)
    # 5 Builder
    s = d.slide()
    d.header(s, "Builder & live demo", "Md. Masum Akondha")
    d.pic(s, ASSETS / "photo_circle.png", 0.85, 1.95, w=2.9)
    d.text(s, 4.1, 2.0, 5.1, 0.7, ["B.Sc. in CSE student", "Eastern University, Bangladesh"], size=15, bold=True, color=t["accent2"])
    d.text(s, 4.1, 2.95, 4.9, 2.6, [
        "Solo builder of AgroLeaf AI:",
        "•  data curation, model training & evaluation",
        "•  ONNX browser inference, React PWA, offline",
        "•  Bengali voice pipeline & advice-safety rules",
        "•  Cloudflare deployment, automated testing",
    ], size=13, spacing=1.25)
    d.box(s, 9.4, 1.9, 3.2, 4.3, t["panel"], line=t["line"])
    d.box(s, 9.65, 2.1, 2.7, 2.7, "FFFFFF", radius=0.05)
    d.pic(s, ASSETS / "qr.png", 9.75, 2.2, w=2.5)
    d.text(s, 9.5, 4.95, 3.0, 0.35, "Scan to try it", size=14, bold=True, align=PP_ALIGN.CENTER)
    d.text(s, 9.5, 5.3, 3.0, 0.3, LIVE, size=12, bold=True, color=t["accent"], align=PP_ALIGN.CENTER)
    d.text(s, 9.5, 5.65, 3.0, 0.4, CODE, size=10, color=t["sub"], align=PP_ALIGN.CENTER)
    d.text(s, 0.85, 5.6, 8.2, 0.9, [[("Next  ", {"bold": True, "color": t["accent"]}),
                                     ("agronomist review · field testing with farmers · more crops and varieties", {"color": t["ink"]})]], size=14)
    d.footer(s, 5)
    return d.save("AgroLeaf_AI_Variant_C_Technology.pptx")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (build_a(), build_c()):
        print("wrote", p)
