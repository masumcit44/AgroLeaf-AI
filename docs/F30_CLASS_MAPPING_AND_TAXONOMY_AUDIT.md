# F30 Class Mapping & Agricultural Taxonomy Audit
**AgroLeaf AI — Alignment Between Classifier Outputs & Knowledge Base Entities**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Agricultural Pathologist & Knowledge Engineer

---

## 1. Executive Summary

A critical requirement of AgroLeaf AI's Copilot is exact semantic alignment between the computer vision classifier's predicted classes and the agricultural knowledge base entities. The Copilot must never produce recommendations for unvalidated classes or conflate distinct pathological conditions.

This audit cross-verifies the 8 production model classes against the knowledge base ontology in `frontend/src/features/copilot/data/agricultural_kb.js`.

---

## 2. Model Class Mapping & Agronomic Verification

| Model Class Index & Key | Scientific Pathogen | Common Bengali Name | KB Entity Key | Taxonomy Status | Agronomic Guidance Path |
|---|---|---|---|---|---|
| **0: `healthy`** | None (Physiologically Normal) | সুস্থ পাতা | `healthy` | **Exact 1:1 Match** | Advises zero chemical sprays; promotes bird perching (পার্চিং) and balanced split fertilizer. |
| **1: `blast`** | *Magnaporthe oryzae* (Fungus) | ব্লাস্ট রোগ | `blast` | **Exact 1:1 Match** | Recommends Tricyclazole 75 WP (Trooper / Beam) or Azoxystrobin + Difenoconazole; stop urea. |
| **2: `brown_spot`** | *Bipolaris oryzae* (Fungus) | বাদামি দাগ রোগ | `brown_spot` | **Exact 1:1 Match** | Recommends Mancozeb 75 WP or Propiconazole 25 EC (Tilt); apply potash & zinc. |
| **3: `leaf_smut`** | *Entyloma oryzae* (Fungus) | লিফ স্মাট রোগ | `leaf_smut` | **Exact 1:1 Match** | Recommends Propiconazole or Hexaconazole; balanced fertility. Cleanly segregated from Brown Spot. |
| **4: `tungro`** | RTBV + RTSV (Viruses) | টুংরো রোগ | `tungro` | **Exact 1:1 Match** | Identifies Green Leafhopper vector (*Nephotettix virescens*); recommends MIPC 75 WP or Imidacloprid; rogueing. |
| **5: `sheath_blight`** | *Rhizoctonia solani* (Fungus) | খোলপোড়া রোগ | `sheath_blight` | **Exact 1:1 Match** | Recommends Hexaconazole 5 EC or Validamycin; mandatory water drainage to break moisture band. |
| **6: `other_rice`** | Non-Target Pathology & Pests | অন্যান্য ধানের সমস্যা | `other_rice` | **Handled as Rejection/General** | Directs farmer to observe specific symptoms (e.g. hispa streaks or bacterial blight) and consult local SAAO. |
| **7: `not_rice`** | Out-of-Domain Non-Rice | ধানের পাতা নয় | `not_rice` | **Handled as Guardrail** | Informs farmer that image is not a recognized rice leaf; prompts clean retake. |

---

## 3. Pathology Segregation Standards

To prevent confusing farmers and misapplying fungicides:
1. **No Merging of Smut and Brown Spot:** *Entyloma oryzae* produces raised, angular black spots; *Bipolaris oryzae* produces round spots with chlorotic yellow halos. They are maintained as separate diagnostic entities.
2. **Unsupported Pathogen Handling:** Bacterial Leaf Blight (*Xanthomonas oryzae*) and Leaf Scald (*Microdochium oryzae*) are not primary classifier classes in v10 (they map to `other_rice`). The Copilot provides general advisory under `other_rice` without fabricating false high-confidence disease classifications.
3. **Pest Segregation:** Insect damage (Rice Hispa, Stem Borer) is cleanly routed to `other_rice` rather than forced into fungal disease categories.
