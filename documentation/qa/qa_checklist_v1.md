# AgroLeaf AI — QA checklist v1 (template)

**Purpose:** record the M09 on-device QA exactly as run. This is a **blank
template**: do not pre-fill a ✅ or ❌ before the test. Leave a cell empty if
the check was not run.

**Devices required (M09 §1):**
- **Device 1:** a low-end Android phone (2–3 GB RAM) with Chrome.
- **Device 2:** any other phone, or desktop Chrome.

**Source of the rows:** `handoff/M09_release.md` §1 (on-device checks),
`handoff/01_MODULE_PLAN.md` (8 release blockers) and
`documentation/competition_compliance.md` (sticker rules).

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Pass — behaves as written |
| ❌ | Fail — record what happened in Notes (and a screenshot path) |
| *(empty)* | Not run yet |

Every ❌ needs a Notes entry with the exact symptom and, where possible, the
device, browser and build/commit.

## Test session

| Field | Device 1 | Device 2 |
|---|---|---|
| Device name / model | | |
| Android version | | |
| Browser and version | | |
| Network type (e.g. 4G, Wi-Fi) | | |
| Date (BST) | | |

Tested build: ______________________ · Tester: ______________________

---

## A. On-device checks (`handoff/M09_release.md` §1)

| ID | Check | Device | Result (✅/❌) | Notes |
|---|---|---|---|---|
| D-01 | Fresh load on mobile data. Record the time until Home appears and the time until the first result. | Device 1 | | Time to Home: ____ s · time to first result: ____ s |
| D-02 | Cached load (second visit). | Device 1 | | Time to Home: ____ s |
| D-03 | Airplane mode after the first prediction → the app predicts again (model already loaded). | Device 1 | | |
| D-04 | Every sample image shows the matching card. Audio plays and pauses. | Device 1 | | Samples checked: ____ · audio play/pause: ____ |
| D-05 | A non-rice photo (hand, mango leaf, soil) → "not sure" or the low-confidence route. Record 10 tries. | Device 1 | | Routed correctly: ____/10 |
| D-06 | A blurry or dark photo → a hint appears. | Device 1 | | |
| D-07 | The 16123 button opens the phone dialer. | Device 1 | | |
| D-08 | The language toggle works on every screen. | Device 1 | | Screens checked: ____ |
| D-09 | The Accuracy and About pages load. | Device 1 | | |
| D-10 | The sticker is visible at the top on every page. | Device 1 | | |
| D-11 | Release blockers 1–8 (section B) are all ✅. | Device 1 | | |
| D-12 | Fresh load on mobile data. Record the time until Home appears and the time until the first result. | Device 2 | | Time to Home: ____ s · time to first result: ____ s |
| D-13 | Cached load (second visit). | Device 2 | | Time to Home: ____ s |
| D-14 | Airplane mode after the first prediction → the app predicts again (model already loaded). | Device 2 | | |
| D-15 | Every sample image shows the matching card. Audio plays and pauses. | Device 2 | | Samples checked: ____ · audio play/pause: ____ |
| D-16 | A non-rice photo (hand, mango leaf, soil) → "not sure" or the low-confidence route. Record 10 tries. | Device 2 | | Routed correctly: ____/10 |
| D-17 | A blurry or dark photo → a hint appears. | Device 2 | | |
| D-18 | The 16123 button opens the phone dialer. | Device 2 | | |
| D-19 | The language toggle works on every screen. | Device 2 | | Screens checked: ____ |
| D-20 | The Accuracy and About pages load. | Device 2 | | |
| D-21 | The sticker is visible at the top on every page. | Device 2 | | |
| D-22 | Release blockers 1–8 (section B) are all ✅. | Device 2 | | |

Use the **Notes** column for the exact failure text, a screenshot filename, and
the network used. Keep the two device blocks separate; do not average them.

---

## B. Release blockers (`handoff/01_MODULE_PLAN.md`)

All eight must be ✅ before the `v1.0.0` tag (M09 acceptance check).

| ID | Check | Device | Result (✅/❌) | Notes |
|---|---|---|---|---|
| B-01 | `onnxruntime-web/wasm` is imported (not the default import) and the `.wasm` file is served correctly as a real file, not rewritten to `index.html`. | Device 1 | | |
| B-02 | The exported ONNX file is **< 25 MiB** (record the exact size). | Both | | Size: ____ MiB |
| B-03 | PyTorch ≈ ONNX ≈ browser outputs match on the same images (parity test passes). | Both | | Parity report: ____ |
| B-04 | Class order is identical in the model, `class_index.json` and the disease JSON. | Both | | |
| B-05 | The threshold comes from validation data and is stored in `calibration.json`. | Both | | Threshold: ____ |
| B-06 | Works on a real low-end Android phone — both fresh load and cached load. | Device 1 | | |
| B-07 | No pesticide dose is shown unless it is quoted verbatim from BAMIS with a link; bracketed placeholders are hidden. | Both | | |
| B-08 | The sticker is visible in the navbar. | Both | | |

---

## C. Sticker rules (`documentation/competition_compliance.md`)

| ID | Check | Device | Result (✅/❌) | Notes |
|---|---|---|---|---|
| S-01 | The official file is used unchanged in design — no recolouring, cropping or redrawing. | Both | | |
| S-02 | Any resizing keeps the same image, only at a smaller pixel size (allowed for speed). | Both | | |
| S-03 | The original is kept at `frontend/public/brand/aignite-sticker-original.png`; the served copy is `aignite-sticker.png`, about 2× the displayed height (e.g. 120 px tall). | Both | | |
| S-04 | Display height is 44–52 px on mobile and up to 64 px on desktop; the aspect ratio is kept; a light background is used if contrast needs it. | Both | | Mobile: ____ px · desktop: ____ px |
| S-05 | `alt` text is exactly: `Built For Ostad Presents YUNet AIgnite Buildathon 2026`. | Both | | |
| S-06 | The sticker is inside the sticky navbar on every route and every state; it is never covered by banners or modals and never only in the footer. | Both | | Routes/states checked: ____ |
| S-07 | The sticker also appears on the deck's title slide and in the demo video's opening shot (not required, but signals compliance). | — | | |

---

## Sign-off

| Question | Answer |
|---|---|
| Number of ❌ on release blockers (B-01…B-08) | |
| Number of ❌ in sections A and C | |
| All release blockers ✅? (Y/N) | |
| Tester name | |
| Date (BST) | |

**Acceptance (M09):** the checklist is complete and **no release blocker is ❌**.
Do not tag `v1.0.0` while any B-row is ❌ or empty.
