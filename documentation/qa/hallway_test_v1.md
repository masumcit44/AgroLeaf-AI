# AgroLeaf AI — hallway test v1 (template)

**Purpose:** a 5-person usability test with Bangla speakers, run without
coaching (M09 §2). This is a **blank template**: no results are pre-filled.

**Before the test**
- Use the release build on a phone the participant can hold.
- Read each task **once**, exactly as written below, in Bangla. Do not explain
  the app or point at the screen first.
- If a participant is stuck, wait 30 seconds before offering help. If they still
  cannot continue, mark that task as **not completed without help** and move on.
- Stop a task after 3 minutes.
- The facilitator fills the tables; the participant only uses the app.
- Keep only a **first name or initials**. Do not record full names, phone
  numbers, photos of faces, or anything else that identifies a person.

**Source of the task set:** `handoff/M09_release.md` §2 (which points to §13 of
the consolidated research file). Wording below is written for this test.

## Consent (read aloud before starting)

**Bangla:**
> সম্মতি: এই পরীক্ষায় আপনার পুরো নাম, ফোন নম্বর বা অন্য কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হবে না। শুধু আপনার নামের প্রথম অংশ বা আদ্যক্ষর লেখা হবে। আপনি যেকোনো সময় থামতে পারেন।

**English:**
> Consent: No personal data will be stored in this test — no full name, phone
> number or other identifying details. Only your first name or initials will be
> recorded. You can stop at any time.

Participant agrees: ☐ (tick before starting)

## Session details

| Field | Value |
|---|---|
| Date (BST) | |
| Device / Android version | |
| Browser and version | |
| App build (commit / URL) | |
| Facilitator | |
| Language used for the tasks | Bangla |
| Was any coaching given? (Y/N) | |

---

## Tasks to read aloud (simple Bangla, with English beside)

| # | Bangla — read aloud exactly | English | What to watch |
|---|---|---|---|
| 1 | এই অ্যাপে ধানের পাতার একটা ছবি তুলুন, অথবা গ্যালারি থেকে আপলোড করুন। | Take a photo of a rice leaf in this app, or upload one from the gallery. | Can they start the photo flow without help? Where do they tap first? |
| 2 | এখন ফলাফলটা দেখুন। আপনার ভাষায় বলুন, এটা কী বলছে? | Now look at the result. In your own words, what is it saying? | Do they say it is a *possible* result, or do they think it is confirmed? |
| 3 | বাংলা অডিওটা একবার চালু করুন, তারপর থামিয়ে দিন। | Play the Bangla audio once, then pause it. | Do they find the play button? Do they understand the audio? |
| 4 | এই স্ক্রিনটা দেখুন। এখানে আপনাকে কী করতে বলছে, বলুন। | Look at this screen. What is it asking you to do? | Do they describe retaking a clearer photo? Do they mention 16123? |
| 5 | ১৬১২৩-এ কল করার বোতামটা কোথায়? দেখিয়ে দিন। | Where is the button to call 16123? Show me. | Do they find the call button without help? |

**Facilitator note for task 4:** hand over the phone with a deliberately blurry
photo or a non-rice photo so the app shows "not sure". Do **not** say the name
of the screen before reading the task.

---

## Results by participant

Use one row per participant (P1–P5). For T1–T5 enter **Y** if the participant
completed that task without help, **N** if help was needed.

| Participant (first name or initials) | T1 | T2 | T3 | T4 | T5 | Wrong taps (count / where) | Time to first result (s) | Thought it was a confirmed result (Y/N) | Audio understood (Y/N) | Quote (short) |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | |
| P2 | | | | | | | | | | |
| P3 | | | | | | | | | | |
| P4 | | | | | | | | | | |
| P5 | | | | | | | | | | |

**Notes on columns**
- *Wrong taps:* count taps that did not move towards the task (e.g. opening the
  language toggle instead of the camera) and write where they happened.
- *Time to first result:* from the end of the task-1 instruction to the result
  screen appearing.
- *Thought it was a confirmed result:* **Y** if they described the screen as a
  definite answer rather than a possible one.
- *Audio understood:* **Y** only if they can say what the audio told them.
- *Quote:* a few words only; no names or identifying details.

## Observed problems (free notes)

| Participant | Task | What happened (no coaching; exact words if possible) |
|---|---|---|
| | | |
| | | |
| | | |

---

## Pass criteria

| # | Pass criterion | Target | Measured | Met? (Y/N) |
|---|---|---|---|---|
| 1 | All participants can start the photo flow (task 1). | 5 of 5 | | |
| 2 | Participants understand that the result is a *possible* result, not confirmed (task 2). | ≥ 4 of 5 | | |
| 3 | All participants find the Bangla audio and the 16123 call button (tasks 3 and 5). | 5 of 5 | | |
| 4 | Participants know how to retry after "not sure" (task 4). | ≥ 4 of 5 | | |

Record the measured values as `n/5` and tick **Met?** only from the recorded
results. Do not estimate.

## Fixes made after the test

Only small, safe changes (`fix:` commits). Re-test the changed task with at
least one participant before marking the fix as verified.

| Date | Problem seen (task / participant) | Change made | Commit | Re-tested? (Y/N) | Notes |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

## Sign-off

| Question | Answer |
|---|---|
| Number of participants who completed all 5 tasks without help | |
| Pass criteria met (out of 4) | |
| Any change that needs a new release build? (Y/N) | |
| Facilitator | |
| Date (BST) | |
