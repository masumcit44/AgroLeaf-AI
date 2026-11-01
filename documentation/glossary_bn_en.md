# Bangla/English glossary v1

**Scope:** every disease name and every key used in
`disease_knowledge/disease_information_bn.json` and
`disease_knowledge/disease_information_en.json`, plus the fixed UI terms used in
`documentation/frontend_spec.md` and `handoff/M0*.md`.

**Rules for this file**
- Bangla cells are **copied exactly** from the source JSON or the named doc.
  Nothing here is corrected, re-spelled or re-translated.
- If the JSON is wrong or inconsistent, it is listed in
  **"Inconsistencies for the lead to review"** below — not fixed here.
- Do not edit the JSON from this glossary. Change the JSON first, then this file.
- Source version: `disease_information_bn.json` / `disease_information_en.json`,
  `_meta.version` = `0.1-draft`, `_meta.date` = `2026-11-01`.

---

## 1. Disease and class names

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `healthy` | সুস্থ পাতা | Healthy leaf | `disease_information_bn.json` → `classes.healthy.name_bn`; `disease_information_en.json` → `classes.healthy.name_en`; result card; `data/disease_classes.md`; `data/DATA_CARD.md` | No "রোগ" suffix; it is not a disease. |
| `blast` | ব্লাস্ট রোগ | Rice blast | `..._bn.json` / `..._en.json` → `classes.blast.name_bn` / `name_en`; result card; `data/disease_classes.md` | `disease_classes.md` writes "ব্লাস্ট" without "রোগ". |
| `brown_spot` | বাদামী দাগ রোগ | Brown spot | `..._bn.json` / `..._en.json` → `classes.brown_spot.name_bn` / `name_en`; result card; `data/disease_classes.md` | `disease_classes.md` writes "বাদামী দাগ". |
| `leaf_smut` | পাতার স্মাট (কালো দাগ) রোগ | Leaf smut | `..._bn.json` / `..._en.json` → `classes.leaf_smut.name_bn` / `name_en`; result card; `data/disease_classes.md` | Bangla name **unconfirmed**: see `name_bn_note` and inconsistency 4. |
| `tungro` | টুংরো রোগ | Rice tungro | `..._bn.json` / `..._en.json` → `classes.tungro.name_bn` / `name_en`; result card; `data/disease_classes.md` | `disease_classes.md` writes "টুংরো". |
| `sheath_blight` | খোল পোড়া রোগ | Sheath blight | `..._bn.json` / `..._en.json` → `classes.sheath_blight.name_bn` / `name_en`; result card; `data/disease_classes.md` | `disease_classes.md` writes "খোল পোড়া". The symptom is on the sheath, so leaf-only photos may miss it. |
| `not_sure` | নিশ্চিত নই | Not sure | `..._bn.json` / `..._en.json` → `classes.not_sure.name_bn` / `name_en`; not-sure card; `data/disease_classes.md` | UI title is "আমি নিশ্চিত নই"; see inconsistency 2. |

---

## 2. JSON keys (content fields)

### 2.1 File metadata (`_meta`)

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `_meta` | — | File metadata object | Both JSONs | Not user-facing. |
| `_meta.language` | — | Language code (`bn` / `en`) | Both JSONs | |
| `_meta.version` | — | Content version (`0.1-draft`) | Both JSONs | Draft, not launch text. |
| `_meta.date` | — | Content date (`2026-11-01`) | Both JSONs | |
| `_meta.status` | — | Draft status and review note | Both JSONs | BN and EN wording differ; not shown to users. |
| `_meta.keys_must_match` | — | Says class keys must match `model/class_index.json` | Both JSONs | `model/class_index.json` is not in the repo yet (model not trained). |
| `_meta.disclaimer_bn` | এটি প্রাথমিক ধারণা, চূড়ান্ত রোগ নির্ণয় নয়। ওষুধ দেওয়ার আগে উপজেলা কৃষি অফিসারের পরামর্শ নিন অথবা ১৬১২৩ নম্বরে কল করুন। | "This is a preliminary screening, not a final answer. Ask your Upazila agriculture officer or call 16123 before using any chemical." | `disease_information_bn.json` → `_meta.disclaimer_bn` | Copied verbatim. EN equivalent is `_meta.disclaimer_en`. |
| `_meta.disclaimer_en` | — | English disclaimer with the same meaning | `disease_information_en.json` → `_meta.disclaimer_en` | |
| `_meta.helpline` | 16123 | 16123 | `disease_information_bn.json` → `_meta.helpline` | Latin digits. EN `_meta` has no helpline key. |

### 2.2 Per-class fields

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `classes.<key>.name_bn` | Per class — see §1 | Bangla display name | `disease_information_bn.json`, all 7 classes | Used as the large result title and in the not-sure chips. |
| `classes.<key>.name_en` | — | English display name | `disease_information_en.json`, all 7 classes | Shown small under the Bangla name. |
| `classes.<key>.name_bn_note` | — | Review note for the Bangla name | `disease_information_bn.json`, `leaf_smut` only | "Bangla name to be confirmed by an agronomist; not found in BAMIS list." |
| `classes.<key>.scientific_name` | — | Scientific name | `disease_information_en.json`, five disease classes | `null` for `healthy`; key absent for `not_sure`. |
| `classes.<key>.type` | — | Disease type (e.g. fungal, viral, seed-borne) | `disease_information_en.json`, five disease classes | Absent for `healthy` and `not_sure`. |
| `classes.<key>.meaning_bn` | Per class | "What it is" explanation | `disease_information_bn.json`, all 7 classes | Also shown on the not-sure card from `not_sure`. |
| `classes.<key>.meaning_en` | — | "What it is" explanation | `disease_information_en.json`, all 7 classes | |
| `classes.<key>.symptoms_bn` | Per class | Symptom list (Bangla) | `disease_information_bn.json` | Empty list for `healthy`; absent for `not_sure`. |
| `classes.<key>.symptoms_en` | — | Symptom list (English) | `disease_information_en.json` | Empty list for `healthy`; absent for `not_sure`. |
| `classes.<key>.favourable_conditions_bn` | Per class | Weather/field conditions that favour the disease | `disease_information_bn.json`, `blast`, `brown_spot`, `sheath_blight` | Absent for the other classes. |
| `classes.<key>.favourable_conditions_en` | — | Same, in English | `disease_information_en.json`, same three classes | |
| `classes.<key>.prevention_bn` | Per class | Prevention steps (Bangla) | `disease_information_bn.json` | Absent for `not_sure`. |
| `classes.<key>.prevention_en` | — | Prevention steps (English) | `disease_information_en.json` | Absent for `not_sure`. |
| `classes.<key>.what_to_do_now_bn` | Per class | "What to do now" box | `disease_information_bn.json`, all 7 classes | The highlighted action text on the card. |
| `classes.<key>.what_to_do_now_en` | — | "What to do now" text | `disease_information_en.json`, `not_sure` only | Field-parity gap: see inconsistency 6. |

### 2.3 Official guidance (`official_guidance` and its EN link)

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `classes.<key>.official_guidance` | — | Object holding the BAMIS quote, source and display rule | `disease_information_bn.json` | `null` for `healthy`, `leaf_smut`, `not_sure`. |
| `classes.<key>.official_guidance.source` | BAMIS (কৃষি সম্প্রসারণ অধিদপ্তর) | BAMIS (Department of Agricultural Extension) | `disease_information_bn.json` | Copied verbatim in the JSON. |
| `classes.<key>.official_guidance.url` | — | Source URL | `disease_information_bn.json` | All four entries use the same page: `https://www.bamis.gov.bd/diseases/1/all/76`. |
| `classes.<key>.official_guidance.retrieved` | — | Retrieval date (`2026-11-01`) | `disease_information_bn.json` | |
| `classes.<key>.official_guidance.text_bn_verbatim` | Per class | Verbatim Bangla quote from BAMIS | `disease_information_bn.json`, `blast`, `brown_spot`, `tungro`, `sheath_blight` | Only shown behind "সরকারি পরামর্শ দেখুন". `tungro` and `sheath_blight` still contain bracketed placeholders; see inconsistency 7. |
| `classes.<key>.official_guidance.show_rule` | — | Where and how the quote may be shown | `disease_information_bn.json` | Not UI copy. Says: never read aloud, never modify; hide if the text starts with `[`. |
| `classes.<key>.official_guidance_url` | — | BAMIS link (EN side) | `disease_information_en.json`, five disease classes | `null` for `leaf_smut`; no key for `healthy` / `not_sure`. |

### 2.4 Voice, audio and review status

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `classes.<key>.voice_script_bn` | Per class | Bangla script read by the TTS/audio | `disease_information_bn.json`, all 7 classes | Spells the helpline as "এক ছয় এক দুই তিন"; see inconsistency 9. |
| `classes.<key>.audio_file` | — | MP3 path | `disease_information_bn.json`, all 7 classes | Pattern: `audio/<key>.mp3`. |
| `classes.<key>.verification_status` | — | Review status | Both JSONs | Mixed English notes such as `needs_agronomist_review` and `app_text`; not user-facing. |

---

## 3. Fixed UI terms (product docs)

These are the terms the UI must use. Their source is
`documentation/frontend_spec.md` and the `handoff/M0*.md` module files.

| Key | Bangla | English | Where used | Notes |
|---|---|---|---|---|
| `ui.possible_problem` | সম্ভাব্য সমস্যা | Possible problem | `handoff/M05_results_and_content.md` (status chip on the result card); `handoff/M08_polish.md` (share text) | This is the result label. Never label a result as a confirmed disease. |
| `ui.not_sure` | আমি নিশ্চিত নই | I'm not sure | `handoff/M05_results_and_content.md` (not-sure card title); `documentation/MVP_requirements.md`; `disease_information_bn.json` → `not_sure.voice_script_bn` | The JSON `name_bn` is "নিশ্চিত নই" (without "আমি"); see inconsistency 2. |
| `ui.high_confidence` | উচ্চ আস্থা | High confidence | `handoff/M05_results_and_content.md` | Shown in words when the probability is ≥ 0.90; no percentage on the card. |
| `ui.moderate_confidence` | মাঝারি আস্থা | Moderate confidence | `handoff/M05_results_and_content.md` | Shown in words otherwise; no percentage on the card. |
| `ui.check` | পরীক্ষা করুন | Check | `documentation/frontend_spec.md` §2; `handoff/M03_image_input.md`; `handoff/M04_inference_engine.md`; `handoff/M08_polish.md` | Button that starts inference from the preview screen. |
| `ui.retake` | আবার ছবি তুলুন | Retake photo | `handoff/M05_results_and_content.md` (not-sure card); `handoff/OPENCODE_TRACK_2.md` | Two other wordings exist in the docs; see inconsistency 1. |
| `ui.see_official_advice` | সরকারি পরামর্শ দেখুন | See official advice | `documentation/frontend_spec.md` §3; `handoff/M05_results_and_content.md`; `show_rule` in both JSONs | Collapsed by default; opens the verbatim BAMIS quote, source, link and date. |
| `ui.call_charges` | কল চার্জ প্রযোজ্য হতে পারে | Call charges may apply | `handoff/M05_results_and_content.md` (call button note) | Never say the call is free. |
| `ui.ai_voice` | এআই-তৈরি কণ্ঠ | AI-generated voice | `handoff/M06_bangla_audio.md` | If human-recorded clips are used instead, the doc gives "রেকর্ড করা কণ্ঠ" ("recorded voice"). |

---

## 4. Inconsistencies for the lead to review

Do not fix these here. Each one needs a decision, then the source file should be
changed.

1. **Retake button has three wordings.** "আবার ছবি তুলুন" (`handoff/M05_results_and_content.md`,
   `handoff/OPENCODE_TRACK_2.md`), "আবার তুলুন" (`documentation/frontend_spec.md` §2) and
   "আবার ছবি দিন" (`handoff/M03_image_input.md`). Pick one string for the UI.
2. **The not-sure name/title differs.** The JSON class name is "নিশ্চিত নই"; the
   card title is "আমি নিশ্চিত নই" (`M05`, `MVP_requirements.md`); the voice script
   starts with "আমি নিশ্চিত নই।"; `model/MODEL_CARD.md` uses "নিশ্চিত নই / not sure".
   Decide whether the class name or the title is the canonical one.
3. **Disease names differ by the "রোগ" suffix between the JSON and
   `data/disease_classes.md` / `data/DATA_CARD.md`.** JSON: "ব্লাস্ট রোগ",
   "বাদামী দাগ রোগ", "টুংরো রোগ", "খোল পোড়া রোগ". Docs: "ব্লাস্ট", "বাদামী দাগ",
   "টুংরো", "খোল পোড়া". The JSON is the app source; the docs may keep the short
   form, but they should say so.
4. **The Leaf Smut Bangla name is openly unconfirmed.** The JSON has
   `name_bn_note` ("Bangla name to be confirmed by an agronomist; not found in
   BAMIS list") and `disease_classes.md` flags it too. Needs an agronomist
   decision before launch.
5. **Confidence wording differs between docs.** `documentation/frontend_spec.md`
   uses "বেশ নিশ্চিত" / "fairly sure"; `handoff/M05_results_and_content.md` uses
   "উচ্চ আস্থা" / "High confidence" and "মাঝারি আস্থা" / "Moderate confidence".
   The fixed terms in §3 follow M05; `frontend_spec.md` has not been updated.
6. **BN/EN field parity is incomplete.** `what_to_do_now_bn` exists for all 7 BN
   classes, but `what_to_do_now_en` exists only for `not_sure`. `scientific_name`
   and `type` exist only in EN. `voice_script_bn`, `audio_file` and
   `official_guidance` exist only in BN. If the result card shows the same
   sections in both languages, the EN side is missing "what to do now" for six
   classes.
7. **Two official-guidance quotes are still placeholders and not verbatim.**
   `tungro` and `sheath_blight` `text_bn_verbatim` contain bracketed instructions
   (e.g. `[BAMIS lists ... copy the exact Bangla text ...]`); `tungro` also
   contains an English note inside the Bangla value. Per `show_rule` and M05,
   text starting with `[` must stay hidden until the exact BAMIS Bangla text is
   copied. Release blocker 7 (verbatim quote + link) is not met for these two.
8. **All four guidance links are the same BAMIS page** (`/diseases/1/all/76`),
   which lists several diseases. The link is valid, but the UI should not imply
   it opens a disease-specific page.
9. **The helpline has two written forms.** `_meta.helpline` is `16123` (Latin
   digits), while every `voice_script_bn` spells it "এক ছয় এক দুই তিন" for the
   TTS. Also, EN `_meta` has no `helpline` key. If anything searches the text for
   "16123", the voice scripts will not match.
10. **The BN and EN `_meta.status` texts differ in length and wording.** They are
    not user-facing, but any code that displays `status` will show different text
    per language.
