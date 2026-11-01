# M05 — Result card, "not sure" card, disease content, 16123

**Goal:** replace the debug list with the real farmer-facing result screens. All text comes from `disease_knowledge/*.json`.
**Branch:** `feat/m05-results-content` · **Tag:** `m05` · **User gate:** none.

## Content pipeline (single source of truth)
- `frontend/scripts/sync-content.mjs` copies `../disease_knowledge/disease_information_bn.json` and `_en.json` → `frontend/public/data/`. Run it in `predev`/`prebuild`, together with copy-ort.
- Validate at copy time:
  - every key in `class_index.json` exists in **both** JSON files, plus `not_sure`
  - otherwise fail the build with the missing keys listed
- **Never edit the text** in these JSON files.
- **Do not commit the copies** in `public/data/disease_information_*.json`. Add them to `.gitignore`; they are generated.

## Components
| Component | Behaviour |
|---|---|
| `ResultCard.jsx` (status `confident`) | **Top:** status chip "সম্ভাব্য সমস্যা" / "Possible problem" (never "diagnosis"). **Big title:** `name_bn` (28–30 px), small `name_en` under it. **Confidence in words:** prob ≥ 0.90 → "উচ্চ আস্থা" / "High confidence"; otherwise "মাঝারি আস্থা" / "Moderate confidence" (no % here). **Sections:** "এটা কী?" (`meaning_bn`); "লক্ষণ" (`symptoms_bn` list); "এখন কী করবেন" (`what_to_do_now_bn`, highlighted box); "প্রতিরোধ" (`prevention_bn` list). **Healthy:** green styling, the "what to do" box is calm, no warning tone |
| `OfficialGuidance.jsx` | Collapsed by default: "সরকারি পরামর্শ দেখুন (BAMIS/DAE)" ("See official advice"). When opened, shows `text_bn_verbatim` **exactly**, plus source name, link (`target=_blank rel=noopener`) and retrieved date. Red-bordered note: "ওষুধ ব্যবহারের আগে উপজেলা কৃষি অফিসারের সাথে নিশ্চিত হোন বা ১৬১২৩-এ কল করুন" ("Confirm with your Upazila agriculture officer or call 16123 before using any chemical"). **Hidden entirely** if `official_guidance` is null **or** the text starts with `[` |
| `NotSureCard.jsx` (status `not_sure`) | Amber, calm, not alarming. Title "আমি নিশ্চিত নই" ("I'm not sure") + `meaning_bn` of `not_sure`. "সম্ভাবনা আছে" ("Possibly"): the top-2 Bangla names as small chips, labelled "সম্ভাব্য" (possible), no percentages. A 3-tip retake guide with icons: one leaf · daylight · close & in focus. Big "↺ আবার ছবি তুলুন" (Retake) |
| `CallHelpButton.jsx` | `<a href="tel:16123">` styled as a big button "📞 ১৬১২৩ কৃষি কল সেন্টার" (Krishi call centre), with a small note "কল চার্জ প্রযোজ্য হতে পারে" ("call charges may apply"). Appears on **both** cards |
| `DisclaimerNote.jsx` | `_meta.disclaimer_bn` (or the EN version), shown under every result |

**English mode:** use `name_en`, `meaning_en`, `symptoms_en`, `prevention_en` where present. Where an EN field is missing (e.g. `what_to_do_now_en` for diseases), show the i18n string `en.result.askOfficer` ("Ask your Upazila agriculture officer or call 16123 before using any chemical."). **Never machine-translate the Bangla.**

**Layout:** the result screen has the photo thumbnail on top (small), then the card, then the buttons Retake / 16123 / (Share comes in M08). Scroll to the top on result.

## Acceptance checks
- [ ] With the placeholder model, force each state in dev (a temporary `?force=blast` URL param in dev only, stripped from the prod build) and screenshot all 7 states into `documentation/screenshots/m05/`.
- [ ] Tungro and sheath blight: the official guidance block is **hidden** (their text is still a placeholder). Blast and brown spot: shown verbatim with the link.
- [ ] Remove a key from a copy of the JSON → the build fails with a clear message. Restore it.
- [ ] No "%" visible in farmer cards. No word "diagnosis" / "রোগ নির্ণয়" in the result UI.
- [ ] Tests (add a test for the confidence-word mapping and the guidance-hiding rule), lint, and build pass.
- [ ] Commits (examples):
  - `feat(content): sync and validate disease knowledge at build time`
  - `feat(result): add Bangla-first result card with confidence wording`
  - `feat(result): add not-sure card with retake guidance and top-2`
  - `feat(safety): show official guidance verbatim and hide placeholders`
  - `feat(help): add 16123 call button`
