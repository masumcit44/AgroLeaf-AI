"""Build the five-slide AgroLeaf AI pitch deck.

Usage:
    python documentation/submission/deck_build.py \
        --out documentation/submission/AgroLeaf_AI_deck_v1.pptx
"""

import argparse
import json
from pathlib import Path

try:
    from pptx import Presentation
except ImportError:
    raise SystemExit("python-pptx is missing. Install it with: pip install python-pptx")

from PIL import Image
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


GREEN = RGBColor(0x1F, 0x6B, 0x3A)
PAPER = RGBColor(0xFB, 0xFA, 0xF6)
INK = RGBColor(0x1C, 0x1C, 0x1C)
MUTED = RGBColor(0x5F, 0x60, 0x5A)
LINE = RGBColor(0xDF, 0xDB, 0xD0)
GREY = RGBColor(0xD9, 0xD6, 0xCF)
GREY_TEXT = RGBColor(0x6B, 0x6B, 0x66)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

LATIN = "Segoe UI"
BANGLA = "Nirmala UI"

SLIDE_W = 13.333
SLIDE_H = 7.5

STICKER = "assets/brand/aignite-sticker-original.png"
PROBLEM_PHOTO = "documentation/photos/01_problem.jpg"
PORTRAIT_PHOTO = "documentation/photos/portrait.jpg"
SHOT_UPLOAD = "documentation/screenshots/release/01_home.png"
SHOT_RESULT = "documentation/screenshots/release/02_result_blast.png"
SHOT_NOT_SURE = "documentation/screenshots/release/03_not_sure.png"
SHOT_VOICE = "documentation/screenshots/release/04_voice_assistant.png"

NOTES = [
    "A farmer sees spots on a leaf. They ask whoever is nearby, often the pesticide seller. "
    "If the problem is not what the seller thought, the spray is wrong, the money is gone, "
    "and the crop is still at risk.\n\n"
    "This problem is specific to rice and to Bangla speakers. Many users have a shared phone, "
    "a weak connection and limited reading comfort.\n\n"
    "Many rural farmers face limited or costly connectivity, so the app must work on-device "
    "without requiring continuous internet or server uploads. Do not add review percentages or "
    "any other unverified number.",
    "The flow is deliberately short: photo, check, result.\n\n"
    "The result is in Bangla, with English available, and can be read aloud. Audio starts when "
    "the user taps play; it is labelled as AI voice.\n\n"
    "When the model is not confident, it says \"not sure\" and shows the two closest "
    "possibilities, how to retake the photo, and the 16123 hand-off. It does not force an "
    "answer.\n\n"
    "This is preliminary screening, not a diagnosis.",
    "The model is EfficientNet-B0 (live version v10) with 8 outputs, including 'not a rice leaf' and "
    "'other rice problem', fine-tuned in PyTorch on free Kaggle GPUs and exported to a 15 MB ONNX "
    "file. It runs in the browser with ONNX Runtime Web's WASM build. The photo never leaves the phone.\n\n"
    "The confidence is calibrated on validation data with temperature scaling, and the threshold "
    "is chosen there to target a precision level. There is no hard-coded threshold.\n\n"
    "The split is grouped by perceptual hash, so burst photos cannot leak between train and test. "
    "I checked that no group is shared.\n\n"
    "The headline number is external, not internal: Sylhet-Dhaka, a district the model never saw. "
    "There, 56% of its answers are right; I show that on purpose. Leaf Smut has no external test "
    "and is never named, and the accuracy page says so.\n\n"
    "Fill in the numbers from metrics-v10.json, with the sample sizes in the speaker notes. If "
    "training is not finished, say \"evaluation in progress\" and do not estimate.",
    "I am [[Your name]], a [[Year]] student at [[University]]. My skills are [[Skills]].\n\n"
    "Be transparent: the idea and early research began in a team idea competition. The web app, "
    "the ML pipeline, the design and the deployment are my own individual work for AIgnite. The "
    "team research is credited in the repo.\n\n"
    "I built this because I want a farmer to get a useful second opinion without an account, "
    "without an upload and without a sales pitch.\n\n"
    "Do not imply endorsement by BRRI, DAE, AIS or any other organisation.",
    "Safety is a design constraint, not a disclaimer. The app never generates a dose. Official "
    "guidance is quoted verbatim with a link and a \"confirm with your officer / 16123\" note.\n\n"
    "Privacy is structural: inference is on-device, with no accounts and no analytics that "
    "capture images.\n\n"
    "The limits are visible in the product: one district and one season in training, Leaf Smut "
    "has no external test, and sheath symptoms may be missed on a photo of a leaf. The disease "
    "information is preliminary and has not been reviewed by an agronomist.\n\n"
    "Next: more districts and phones, a proper negative-example check, more crops, and a field "
    "review with an agriculture officer.\n\n"
    "Close with the ask: try the live app, open the accuracy page, and tell me what a farmer "
    "would still find confusing.",
]


def add_rect(
    slide, x, y, w, h, fill, line=None, rounded=False, line_width=0.75, shape_type=None
):
    if shape_type is None:
        shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if rounded else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, Inches(x), Inches(y), Inches(w), Inches(h))
    if rounded:
        shape.adjustments[0] = 0.07
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(line_width)
    shape.shadow.inherit = False
    return shape


def add_text(slide, x, y, w, h, paragraphs, anchor=MSO_ANCHOR.TOP, margins=(0, 0, 0, 0)):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.word_wrap = True
    frame.vertical_anchor = anchor
    frame.margin_left = Inches(margins[0])
    frame.margin_right = Inches(margins[1])
    frame.margin_top = Inches(margins[2])
    frame.margin_bottom = Inches(margins[3])
    for index, data in enumerate(paragraphs):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = data.get("align", PP_ALIGN.LEFT)
        if "space_before" in data:
            paragraph.space_before = Pt(data["space_before"])
        if "space_after" in data:
            paragraph.space_after = Pt(data["space_after"])
        if "line_spacing" in data:
            paragraph.line_spacing = data["line_spacing"]
        for run_data in data["runs"]:
            run = paragraph.add_run()
            run.text = run_data["text"]
            font = run.font
            font.name = run_data.get("font", LATIN)
            font.size = Pt(run_data.get("size", 16))
            font.bold = run_data.get("bold", False)
            font.italic = run_data.get("italic", False)
            font.color.rgb = run_data.get("color", INK)
    return box


def background(slide):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = PAPER
    add_rect(slide, 0, 0, 0.16, SLIDE_H, GREEN)


def title(slide, text, wide=False):
    add_text(
        slide,
        0.85,
        0.52,
        9.6 if not wide else 11.7,
        0.95,
        [{"runs": [{"text": text, "size": 33, "bold": True, "color": INK}]}],
    )
    add_rect(slide, 0.9, 1.33, 1.15, 0.055, GREEN)


def picture_fit(slide, path, x, y, w, h):
    with Image.open(path) as image:
        image_w, image_h = image.size
    scale = min(w / image_w, h / image_h)
    width = image_w * scale
    height = image_h * scale
    left = x + (w - width) / 2
    top = y + (h - height) / 2
    return slide.shapes.add_picture(
        str(path), Inches(left), Inches(top), width=Inches(width), height=Inches(height)
    )


def placeholder(slide, repo, relative, x, y, w, h, rounded=False):
    path = repo / relative
    if path.exists():
        add_rect(slide, x, y, w, h, WHITE, LINE, rounded=rounded)
        picture_fit(slide, path, x + 0.06, y + 0.06, w - 0.12, h - 0.12)
        return True
    add_rect(slide, x, y, w, h, GREY, LINE, rounded=rounded)
    add_text(
        slide,
        x + 0.12,
        y + 0.12,
        w - 0.24,
        h - 0.24,
        [
            {
                "align": PP_ALIGN.CENTER,
                "runs": [{"text": relative, "size": 7.5, "color": GREY_TEXT}],
            }
        ],
        anchor=MSO_ANCHOR.MIDDLE,
    )
    return False


def add_sticker(slide, repo):
    path = repo / STICKER
    with Image.open(path) as image:
        image_w, image_h = image.size
    width = 2.4
    height = width * image_h / image_w
    return slide.shapes.add_picture(
        str(path),
        Inches(SLIDE_W - 0.55 - width),
        Inches(0.35),
        width=Inches(width),
        height=Inches(height),
    )


def value_or_tbd(value):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f"{value:.3f}", True
    return "[[TBD]]", False


def load_metrics(repo):
    path = repo / "frontend/public/data/metrics-v10.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def metric_pair(metrics, section, key):
    if not isinstance(metrics, dict):
        return "[[TBD]]", "[[TBD]]", False
    block = metrics.get(section)
    if not isinstance(block, dict):
        return "[[TBD]]", "[[TBD]]", False
    metric, metric_ok = value_or_tbd(block.get(key))
    coverage, coverage_ok = value_or_tbd(block.get("coverage"))
    return metric, coverage, metric_ok or coverage_ok


def external_pair(metrics):
    if not isinstance(metrics, dict):
        return "[[TBD]]", "[[TBD]]", False
    entries = metrics.get("external")
    if not isinstance(entries, list) or not entries:
        return "[[TBD]]", "[[TBD]]", False
    entry = entries[0] if isinstance(entries[0], dict) else {}
    metric, metric_ok = value_or_tbd(entry.get("macro_f1_mapped"))
    coverage, coverage_ok = value_or_tbd(entry.get("coverage"))
    return metric, coverage, metric_ok or coverage_ok


def metrics_notes(metrics):
    if not isinstance(metrics, dict):
        return ""
    lines = []
    internal = metrics.get("internal_test")
    if isinstance(internal, dict):
        lines.append(
            "Internal test: macro-F1 {}, coverage {}, n {}.".format(
                internal.get("macro_f1", "[[TBD]]"),
                internal.get("coverage", "[[TBD]]"),
                internal.get("n", "[[TBD]]"),
            )
        )
    entries = metrics.get("external")
    if isinstance(entries, list):
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            lines.append(
                "External {}: macro-F1 {}, coverage {}, n {}.".format(
                    entry.get("name", "[[TBD]]"),
                    entry.get("macro_f1_mapped", "[[TBD]]"),
                    entry.get("coverage", "[[TBD]]"),
                    entry.get("n", "[[TBD]]"),
                )
            )
    return ("\n\nMeasured values from metrics-v10.json: " + " ".join(lines)) if lines else ""


def slide_problem(prs, repo):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide)
    add_text(
        slide,
        0.85,
        0.72,
        9.35,
        1.25,
        [
            {
                "line_spacing": 0.95,
                "runs": [
                    {
                        "text": "The wrong spray starts with a guess.",
                        "size": 35,
                        "bold": True,
                        "color": INK,
                    }
                ],
            }
        ],
    )
    add_rect(slide, 0.9, 2.02, 1.15, 0.055, GREEN)
    add_text(
        slide,
        0.9,
        2.35,
        6.1,
        3.1,
        [
            {
                "runs": [
                    {"text": "A farmer sees a spotted rice leaf.", "size": 22, "bold": True}
                ],
                "space_after": 14,
            },
            {
                "line_spacing": 1.15,
                "runs": [
                    {
                        "text": "The wrong advice means the wrong spray: wasted money, and a crop "
                        "still at risk.",
                        "size": 20,
                    }
                ],
                "space_after": 18,
            },
            {
                "runs": [
                    {
                        "text": "Many farmers have limited, costly mobile data.",
                        "size": 16,
                        "color": MUTED,
                    }
                ]
            },
        ],
    )
    placeholder(slide, repo, PROBLEM_PHOTO, 7.55, 1.72, 5.05, 4.95)
    add_sticker(slide, repo)
    slide.notes_slide.notes_text_frame.text = NOTES[0]


def slide_solution(prs, repo):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide)
    title(slide, "One photo. One honest answer.", wide=True)
    shots = [
        (SHOT_UPLOAD, [("Upload a photo", LATIN)]),
        (SHOT_RESULT, [("Bangla result + audio", LATIN)]),
        (SHOT_VOICE, [("Ask by voice, hear Bengali", LATIN)]),
    ]
    positions = [0.85, 4.89, 8.93]
    for position, (relative, caption) in zip(positions, shots):
        placeholder(slide, repo, relative, position, 1.55, 3.55, 4.55, rounded=True)
        add_text(
            slide,
            position,
            6.12,
            3.55,
            0.4,
            [
                {
                    "align": PP_ALIGN.CENTER,
                    "runs": [
                        {"text": text, "size": 13, "bold": True, "font": font, "color": INK}
                        for text, font in caption
                    ],
                }
            ],
        )
    add_text(
        slide,
        0.85,
        6.58,
        11.65,
        0.58,
        [
            {
                "align": PP_ALIGN.CENTER,
                "runs": [
                    {
                        "text": "“Tells you what's wrong in Bangla, and tells you when it "
                        "doesn't know.”",
                        "size": 17,
                        "bold": True,
                        "italic": True,
                        "color": GREEN,
                    }
                ],
            }
        ],
    )
    slide.notes_slide.notes_text_frame.text = NOTES[1]


def slide_how(prs, metrics):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide)
    title(slide, "On the phone. Not in the cloud.", wide=True)

    add_rect(slide, 0.68, 1.55, 8.95, 1.55, PAPER, GREEN, rounded=True, line_width=1.25)
    labels = ["Photo", "EfficientNet-B0", "Threshold", "Bangla card + audio"]
    box_width = 2.45
    gap = 0.55
    start = (SLIDE_W - (4 * box_width + 3 * gap)) / 2
    for index, label in enumerate(labels):
        x = start + index * (box_width + gap)
        add_rect(slide, x, 1.75, box_width, 1.15, GREEN, rounded=True)
        add_text(
            slide,
            x + 0.08,
            1.75,
            box_width - 0.16,
            1.15,
            [
                {
                    "align": PP_ALIGN.CENTER,
                    "runs": [{"text": label, "size": 14.5, "bold": True, "color": WHITE}],
                }
            ],
            anchor=MSO_ANCHOR.MIDDLE,
        )
        if index < 3:
            add_rect(
                slide,
                x + box_width + 0.12,
                2.16,
                0.3,
                0.32,
                GREEN,
                shape_type=MSO_SHAPE.RIGHT_ARROW,
            )

    internal_value, internal_cov, internal_ok = metric_pair(metrics, "internal_test", "macro_f1")
    external_value, external_cov, external_ok = external_pair(metrics)
    internal_label = "Internal test macro-F1: " if internal_ok else "Internal macro-F1: "
    external_label = "Unseen district (Sylhet) macro-F1: " if external_ok else "External macro-F1: "
    add_text(
        slide,
        0.9,
        3.35,
        11.55,
        1.55,
        [
            {
                "runs": [
                    {"text": internal_label, "size": 17, "color": INK},
                    {"text": internal_value, "size": 17, "bold": True, "color": GREEN},
                    {"text": " · answered: ", "size": 17, "color": INK},
                    {"text": internal_cov, "size": 17, "bold": True, "color": GREEN},
                ],
                "space_after": 8,
            },
            {
                "runs": [
                    {"text": external_label, "size": 17, "color": INK},
                    {"text": external_value, "size": 17, "bold": True, "color": GREEN},
                    {"text": " · answered: ", "size": 17, "color": INK},
                    {"text": external_cov, "size": 17, "bold": True, "color": GREEN},
                ],
            },
        ],
    )
    add_text(
        slide,
        0.9,
        5.12,
        11.55,
        1.05,
        [
            {
                "runs": [
                    {
                        "text": "Train: Bangladeshi field photos (Gazipur, Savar, Sirajganj-Pabna, Dhan-Shomadhan, "
                        "DIU half A) + India/Taiwan + non-rice photos",
                        "size": 12.5,
                        "color": MUTED,
                    }
                ],
                "space_after": 5,
            },
            {
                "runs": [
                    {
                        "text": "Independent tests: Sylhet-Dhaka (never seen) · Aman 2025 · DIU half B",
                        "size": 12.5,
                        "color": MUTED,
                    }
                ]
            },
        ],
    )
    slide.notes_slide.notes_text_frame.text = NOTES[2] + metrics_notes(metrics)


def slide_about(prs, repo):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide)
    title(slide, "About me")
    add_text(
        slide,
        0.85,
        1.62,
        7.85,
        0.7,
        [
            {
                "runs": [
                    {"text": "[[Your name]]", "size": 31, "bold": True, "color": GREEN}
                ]
            }
        ],
    )
    add_text(
        slide,
        0.85,
        2.38,
        7.85,
        0.45,
        [
            {
                "runs": [
                    {"text": "[[University]]", "size": 19, "bold": True, "color": INK}
                ]
            }
        ],
    )
    add_text(
        slide,
        0.85,
        2.86,
        7.85,
        0.45,
        [{"runs": [{"text": "[[Skills]]", "size": 17, "color": MUTED}]}],
    )
    add_rect(slide, 0.9, 3.52, 1.15, 0.055, GREEN)
    add_text(
        slide,
        0.85,
        3.8,
        7.85,
        2.6,
        [
            {
                "runs": [
                    {"text": "Solo builder for AIgnite.", "size": 20, "bold": True, "color": INK}
                ],
                "space_after": 12,
            },
            {
                "runs": [
                    {
                        "text": "Research began in a team idea competition.",
                        "size": 16,
                        "color": INK,
                    }
                ],
                "space_after": 6,
            },
            {
                "runs": [
                    {
                        "text": "This web app is my own individual build.",
                        "size": 16,
                        "color": INK,
                    }
                ],
                "space_after": 14,
            },
            {
                "runs": [
                    {
                        "text": "Why this problem: [[one personal line]]",
                        "size": 16,
                        "bold": True,
                        "color": GREEN,
                    }
                ],
            },
        ],
    )
    placeholder(slide, repo, PORTRAIT_PHOTO, 9.25, 1.62, 3.2, 3.55, rounded=True)
    slide.notes_slide.notes_text_frame.text = NOTES[3]


def slide_impact(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    background(slide)
    title(slide, "Useful, and honest about its limits.", wide=True)
    rows = [
        "“Not sure” + 16123 — never a pesticide dose",
        "Bengali voice: 122 recorded answers",
        "Photo never leaves the phone",
        "Works offline after the first visit",
    ]
    positions = [(0.85, 1.72), (6.85, 1.72), (0.85, 3.02), (6.85, 3.02)]
    for (x, y), text in zip(positions, rows):
        add_rect(slide, x, y, 5.5, 1.1, WHITE, LINE, rounded=True)
        add_rect(slide, x + 0.28, y + 0.29, 0.52, 0.52, GREEN, rounded=True)
        add_text(
            slide,
            x + 0.28,
            y + 0.29,
            0.52,
            0.52,
            [
                {
                    "align": PP_ALIGN.CENTER,
                    "runs": [{"text": "✓", "size": 19, "bold": True, "color": WHITE}],
                }
            ],
            anchor=MSO_ANCHOR.MIDDLE,
        )
        add_text(
            slide,
            x + 0.98,
            y,
            5.5 - 1.12,
            1.1,
            [{"runs": [{"text": text, "size": 16.5, "bold": True, "color": INK}]}],
            anchor=MSO_ANCHOR.MIDDLE,
        )
    add_text(
        slide,
        0.85,
        4.65,
        11.6,
        0.6,
        [
            {
                "runs": [
                    {"text": "Next: ", "size": 21, "bold": True, "color": GREEN},
                    {
                        "text": "more crops · officer review · field testing",
                        "size": 21,
                        "bold": True,
                        "color": INK,
                    },
                ]
            }
        ],
    )
    add_rect(slide, 0.9, 5.55, 11.5, 0.045, LINE)
    for x in (0.9, 6.55, 12.35):
        add_rect(slide, x, 5.39, 0.17, 0.17, GREEN, rounded=True)
    slide.notes_slide.notes_text_frame.text = NOTES[4]


def build(repo, out):
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)
    metrics = load_metrics(repo)
    slide_problem(prs, repo)
    slide_solution(prs, repo)
    slide_how(prs, metrics)
    slide_about(prs, repo)
    slide_impact(prs)
    out.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(out))
    return prs


def main():
    repo = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Build the AgroLeaf AI 5-slide deck")
    parser.add_argument(
        "--out",
        default="documentation/submission/AgroLeaf_AI_deck_v1.pptx",
        help="Output .pptx path (relative to the current directory)",
    )
    args = parser.parse_args()
    out = Path(args.out)
    presentation = build(repo, out)
    pictures = sum(
        1
        for shape in presentation.slides[0].shapes
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE
    )
    print(f"Wrote {out} ({len(presentation.slides)} slides, {pictures} picture(s) on slide 1)")


if __name__ == "__main__":
    main()
