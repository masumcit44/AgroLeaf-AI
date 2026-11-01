# AIgnite 2026: competition compliance checklist

**Sources:**
- the official rules page https://yunet-aignite26.devpost.com/rules (read 1 Nov 2026)
- the organiser email
- the Devpost overview

The Updates page had no announcements on 1 Nov. **Re-check the Updates page, your email and the Facebook event (https://www.facebook.com/events/1105605668859713/) once a day until 5 Nov.** The rules say they may change.

| # | Rule (official wording, shortened) | Our status / action | Owner |
|---|---|---|---|
| 1 | **Sticker:** the official "Built For Ostad Presents YUNet AIgnite Buildathon 2026" sticker must be clearly visible **in the navbar or another prominent area near the top**. It "**must not be hidden at the end of the app or placed only in the footer**" | Navbar, every page, every state (home, preview, result, not-sure, accuracy, about), always visible on mobile, never inside a collapsed menu. Official file: Google Drive folder "Built for AIgnite 2026 Sticker" → `Built for AIgnite 2026.png` (1.1 MB, the only file) | M02 / you download |
| 2 | Functional **web app**, publicly accessible; judges must be able to access and test it | Cloudflare Pages + Vercel mirror; keep it **live at least until the Final Round (27 Nov)**. See row 12 | M02, M09 |
| 3 | AI must play a **meaningful role** | The CNN does the core task; calibrated abstention | ✅ by design |
| 4 | **Strictly individual**; one project only | Solo entry; one Devpost project | You |
| 5 | **Students in Bangladesh** (high school to undergraduate); proof of student status may be requested | Keep your student ID / enrolment proof ready | You |
| 6 | **Existing projects** allowed only with **meaningful improvements made for AIgnite** | All code is newly built for AIgnite (Git history from 1 Nov proves it). If asked, state that the idea and research began earlier, and that this web app was built for AIgnite | You (deck / Devpost text) |
| 7 | **Rights to third-party content, software, datasets** | Datasets CC BY 4.0, credited with DOIs (About + Accuracy pages + README). Fonts: Google Fonts (OFL). onnxruntime-web: MIT. BAMIS text quoted with a source link. **Open items:** (a) the Azure voice output terms (see row 8); (b) the earlier idea research was made with others, so get their agreement before submitting | You |
| 8 | Comply with third-party **terms of service** | Azure free tier: confirm that generated audio may be used in a public app, **or record the 7 clips yourself** (zero-risk option). Cloudflare/Vercel free plans: personal/non-commercial use is fine | You (M06) |
| 9 | **Deck: max 5 slides** covering Problem, Solution, How it works, **Participant introduction**, other info | `documentation/buildathon_presentation_notes.md` | You (M09) |
| 10 | **Demo video optional; if submitted, in English**, on YouTube | ~2-min English script in M09 | You |
| 11 | GitHub link optional; organisers may request source code | Public repo already exists | ✅ |
| 12 | Submission only on **Devpost**; links must be accurate and accessible | After submitting, **do not break the judged URL.** Production deploys come from a `release` branch (M09), so later work on `main` cannot break what judges see | M09 / you |
| 13 | **Judging** (rules page lists 5 criteria): Problem & User Value · Solution & Innovation · AI & Technical · UX & Product Readiness · **Presentation & Pitch** | Devpost shows marks for the first 4 (12/12/10/16). "Presentation & Pitch" (clarity, demo, explanation) matters too, especially in the Final Round. The deck, video and in-app demo flow must be clear | You |
| 14 | Deadline **5 Nov 2026, 11:59 PM Bangladesh time** | Internal target **6 PM** | All |
| 15 | Failing a mandatory requirement can lead to disqualification | The mandatory items are the live app, the deck and the sticker | All |

## Sticker implementation rules (for Antigravity)
- Use the **official file unchanged in design**. No recolouring, cropping or redrawing.
- Resizing for speed **is allowed** (same image, smaller pixel size).
- Keep the original as `frontend/public/brand/aignite-sticker-original.png`. Serve a proportionally resized copy, about 2× the displayed height (e.g. 120 px tall), as `aignite-sticker.png`.
- Display height 44–52 px on mobile, up to 64 px on desktop. Keep the aspect ratio. Give it a light background behind if contrast needs it.
- `alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"`.
- Inside the sticky navbar, on every route and every state. Never covered by banners or modals. Never only in the footer.
- Also place the sticker on the deck's title slide and in the demo video's opening shot (not required, but it signals compliance).
