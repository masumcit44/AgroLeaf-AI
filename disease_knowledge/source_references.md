# Sources for the disease knowledge files

## Levels of trust
| Level | Meaning | Allowed use |
|---|---|---|
| **A — Official Bangladesh** | BAMIS (DAE) government site | The only source for any chemical name or dose, quoted word for word, with a link |
| **B — Credible secondary** | National rice institutes' guides, reported extension-service text | Symptoms and cultural prevention, rewritten in simple words |
| **C — Our own wording** | Simple Bangla explanations written for this app | Must be reviewed by an agronomist before launch (`verification_status`) |

## Sources used (all accessed 1 Nov 2026)
1. **BAMIS rice disease list (DAE)**, Bangla: https://www.bamis.gov.bd/diseases/1/all/76 · English: https://www.bamis.gov.bd/en/diseases/1/all/76/
   - **What it gives:** 10 rice diseases with favourable weather, control measure (দমন ব্যবস্থা), infestation stage, and for some diseases chemical names with doses.
   - **What it does not give:** symptoms, causal organisms, or per-disease detail pages.
   - **Leaf Smut is not listed.**
2. **Blast symptoms (Krishi Tathya Service text, reported by bdnews24, 12 Apr 2023):** https://bangla.bdnews24.com/samagrabangladesh/f86ikgweqz
   - Covers leaf, node and panicle blast, and lesion description.
3. **PhilRice, "Major diseases of the rice plant in the Philippines"** (government rice institute): https://www.philrice.gov.ph/wp-content/uploads/2023/02/Major-diseases-of-the-rice-plant-in-the-Philippines.pdf
   - Tungro symptoms and green leafhopper vector; sheath blight cultural control; excess nitrogen raising blast, sheath blight and BLB.
4. **Rice diseases and their management (open textbook, IRRI-derived):** https://opentextbooks.colvee.org/integrateddiseasemanagement/wp-content/uploads/sites/35/2023/12/Rice-diseases-and-their-management.pdf
   - Brown spot as seed-borne; clean seed; avoid drought stress; resistant varieties for blast.
5. **TBS News, "Blast disease eats into rice yields, BRRI looks for resilient varieties":** https://www.tbsnews.net/agriculture/blast-disease-eats-rice-yields-brri-looks-resilient-varieties-782534
   - BRRI: about 1% of annual output is lost to blast.
6. **Team research reference:** Plantwise Knowledge Bank, "Management of Bacterial Leaf Blight (BLB) — Bangladesh", https://plantwiseplusknowledgebank.org/doi/full/10.1079/pwkb.20167800391
   - BLB is **not** an MVP class; kept for future use. Not opened by me.

## Scientific names
These are standard plant-pathology names (Level B). Confirm them against IRRI Rice Knowledge Bank fact sheets (knowledgebank.irri.org) before putting them on a slide:
- Blast: *Magnaporthe oryzae*
- Brown spot: *Bipolaris oryzae*
- Leaf smut: *Entyloma oryzae*
- Sheath blight: *Rhizoctonia solani*
- Tungro: RTBV + RTSV, carried by *Nephotettix* leafhoppers

## Still to do before launch
- [ ] Copy the exact BAMIS Bangla text for Tungro and Sheath Blight into `text_bn_verbatim` (currently placeholders).
- [ ] Check with DAE or an officer that the insecticides BAMIS lists for Tungro are still registered.
- [ ] Have one agronomist, extension officer or agriculture student read all `*_bn` text. Change `verification_status` once reviewed.
- [ ] Look for an official Bangla source on Leaf Smut. If none is found, keep its card minimal.
- [ ] Optional: find official BRRI or AIS Bangla videos per disease (verified links only).
