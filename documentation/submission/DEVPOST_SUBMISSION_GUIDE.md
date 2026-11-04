# AgroLeaf AI — Devpost Submission Guide

## Confirmed official facts (from instructions.txt / instructions_from_website.txt / website_link.txt)
- **Deadline:** **5 November 2026, 11:59 PM, Bangladesh time.** Submit early; the organisers say not to wait for the last moment.
- **Only channel:** Devpost, https://yunet-aignite26.devpost.com/ . Email, WhatsApp, Google Forms and other channels are not accepted.
- **Solo only,** and **one project** per participant. If Devpost prompts you to make a team, ignore it.
- **Mandatory:**
  - a publicly accessible **live web app**;
  - the **official sticker** clearly visible in the navbar or near the top of the app;
  - a **presentation deck, max 5 slides** (problem, proposed solution, how it works, your introduction, other key information).
- **Optional:** a demo video (**YouTube link, English only**) and a GitHub link.
- **Judging (50):** Problem & User Value 12 · Solution & Innovation 12 · AI & Technical Implementation 10 · UX & Product Readiness 16.
- **Not specified in the files:** the exact Devpost form field names and the deck file format. Check them on the page.

## A. Step by step
1. Open https://yunet-aignite26.devpost.com/ and sign in with your **registered** Devpost account (top right).
2. On the hackathon page, click the submission button. *(The exact label needs confirming on the page; usually "Enter a submission" or "Submit project".)*
3. Create a new project, or edit your draft if one exists.
4. Fill in the fields with the copy in section B. The usual Devpost fields are: project name, tagline, the "About the project" story, "Built with" tags, links ("Try it out"), a video link, image gallery and files. *(Confirm on the page.)*
5. **Live website:** paste https://agroleaf-ai.pages.dev into the "Try it out" / website link field.
6. **GitHub:** paste https://github.com/masumcit44/AgroLeaf-AI into the same links area, if there's room.
7. **Presentation:** upload `AgroLeaf_AI_Buildathon_Final.pdf`. PDF is safest; if only a link is accepted, upload it to Google Drive and share the link as "Anyone with the link can view". *(Confirm the upload field on the page.)*
8. **Video (optional):** paste the YouTube link into the video field.
9. **Images:** upload the 3 screenshots (section C).
10. Answer any hackathon-specific questions. Check the solo/eligibility box if there is one.
11. Click **Submit**. Then open the hackathon's project gallery or "My projects" and confirm the project shows as **submitted** to *Ostad Presents YUNet AIgnite Buildathon 2026*, not just saved as a draft. Watch for a confirmation email and take a screenshot.

## B. Copy-ready text (verified facts only)
**Project name:** AgroLeaf AI — এগ্রোলিফ এআই

**Tagline:** Photograph a rice leaf, get an honest answer in Bangla — and hear it in Bengali.

**Short description:** AgroLeaf AI helps Bangladeshi rice farmers check a sick rice leaf with their phone. An AI model running inside the browser suggests the likely disease, or honestly says "not sure". It explains the result in simple Bangla, reads it aloud in a Bengali voice, and points the farmer to safe next steps and the 16123 helpline.

**Problem:** Rice diseases such as blast, brown spot, sheath blight and tungro can spread within days. Farmers often cannot show a leaf to an agriculture officer in time. Many digital tools are English-only, need a strong connection, or always give a confident answer, and a wrong guess can mean buying the wrong pesticide.

**Solution:** One photo → on-device AI → an honest answer in Bangla. The app shows the likely disease and how reliable such results were in testing, then gives a this-week plan, a pesticide-buying safety checklist and a one-tap 16123 call. A voice assistant answers common rice questions in Bangla or Banglish.

**Target users:** smallholder rice farmers in Bangladesh, and the extension workers who support them.

**Core features:**
- On-device leaf scanning, with an honest "not sure" when uncertain.
- Bangla explanation with a recorded Bengali voice.
- A reliability level for each result.
- A this-week plan and the 16123 helpline.
- A voice assistant: 122 common answers are pre-recorded in Bengali.
- A safety filter: never names a pesticide or a dose.
- Scan history and follow-up reminders.
- A 7-day weather disease-risk view.
- Works offline after the first visit.

**AI/ML:**
- **Model:** EfficientNet-B0 (version 10), trained with PyTorch on Bangladeshi and regional rice-leaf datasets, with 8 outputs including "not a rice leaf" and "other rice problem".
- **Runs in the browser:** exported to ONNX (15.3 MB) and run with ONNX Runtime Web (WebAssembly).
- **Honest decisions:** temperature calibration and abstention rules.
- **Measured accuracy** (each set read once, never used for tuning):

| Test set | Photos | Accuracy |
|---|---|---|
| Internal held-out test | 1,467 | 86.7% |
| DIU Bangladesh, independent half | 1,375 | 80.1% |
| Aman 2025 field set | 422 | 86.2% |
| Real-field photos, Sylhet–Dhaka (the hard case) | 1,446 | 44.4% |

**Innovation:**
- Runs fully on the phone, keeping photos private and working offline.
- Calibrated abstention instead of forced guesses.
- Genuine Bangladeshi Bengali audio rather than a robotic English voice.
- A strict rule against AI-written pesticide doses.
- Public accuracy numbers, including the weak case.

**Practical impact:** gives farmers a fast, private first check in their own language, and steers them toward safe action and expert help. Farmer-impact numbers have not been measured yet.

**Built with:** React 19, Vite, Tailwind CSS, PWA (Workbox), IndexedDB, ONNX Runtime Web, PyTorch, EfficientNet-B0, Cloudflare Pages / Functions / D1, edge-tts (bn-BD).

**Future scope:** agronomist review of all advice, field testing with farmers, more crops and varieties.

**Known limitations:**
- Accuracy drops on real field photos from new regions (44.4% on the Sylhet–Dhaka set).
- Disease text has not yet been reviewed by an agronomist.
- Planner-generated answers are spoken only on phones that have a Bengali voice.
- It is a screening aid, not a diagnosis.

## C. Assets (local paths)
- Live website: https://agroleaf-ai.pages.dev
- GitHub: https://github.com/masumcit44/AgroLeaf-AI
- Final deck: `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt\documentation\submission\AgroLeaf_AI_Buildathon_Final.pdf` (and `.pptx`); alternative: `...\documentation\submission\variants\AgroLeaf_AI_Variant_A_Premium.pdf`
- Screenshots: `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt\documentation\screenshots\release\01_home.png`, `02_result_blast.png`, `04_voice_assistant.png`
- Video: your YouTube link (optional)

## D. Final pre-submission checklist
- [ ] https://agroleaf-ai.pages.dev opens (also check on a phone).
- [ ] The official sticker is visible at the top.
- [ ] Sample scan → result → ▶ শুনুন works.
- [ ] The deck has 5 slides or fewer; no placeholders; your name and photo are correct.
- [ ] The video, if made, is in English, on YouTube, and Unlisted or Public.
- [ ] The GitHub repo opens in an Incognito window.
- [ ] Every link was pasted correctly (no trailing spaces).
- [ ] All required Devpost fields are filled.
- [ ] Status shows **Submitted** (not Draft); screenshot and confirmation email saved.
- [ ] Done before **5 Nov 2026, 11:59 PM Bangladesh time**.
