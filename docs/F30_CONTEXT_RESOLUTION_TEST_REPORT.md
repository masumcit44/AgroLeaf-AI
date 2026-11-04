# F30 Context Resolution Test Report
**AgroLeaf AI — Active Scan Inheritance & Conversation State Tracking**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Senior QA Engineer & Frontend Systems Architect

---

## 1. Executive Summary

A core strength of AgroLeaf AI's Farmer Copilot is its seamless integration with the active disease scanner: when a farmer captures an image diagnosed as "Brown Spot" and then asks "কী ওষুধ দেব?" (What medicine should I apply?), the assistant must automatically infer that the question pertains to Brown Spot without forcing the farmer to repeat the disease name.

Conversely, if the farmer explicitly asks about another condition (e.g. "টুংরো হলে কী করব?"), the assistant must allow the explicit mention to override the inherited scan context.

This report documents the verification of state resolution rules under single-turn and multi-turn agricultural scenarios.

---

## 2. Test Execution & Verification Matrix

| Test Scenario | Active Scan Context | Farmer Spoken Query | Expected Resolved Disease | Expected Intent | Actual Test Result | Pass/Fail |
|---|---|---|---|---|---|---|
| **Scenario 1:** Implicit treatment request | `sheath_blight` | "এখন জমিতে কী ছিটাব?" | `sheath_blight` | `treatment` | Retrieved Hexaconazole 5 EC recommendation | **PASS** |
| **Scenario 2:** Implicit fertilizer inquiry | `bacterial_leaf_blight` | "ইউরিয়া সার কি দেওয়া যাবে?" | `bacterial_leaf_blight` | `fertilizer` | Returned urgent warning: Urea prohibited | **PASS** |
| **Scenario 3:** Explicit disease override | `brown_spot` | "টুংরো হলে কী করব?" | `tungro` | `treatment` | Overrode Brown Spot; returned Tungro vector control | **PASS** |
| **Scenario 4:** Disease comparison request | `blast` | "ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?" | `['blast', 'brown_spot']` | `comparison` | Returned comparative symptom table | **PASS** |
| **Scenario 5:** Unanchored query without scan | `null` | "কী ওষুধ দেব?" | `null` | `need_disease_context` | Prompted farmer: "কোন রোগের জন্য জানতে চান?" | **PASS** |
| **Scenario 6:** Follow-up scan query | `blast` | "আমি আবার কবে ছবি তুলব?" | `blast` | `follow_up_scan` | Advised rescan in 5–7 days post-treatment | **PASS** |
| **Scenario 7:** Symptom progression check | `brown_spot` | "পাতার দাগ বাড়ছে, কী করব?" | `brown_spot` | `progression` | Advised checking fertilizer & moisture levels | **PASS** |
| **Scenario 8:** Healthy crop context | `healthy` | "কী স্প্রে করতে হবে?" | `healthy` | `treatment` | Advised: "বর্তমানে কোনো বিষ স্প্রে করার প্রয়োজন নেই" | **PASS** |

---

## 3. Session Isolation & Context Mutation Safety

1. **New Scan Selection:** When a farmer navigates to a new scan or takes another photo, `scan?.classKey` updates immediately, resetting any stale conversation context from earlier scans.
2. **Tab Switching:** Moving between Result Screen, Crop Calendar, and Area Map preserves the active scan context without session leakage between independent users.
3. **Absence of Context Hallucination:** If no scan is active and the farmer does not specify a disease, the engine never guesses a random disease; it politely asks the farmer to scan or name the leaf problem.
