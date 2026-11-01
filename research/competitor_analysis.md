# Competitors (extracted from team research; status as reported there)

**Main source:** `ai_battle/AgroLeaf_Core_AI_BN/Research/Core_AI_Research_Report.md` (1 Nov 2026), which uses a careful "?" for unverified items. Its source URLs are copied below.

| Platform | Image disease ID | Bangla voice | Notes | Sources |
|---|---|---|---|---|
| **Rice Solution (BRRI + ICT Division)** | ✓ rice disease/pest (photo or description) | ? ("voice from text" listed; language not verified) | Rejects non-paddy photos; location-based reports | [Dhaka Tribune](https://www.dhakatribune.com/bangladesh/301860/brri-launches-rice-solution-mobile-app), [Financial Express](https://old.thefinancialexpress.com.bd/national/brri-develops-app-to-protect-rice-plants-from-diseases-1672584427), [App Store](https://apps.apple.com/us/app/rice-solution/id1663661762) |
| **Dr. Chashi** | ✓ multi-crop (company claims 92%, 17 crops, 68 diseases/insects) | ? | ~94k downloads (AppBrain); accuracy self-reported | [Daily Star](https://www.thedailystar.net/supplements/climate-heroes/news/dr-chashi-revolutionising-agriculture-through-ai-3837206), [TBS](https://www.tbsnews.net/node/630290) |
| **BAMIS (DAE)** | ✓ (Play listing: rice, potato, tomato) | ? | Government; weather-led; disease list with control measures | [Play](https://play.google.com/store/apps/details?id=bd.gov.bamis.bamisportal), [bamis.gov.bd](https://www.bamis.gov.bd/en/page/about-bamis-portal/) |
| **Plantix** | ✓ 30 crops | ? | 2021 USAID pilot in 7 districts | [Digital Frontiers](https://dfrl-prod.herokuapp.com/resources/bangladesh-digital-agriculture-activity-plantix-pilot-success-stories) |
| **Krishoker Janala** | Picture catalogue (no AI) | ? | Delisted, per team files | [FileHippo](https://filehippo.com/android/download_ksskr-jnl/) |
| **16123 Krishi Call Centre** | Human experts by phone | ✓ spoken | Our escalation partner, not a competitor | ais.gov.bd |

## Update 1 Nov 2026 (cross-AI research)
- **Dr. Chashi already reads instructions aloud in Bangla.** [TBS](https://www.tbsnews.net/node/630290) reports "the functionality to read out all instructions has been built into the app". A third-party listing also claims online and offline use ([AppBrain](https://www.appbrain.com/app/dr-chashi/com.medinatech.drchashi)).
- **Rice Solution:** non-rice photo rejection, voice-from-text, and offline image collection are described.
- **Therefore** Bangla audio and basic rejection are **not differentiators**. The defensible angle is **calibrated "not sure" + published external-district accuracy + on-device privacy, with no install**. See `documentation/MVP_requirements.md` §1.

## Conclusion
Never say "first" or "only".

**Defensible differences** (not found in competitors' public descriptions; this does **not** prove they are absent):
- a calibrated "not sure" answer
- Bangla audio for every result
- **published accuracy on unseen Bangladeshi districts**
- a web app with no install, where the photo stays on the phone

**Do not use:**
- the "review-mining %" numbers or the "0% of apps refuse blurry images" claim in `Farmer_Needs_and_Gaps.md` (see the audit report §5)
- the app-name conflict ("Dhan Surokkha" vs "Rice Solution") until it is checked on the Play Store
