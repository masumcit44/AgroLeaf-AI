# Kilo Code — T21: F21 Farmer profile (Batch 1)

Read `B1_COMMON_RULES.md` (same folder) first.

**Before starting, the owner must give Kilo Code a model provider.** The screenshot showed "No providers".

**Open `D:\Desktop\AIgnite 2026\AgroLeaf_kilo_wt` in its own VS Code window.** Do not work in `AgroLeaf_AI_AIgnite_2026`: that is Antigravity's folder.

The worktree is ready on branch `feat/f21-profile`; run `cd frontend && npm ci`.

## Files you own
- `frontend/src/features/profile/**` (code, `i18n.js`, `__tests__/`, `districts.json`)

## Do
1. **`profileStore.js`** in your folder:
   - `getProfile()`, `saveProfile(p)`, `deleteProfile()`, using `STORES.PROFILE` with key `'self'` (`lib/store/db.js`);
   - stored shape: `{ district_code, district_name_bn, district_name_en, lat, lon, season, variety, transplant_date, updated_at }`.
   - Every field is optional. Other features (weather, action plan) import `getProfile()` read-only, so keep this API stable.
2. **District list `districts.json`:** the 64 districts of Bangladesh with **code, Bangla name, English name and centroid lat/lon**.
   - **Do not invent coordinates.** Take them from a source with a stated licence: first choice, the OCHA/HDX Bangladesh administrative boundaries (COD-AB, https://data.humdata.org/dataset/cod-ab-bgd); compute centroids from the admin-2 polygons.
   - Record the source URL, licence and date in `features/profile/DISTRICTS_SOURCE.md`.
   - If the licence is unclear, **stop and report** instead of guessing.
   - Bangla names must be checked against the source; mark any you could not verify.
3. **`ProfilePage`** (`#/profile`):
   - district picker (searchable, in Bangla or English);
   - season (বোরো / আমন / আউশ);
   - variety (free text, optional);
   - transplanting date (optional);
   - Save, and "Delete my profile".
   - **No name, phone, exact GPS or photo fields.**
   - One sentence explaining that the data stays on the phone.
4. **`ProfilePrompt`** (home): when no district is set, one small line "Set your area for local weather" that links to `#/profile`. When set, show the district name with an "edit" link.
5. Texts in `features/profile/i18n.js` (`profile.*`), Bangla first.

## Acceptance
- Unit tests with `fake-indexeddb/auto`: empty profile, save, update, delete; `districts.json` has 64 unique codes and every lat/lon lies inside Bangladesh (lat 20.5–26.7, lon 88.0–92.7).
- Works with no profile at all.
- Screenshots (390 px, BN and EN) on the branch preview with `?features=profile`.
- `npm test`, `npm run lint`, `npm run build` pass.
