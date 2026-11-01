# OpenCode Track 5 — fill real numbers into the submission drafts

Branch: `track/opencode` (this worktree only). Same rules as `OPENCODE_TRACK.md`.
Docs only. **Edit only these three files:**
- `documentation/submission/demo_script_en.md`
- `documentation/submission/devpost_story.md`
- `documentation/submission/submission_checklist.md`

Do not touch `frontend/`, `ml/`, `model/`, `disease_knowledge/`, the deck (`.pptx`, `deck_build.py`) or any other file.

## Source of truth (copy numbers exactly, never round differently, never invent)
`frontend/public/data/metrics-v1.json` and `frontend/public/data/calibration.json`.
- Internal test, n=1499: macro-F1 0.8427, accuracy 0.8686, coverage 0.9466, selective accuracy 0.8872, ECE after calibration 0.0453.
- Outside districts, "honest generalisation" results, each with its provenance note:
  - Sylhet-Dhaka: n=1560, accuracy 0.5202, macro-F1 0.5333, coverage 0.7891, selective accuracy 0.5601.
  - Savar: n=3150, accuracy 0.3358, macro-F1 0.1774.
- Leaf smut is always shown as "not sure" (internal recall 0.7113, no outside data).
Read the `limitations` field of `metrics-v1.json` and keep its meaning.

## Tasks
1. Replace every `[[TBD after training]]` metric with the real number above and the matching context ("internal test", "outside district"). Present outside-district results as an honest limitation and the reason "not sure" exists. Never claim they are good.
2. Screenshots: refer to `documentation/screenshots/release/01_home.png`, `02_result_blast.png`, `03_not_sure.png`, `04_accuracy.png`. Remove any reference to `screenshots/m08b/` or to `m05/`.
3. A safety gate is being added today (a leaf-colour check before the model, and "Healthy" shown only at high confidence). Its numbers are not measured yet. Where it fits (demo script scene on "not sure", Devpost "challenges" and "what's next"), add **one** sentence with the placeholder `[[SAFETY_GATE_NUMBERS]]`. Do not invent figures.
4. Demo script: must stay at or under 3 minutes of English narration. Show this flow: home → sample blast → Bangla card → 16123 → a "not sure" example → accuracy page. Keep the "AI voice" and "charges may apply" wording.
5. Checklist: tick only what is true on `main` today. Leave these open: voice MP3s, live URL, phone test, video, personal details.
6. Keep the banned-claims rules: no doses, no "free call", no "first/only", no partnership, no 100%.

## Done
Commit with a professional message explaining why: `docs(submission): fill measured v1 metrics into demo script, Devpost story and checklist`. Push `track/opencode`. Append a short entry to `handoff/OPENCODE_PROGRESS.md` (what changed, how checked). Then print `TRACK5_DONE`.
