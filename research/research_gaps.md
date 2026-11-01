# Research gaps (open questions that matter for the build)

| # | Gap | Why it matters | How to close it (and by when) |
|---|---|---|---|
| 1 | Per-class counts of RiceLeafDiseaseBD v3 | Class weights; whether Leaf Smut has enough data | Run `ml/audit_dataset.py` (1 Nov) |
| 2 | Near duplicates inside the dataset | Leakage → inflated accuracy | Same script, pHash groups (1 Nov) |
| 3 | Does the "κ = 0.82" expert agreement exist? | It's in team decks; it's not on the dataset page | Read the dataset's files or paper. If it isn't found, drop the claim |
| 4 | Real-world generalisation | One district, one season | External test on Savar and Sylhet sets (2 Nov) |
| 5 | Agronomist review of the Bangla cards | Safety and correctness | Ask one extension officer or agriculture student (by 4 Nov) |
| 6 | Bangla TTS on real phones | Voice is a winning feature | Pre-generate MP3s (Azure bn-BD); browser TTS only as fallback (3 Nov) |
| 7 | Current registration of the insecticides BAMIS lists for Tungro | Don't show withdrawn chemicals | Check with DAE, or omit them (by 4 Nov) |
| 8 | Official Bangla guidance for Leaf Smut | Not in BAMIS | Search BRRI/AIS; else keep the card minimal |
| 9 | Competitor app name (Rice Solution vs Dhan Surokkha) and whether it says "not sure" | Our main innovation claim | Install and test it (30 min) |
