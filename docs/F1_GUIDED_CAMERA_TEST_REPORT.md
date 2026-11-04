# F1 Live Guided Camera: Test & Verification Report
**AgroLeaf AI | Automated Test Verification**

**Document ID:** `docs/F1_GUIDED_CAMERA_TEST_REPORT.md`  
**Status:** ALL TESTS PASSING  
**Date:** 2026-11-04  

---

## 1. Guidance State vs Capture Freedom Matrix

All 14 guidance states were audited to ensure the capture button is NEVER disabled while the camera stream is active:

| Guidance State | Advisory Message Displayed | Capture Button Allowed? | Verified |
| :--- | :--- | :--- | :--- |
| **ANALYZING** | "ক্যামেরা প্রস্তুত হচ্ছে..." | **YES** | PASS |
| **NO_LEAF** | "ধানের পাতাটি ফ্রেমের মধ্যে আনলে পরামর্শ পাবেন" | **YES** | PASS |
| **MOVE_LEFT** | "ফোনটা একটু বামে নিলে পাতাটি পরিষ্কার দেখা যেতে পারে" | **YES** | PASS |
| **MOVE_RIGHT** | "ফোনটা একটু ডানে নিলে পাতাটি পরিষ্কার দেখা যেতে পারে" | **YES** | PASS |
| **MOVE_UP** | "ক্যামেরা একটু উপরে তুললে ভালো হতে পারে" | **YES** | PASS |
| **MOVE_DOWN** | "ক্যামেরা একটু নিচে নামালে ভালো হতে পারে" | **YES** | PASS |
| **MOVE_CLOSER** | "পাতাটি ফ্রেমের একটু কাছে আনুন" | **YES** | PASS |
| **MOVE_AWAY** | "ফোনটা একটু দূরে নিলে পুরো পাতা দেখা যাবে" | **YES** | PASS |
| **DARK** | "আলো একটু বাড়ালে ছবিটি পরিষ্কার হতে পারে" | **YES** | PASS |
| **BRIGHT** | "অতিরিক্ত আলো এড়ালে পাতাটি স্পষ্ট দেখা যাবে" | **YES** | PASS |
| **BLURRY** | "ছবিটি একটু ঝাপসা মনে হচ্ছে। ফোন স্থির রাখুন" | **YES** | PASS |
| **UNCERTAIN** | "পাতাটি স্পষ্ট শনাক্ত হচ্ছে না, প্রয়োজন মনে করলে অবস্থান বদলান" | **YES** | PASS |
| **READY** | "ছবিটি খুব ভালো দেখাচ্ছে!" | **YES** | PASS |
| **GUIDANCE_HIDDEN**| Guidance hidden by user toggle | **YES** | PASS |

*The only condition where capture is disabled is if the camera stream is unavailable or permission was denied.*

---

## 2. Regression Test Results
- `LiveCameraScanner.test.jsx`: 3 tests passed
- `guidanceEngine.test.js`: 3 tests passed
- `leafGeometry.test.js`: 3 tests passed
- Total Live Scanner Suite: 9/9 tests passed
- Full Project Suite: 56 test files, 384 tests passed (100% pass rate)
- Oxlint: 0 errors
- Vite Build: Success in 1.36s

