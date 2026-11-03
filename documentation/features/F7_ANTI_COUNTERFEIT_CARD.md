# F7 — Anti-counterfeit input awareness card: research, roadmap, release record

Written 3 Nov 2026. Feature F7 of `D:\Desktop\AIgnite 2026\features\AI_BATTLE_FEATURE_SHORTLIST.md`.

## 1. Research (checked 3 Nov 2026)

| Finding | Source | Strength |
|---|---|---|
| Pesticide brands must be registered. Importing, producing or pest-control work needs a licence. Clear Bengali labels must be attached to containers before selling, advertising or storing. Purchasers can ask for a sample to be tested. Unauthorised use of a registration number and adulteration are offences (fine and prison). Mobile courts have jurisdiction. | Pesticides Act 2018 (Act 24 of 2018), FAOLEX abstract on UNEP LEAP: https://leap.unep.org/en/countries/bd/national-legislation/pesticides-act-2018-no-24-2018-law ; Bengali text: https://faolex.fao.org/docs/pdf/bgd218679.pdf | Primary-law summary [V: page read] |
| The registration authority is the Plant Protection Wing (DAE). | USDA FAIRS report (2021): https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=Food+and+Agricultural+Import+Regulations+and+Standards+Country+Report_Dhaka_Bangladesh_06-30-2021.pdf | Secondary [R] |
| Labels and leaflets in Bengali; manufacturer name on the packs; indelible ink; no "safe" / "non-poisonous" claims. | Pesticide Rules 1985 (amended 2010), IPPC copy: https://www.ippc.int/static/media/files/cnpublications/2013/06/05/1336289405_pesticide-rules-19851_201304232116en.pdf | Primary but older; may be superseded [R] |
| Agricultural pesticides in the registered list carry numbers beginning **AP-**; public-health ones **PHP-**. | Bangladesh Crop Protection Association list (to 2020): https://bcpabd.com/wp-content/uploads/2021/01/Registered-pesticide-List-of-Bangladesh-upto-2020.pdf | Industry compilation, not the official register [R]. Hence the card says "usually starts with AP". |
| District DAE offices register and renew dealers and monitor adulterated fertiliser, pesticide and PGR. | DAE Bagerhat services page: https://dae.bagerhat.gov.bd/pages/static-pages/6981335235ce18e1c06fbc42 | Official, search snippet [R] |
| Fake packets found without a licence number or manufacturer address; DAE announced mobile courts. Traders fined for expired pesticide (Thakurgaon, 2026). | The Daily Star, "Spurious pesticides flood markets": https://online91.thedailystar.net/country/news/spurious-pesticides-flood-markets-1333039 ; Dhaka Tribune (Thakurgaon): https://www.dhakatribune.com/bangladesh/nation/404794/pesticide-trader-fined-in-thakurgaon | Press [R] |
| **Farmers cannot reliably detect counterfeits by looking at the label or pack; even importers sometimes cannot.** Checking that a product is registered is the feasible step; counterfeits need lab analysis. | Egypt farmer study (encyclopedia.pub summary): https://encyclopedia.pub/entry/14935 ; MSU Food Security Policy brief (Mali): https://www.canr.msu.edu/fsp/publications/policy-research-briefs/FSP%20Policy%20Brief%20101.pdf ; FAO/WHO guidance note on illegal trade (for regulators): https://www.who.int/publications/i/item/9789240109162 | Research [R] |

**Design consequences**
1. The card must **not** promise that a farmer can spot a fake by eye. It says: buy registered products from a licensed dealer, check the basic label facts, refuse open or expired packs, and **report a suspected fake** (keep the pack and receipt; the law lets buyers ask for a test).
2. No product names, doses or "safe" claims. This keeps the app's rule that dose decisions belong to the agriculture officer.
3. Content status is **"not yet reviewed by an agronomist"**, the same as the rest of the disease text. The card says so in its source line.

## 2. Roadmap

| Phase | What | Status |
|---|---|---|
| **1 (now)** | Static, bilingual, collapsible card on every **disease** result: 5 checks plus a source line. Not shown for healthy or "not sure" results. Unit tests and a live check. | Implemented 3 Nov 2026 |
| 2 | Agronomist / DAE officer review of the wording; record the reviewer and date in `disease_knowledge/source_references.md` | Waiting for a reviewer (shortlist item F6b) |
| 3 | "Is this brand registered?" lookup, **only if** DAE publishes an official, current registered-pesticide list that can be shipped offline (with its date shown). Do not use unofficial lists for a yes/no answer. | Not started; data source UNVERIFIED |
| 4 | "Report a suspected fake" helper: a prefilled message to the Upazila office or 16123 with a photo of the pack (on device; shared only by the farmer) | Not started |
| 5 | Bangla voice clip for the card (same voice pipeline as F4b) | Optional |

## 3. Phase 1 acceptance checks
- Card text in Bangla and English, identical meaning; the i18n key parity test passes.
- Shown on disease results only; collapsed by default so the diagnosis stays first.
- No dose, product or brand names; no claim that the farmer can identify fakes by sight.
- Unit tests, lint, build; live preview check on a disease result and a healthy result; then production.
