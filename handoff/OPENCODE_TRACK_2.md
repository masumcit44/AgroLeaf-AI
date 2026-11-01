# OPENCODE TRACK 2 — QA templates and a glossary (run headless by the lead)

All boundaries and rules from `handoff/OPENCODE_TRACK.md` still apply:
- this folder only
- branch `track/opencode` only
- only the new files listed here
- Conventional Commits with "Why:" bodies
- push your branch after each task
- update `handoff/OPENCODE_PROGRESS.md` (add a "Track 2" section)

Before starting, read `handoff/OPENCODE_PROGRESS.md`. If a task below is already marked done there, skip it. You may be restarted midway on a different model.

## O6 — QA templates for the release module (M09)
Create the following files. They are **templates**: checkboxes, empty result columns, and no invented results.

1. **`documentation/qa/qa_checklist_v1.md`**
   - Columns: ID · Check · Device · Result (✅/❌) · Notes.
   - Rows: every item of section 1 of `handoff/M09_release.md` (the on-device checks), plus the 8 release blockers from `handoff/01_MODULE_PLAN.md`, plus the sticker rules from `documentation/competition_compliance.md`.
   - A header block for device name, Android version, browser version, network type, and date.
2. **`documentation/qa/hallway_test_v1.md`**
   - A consent line in Bangla and English (no personal data stored; first names or initials only).
   - The 5 tasks:
     1. Take or upload a rice leaf photo.
     2. Explain what the result means.
     3. Play and pause the Bangla audio.
     4. Explain what "not sure" asks them to do.
     5. Find how to call 16123.
   - For each of 5 participants: completed without help (Y/N), wrong taps, time to first result, whether they thought it was a confirmed diagnosis (Y/N), whether the audio was understood (Y/N), a short quote.
   - Pass criteria:
     - all 5 can start the photo flow
     - ≥ 4 understand it is a *possible* result
     - all 5 find the audio and 16123
     - ≥ 4 know how to retry after "not sure"
   - A "Fixes made after the test" table.
   - Write the task wording to read aloud in **simple Bangla**, with English beside it.

## O7 — Bangla/English glossary
**`documentation/glossary_bn_en.md`**: a table of every disease name and every key term used in `disease_knowledge/disease_information_bn.json` and `_en.json`.
- Columns: Key · Bangla · English · Where used · Notes.
- Copy the Bangla spellings **exactly** from the JSON. Do not correct or translate them. If something in the JSON looks inconsistent (e.g. the same disease spelled two ways), list it under "Inconsistencies for the lead to review" instead of fixing it.
- Add the fixed UI terms the product docs use: "সম্ভাব্য সমস্যা" (possible problem), "আমি নিশ্চিত নই" (I'm not sure), "উচ্চ আস্থা" (high confidence), "মাঝারি আস্থা" (moderate confidence), "পরীক্ষা করুন" (check), "আবার ছবি তুলুন" (retake photo), "সরকারি পরামর্শ দেখুন" (see official advice), "কল চার্জ প্রযোজ্য হতে পারে" (call charges may apply), "এআই-তৈরি কণ্ঠ" (AI-generated voice). Their source is `documentation/frontend_spec.md` and the `handoff/M0*.md` files.

## Done
- Push `track/opencode`.
- Add a "Track 2 summary" at the top of OPENCODE_PROGRESS.md.
- Print `TRACK2_DONE` as the very last line of your final answer.
