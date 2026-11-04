# F30 Agricultural Knowledge & Chemical Safety Audit
**AgroLeaf AI — Evidence Grounding, Chemical Bans & 16123 Tariff Accuracy**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Agricultural Knowledge Engineer & Safety Reviewer

---

## 1. Executive Summary

Farmers rely on AgroLeaf AI for critical advice on crop protection. Providing inaccurate chemical dosages, suggesting banned pesticides, or promising guaranteed cures can lead to severe crop failure, ecological poisoning, and legal liability.

This audit reviews every active ingredient, commercial brand example, dosage recommendation, and institutional source cited across the knowledge base.

---

## 2. Institutional Traceability & Source Citation Matrix

Every agricultural recommendation is grounded in officially published protocols:

| Pathogen / Topic | Approved Active Ingredient & Dosage | Commercial Example in Bangladesh | Authoritative Source Document |
|---|---|---|---|
| **Rice Blast** (*M. oryzae*) | Tricyclazole 75 WP @ $0.75\text{ g/L}$ water, or Azoxystrobin + Difenoconazole @ $1.0\text{ mL/L}$ water | Trooper 75 WP / Beam 75 WP / Amistar Top 325 SC | BRRI "আধুনিক ধানের চাষ" (21st Edition, 2024), p. 54–56 |
| **Brown Spot** (*B. oryzae*) | Mancozeb 75 WP @ $2.0\text{ g/L}$ water, or Propiconazole 25 EC @ $1.0\text{ mL/L}$ water | Dithane M-45 / Indofil / Tilt 250 EC | BRRI "ধানের রোগ ও তার প্রতিকার", p. 12–14; DAE BAMIS Bulletin |
| **Leaf Smut** (*E. oryzae*) | Propiconazole 25 EC @ $1.0\text{ mL/L}$ water | Tilt 250 EC | IRRI Rice Knowledge Bank; BRRI Plant Pathology Division |
| **Sheath Blight** (*R. solani*) | Hexaconazole 5 EC @ $1.0\text{ mL/L}$ water, or Validamycin 3% @ $2.0\text{ mL/L}$ water | Contaf 5 EC / Sheathmar 3 L | BRRI "আধুনিক ধানের চাষ", p. 57; DAE Advisory Protocol |
| **Rice Tungro Virus** | Vector Control: MIPC 75 WP @ $1.5\text{ g/L}$ water, or Imidacloprid 20 SL @ $0.5\text{ mL/L}$ water | Mipcin 75 WP / Admire 20 SL | BRRI Entomology & Virology Protocols |

---

## 3. Strict Chemical Safety & Prohibited Substances Filter

AgroLeaf AI enforces an automated filter that blocks and warns against hazardous agrochemicals banned by the Ministry of Agriculture, Government of Bangladesh:

| Banned Chemical (Bengali & English) | Hazard Class & Legal Status | System Action Upon Mention | User-Facing Warning |
|---|---|---|---|
| **প্যারাকুয়াট / গ্রামোক্সন** (Paraquat / Gramoxone) | WHO Class II / Severe Toxin; BANNED in Bangladesh since 2018 | **Hard Alert & Interception** | "সাবধান! প্যারাকুয়াট (গ্রামোক্সন) জীবনঘাতী এবং বাংলাদেশে সম্পূর্ণ নিষিদ্ধ। কখনো এই বিষ ব্যবহার করবেন না।" |
| **ডিডিটি** (DDT) | Persistent Organic Pollutant; BANNED | **Hard Alert & Interception** | Warns of extreme environmental persistence and illegality. |
| **এন্ডোসালফান** (Endosulfan) | Organochlorine Neurotoxin; BANNED | **Hard Alert & Interception** | Warns of livestock toxicity and legal prohibition. |
| **এলড্রিন / ডাইএলড্রিন** (Aldrin / Dieldrin) | BANNED | **Hard Alert & Interception** | Immediate prohibition notice. |

---

## 4. Tariff Correction for Agricultural Helpline 16123

### 4.1 Prior Erroneous Phrasing
Commit `7418bf3` previously stated:
- *"কৃষি কল সেন্টার (বিনামূল্যে): ১৬১২৩"*
- *"টোল-ফ্রি হেল্পলাইন: ১৬১২৩"*

### 4.2 Verified Fact Check
While the Ministry of Agriculture operates the Krishi Call Centre via shortcode 16123, mobile network operators (Grameenphone, Banglalink, Robi, Teletalk) have historically charged standard shortcode call rates (approx. 25 paisa/min + VAT/SD) depending on periodic government subsidy renewals. Stating that the call is unconditionally "বিনামূল্যে" (free) or "টোল-ফ্রি" (toll-free) is factually misleading.

### 4.3 Mandatory Neutral Phrasing
All occurrences of 16123 across UI, text responses, and voice transcripts have been updated to the verified neutral text:
> **"কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন। কলের বর্তমান চার্জ আগে যাচাই করুন।"**
*(You may contact Krishi Call Centre 16123. Please verify current call charges in advance.)*
