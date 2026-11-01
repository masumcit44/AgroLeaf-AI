# M02 — Frontend scaffold, layout, i18n, sticker, and first deploy

**Goal:** a deployed, mobile-first React app shell. It has the sticker in the navbar, Bangla/English switching, and empty Home / Accuracy / About views. No ML yet.
**Branch:** `feat/m02-frontend-scaffold` · **Tag:** `m02`
**User gates:**
- (a) the sticker file at `frontend/public/brand/aignite-sticker.png`
- (b) connecting Cloudflare Pages (steps at the end)

If the sticker is missing, use a clearly labelled grey placeholder box ("AIgnite sticker") and mark the gate in PROGRESS.md. **Never ship to judges without the real sticker.**

Read first: `documentation/frontend_spec.md`, `documentation/system_architecture.md`.

## Steps
1. Scaffold: from the repo root, run `npm create vite@latest frontend -- --template react` (JavaScript). Then `cd frontend && npm install`.
2. Tailwind v4 via the Vite plugin: `npm install -D tailwindcss @tailwindcss/vite`. Add `tailwindcss()` to `vite.config.js` plugins. Put `@import "tailwindcss";` in `src/index.css`.
3. Delete the Vite demo assets and counter. Set up this structure:
```
frontend/
  index.html                 lang="bn", Google Fonts: Noto Sans Bengali (400,600,700) + Hind Siliguri fallback, display=swap; meta viewport; title "AgroLeaf AI — ধানের পাতার রোগ"
  public/
    brand/aignite-sticker.png   (user provides)
    _headers                     (copy exactly from documentation/system_architecture.md)
    favicon.svg                  (simple leaf icon you draw in SVG)
  src/
    main.jsx  App.jsx  index.css
    i18n/  bn.js  en.js  I18nProvider.jsx  useT.js
    routes/useHashRoute.js       (#/ , #/accuracy , #/about ; no react-router)
    components/ Navbar.jsx  Footer.jsx  BigButton.jsx  LanguageToggle.jsx  PageContainer.jsx
    pages/ HomePage.jsx  AccuracyPage.jsx  AboutPage.jsx
    lib/   (empty for now)
    ml/    (empty for now)
```
4. **Design tokens** (in `index.css` via `@theme`):
   - `--color-leaf-700:#1f6b3a`, `--color-leaf-50:#eef7f0`, `--color-amber-600:#b45309`, `--color-danger-700:#9f1d1d`, `--color-paper:#fbfaf6`, `--color-ink:#1c1c1c`
   - font family `"Noto Sans Bengali","Hind Siliguri",system-ui,sans-serif`
   - base font 18px, Bangla line-height 1.65
4b. **Sticker file (official rules, read `documentation/competition_compliance.md`):**
   - The organiser's file is `Built for AIgnite 2026.png` (1.1 MB). Save the untouched original as `public/brand/aignite-sticker-original.png`.
   - Create a proportionally resized copy about 120 px tall as `public/brand/aignite-sticker.png`, with Pillow or any resizer. Same image; no recolouring, cropping or redrawing. Commit both.
   - The rules say the sticker must be near the top and "must not be hidden at the end of the app or placed only in the footer". It must therefore appear on **every route and every state**, and must **never** be inside a collapsed/hamburger menu or covered by a banner or modal.
5. **Navbar** (sticky, top):
   - **AIgnite sticker, left, height 44–52 px, always visible on mobile**, with `alt="Built for Ostad Presents YUNet AIgnite Buildathon 2026"`
   - App name "এগ্রোলিফ এআই" with small "AgroLeaf AI" under it
   - Language toggle "EN / বাংলা" on the right
   - Links to Accuracy/About in a simple menu (icon + text)
6. **HomePage:**
   - Headline "ধানের পাতার ছবি দিন, সম্ভাব্য রোগ জানুন" ("Give a photo of a rice leaf, find the likely disease")
   - One sub-line on how to take a good photo
   - A large disabled primary button "📷 ছবি তুলুন / আপলোড করুন" ("Take / upload photo") with the note "শীঘ্রই চালু হবে" ("coming soon"; enabled in M03)
7. **Footer** on every page:
   - disclaimer from `disease_information_bn.json` `_meta.disclaimer_bn` (read the JSON; do not retype it)
   - privacy line "ছবি আপনার ফোনেই থাকে, কোথাও পাঠানো হয় না" ("the photo stays on your phone and is not sent anywhere")
   - link to About
8. **i18n:** all strings in `bn.js`/`en.js`. Default `bn`. Persist the choice in `localStorage` inside try/catch. Set `<html lang>` on change.
9. **AccuracyPage and AboutPage:** headings + "মূল্যায়ন চলছে / Evaluation in progress" placeholder. About lists dataset credits from `research/research_references.md` (the RiceLeafDiseaseBD v3 citation with DOI) and the competition line.
10. Scripts in `package.json`: `dev`, `build`, `preview`, `lint`. Add ESLint (from the Vite template) and make `npm run lint` pass.

## Cloudflare Pages connect (user does this in the dashboard; write these steps into README "Deploy" section)
- Workers & Pages → Create → Pages → Connect to Git → `masumcit44/AgroLeaf-AI`
- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Output:** `dist`
- **Environment variable:** `NODE_VERSION` = `22`
- After the first deploy, record the `*.pages.dev` URL in README "Live demo" and in PROGRESS.md.

## Acceptance checks
- [ ] `npm run build` and `npm run lint` pass. There are no console errors in `npm run dev`.
- [ ] At 360×740 (Chrome DevTools, mobile): the sticker is visible in the navbar, there is no horizontal scroll, and all text is readable.
- [ ] The language toggle switches every visible string, and the choice survives a reload.
- [ ] `public/_headers` exists with the exact content from the architecture doc.
- [ ] The Cloudflare URL loads (or the gate is marked ⛔ if the user hasn't connected yet).
- [ ] Commits (examples):
  - `feat(frontend): scaffold React + Vite app with Tailwind v4`
  - `feat(ui): add navbar with AIgnite sticker and Bangla-first layout`
  - `feat(i18n): add Bangla/English dictionaries with persisted toggle`
  - `chore(deploy): add Cloudflare Pages cache headers`
