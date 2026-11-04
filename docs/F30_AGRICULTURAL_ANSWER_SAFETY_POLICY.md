# F30: Agricultural Answer Safety Policy & Guardrails
**Document ID:** `docs/F30_AGRICULTURAL_ANSWER_SAFETY_POLICY.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** AgroLeaf AI Agronomy, Ethics & Safety Committee  
**Date:** 2026-11-04  
**Status:** Mandatory Production Guardrails  

---

## 1. Principles of Agricultural Safety

Smallholder farming communities in Bangladesh frequently encounter occupational health hazards from pesticide exposure, economic exploitation by unlicensed retail dealers, and crop failure from misapplied chemicals.

AgroLeaf AI's Voice Copilot enforces an unyielding safety protocol. The system is programmed to prioritize **farmer health, environmental safety, and scientific veracity** over generating speculative answers.

---

## 2. Mandatory Guardrail Rules

### Rule 1: Prohibited & Banned Agro-Chemicals
The engine strictly forbids suggesting or endorsing chemicals banned by the Government of Bangladesh, DAE, or the Stockholm Convention:
- ❌ **Paraquat / Gramoxone:** Lethal, highly toxic contact herbicide. Completely banned in Bangladesh.
- ❌ **DDT, Aldrin, Dieldrin, Endrin, Chlordane, Heptachlor, Toxaphene:** Organochlorine Persistent Organic Pollutants (POPs).
- ❌ **Monocrotophos & Methyl Parathion:** Class Ia/Ib acute neurotoxins.
- ❌ **Endosulfan:** Banned worldwide.
- ❌ **Carbofuran granules (Furadan) in standing fish-rice ecosystems:** Restricted due to severe aquatic toxicity.

*Enforcement:* The retrieval engine contains an automated blacklist filter. Any match triggers an immediate alert urging non-chemical or safe alternative practices.

### Rule 2: Mandatory PPE & Spraying Hygiene
Whenever any chemical fungicide or insecticide is mentioned, the Copilot automatically appends or emphasizes vital safety instructions:
- 😷 **Face Mask & Eye Protection:** Wear a mask or cloth over mouth and nose.
- 🧤 **Gloves & Full Sleeves:** Protect skin from direct chemical absorption.
- 💨 **Wind Direction:** Never spray against the wind.
- ☀️ **Time of Day:** Spray in the late afternoon (after 3:00 PM) or early morning before intense sunlight. Never spray in scorching midday sun.
- 🧼 **Post-Spray Hygiene:** Wash hands, face, and spray equipment thoroughly with soap and water away from ponds, livestock, and drinking water sources.

### Rule 3: Pre-Harvest Interval (PHI) / Withholding Period
- No chemical sprays may be recommended within **14 to 21 days** of harvest.
- If the crop is near harvesting (dough to mature grain stage), cultural drying and early harvesting are recommended instead of toxic chemical application.

### Rule 4: Strict Honest Abstention (Non-Hallucination)
When a farmer asks:
1. About crops outside rice (e.g. mango, jute, potato, poultry, cattle).
2. General non-agricultural questions (e.g. politics, entertainment, weather forecasts beyond BAMIS scopes).
3. Ambiguous, corrupted, or low-confidence acoustic inputs where the intent cannot be verified.

The system **MUST ABSTAIN** honestly and politely:
> *"এই বিষয়ে আমার কাছে বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI) এর যাচাই করা তথ্য নেই। সঠিক পরামর্শ পেতে অনুগ্রহ করে ১৬১২৩ নম্বরে বিনামূল্যে কল করুন অথবা আপনার ইউনিয়নের উপসহকারী কৃষি কর্মকর্তা (SAAO) এর সাথে যোগাযোগ করুন।"*

---

## 3. Human Escalation & Helpline 16123 Integration

The Copilot is an assistive tool, not an absolute replacement for human agronomists.
Every Copilot card and conversational turn provides a direct, accessible phone call link:
- 📞 **কৃষি কল সেন্টার (Krishi Call Centre):** `tel:16123` (Official DAE hotline operating 7:00 AM – 9:00 PM every day).
- 🧑‍🌾 **ইউনিয়ন উপসহকারী কৃষি কর্মকর্তা (SAAO):** Recommended point of contact for in-field sample confirmation.
