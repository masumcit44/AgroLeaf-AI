# F1 Advanced: Intelligent Live Guided Camera Scanner — Test Report
**Document ID:** `docs/F1_LIVE_SCANNER_TEST_REPORT.md`  
**Date:** 2026-11-04  
**Author:** QA Lead & Lead Software Architect  

---

## 1. Test Suite Execution Summary

- **Unit & Component Test Files:** 3 files
- **Total Tests:** 8 tests (100% pass)
- **Framework:** Vitest v5.0.5

| Test File | Tests | Status | Key Verifications |
| :--- | :---: | :---: | :--- |
| `src/features/liveScanner/__tests__/leafGeometry.test.js` | 3 | PASS | Excess Green indexing, spatial centroid calculation, 10 framing conditions (dark, bright, blur, left, right, up, down, closer, away, ready) |
| `src/features/liveScanner/__tests__/guidanceEngine.test.js` | 3 | PASS | Hysteresis filter, glitch rejection, consecutive ready streak threshold, clean reset |
| `src/features/liveScanner/__tests__/LiveCameraScanner.test.jsx` | 2 | PASS | Dialog accessibility role, video mount, Bangla and English rendering |

---

## 2. Directional Mapping & Verification Matrix

| Simulated Condition | Input Coordinates / Metrics | Direction Expected | Bangla Output Verified | Result |
| :--- | :--- | :--- | :--- | :---: |
| Leaf Left | $cx = 0.20, cy = 0.50$ | `MOVE_LEFT` | "ক্যামেরা একটু বামে ঘোরান" | PASS |
| Leaf Right | $cx = 0.80, cy = 0.50$ | `MOVE_RIGHT` | "ক্যামেরা একটু ডানে ঘোরান" | PASS |
| Leaf High | $cx = 0.50, cy = 0.15$ | `MOVE_UP` | "ক্যামেরা একটু উপরে তুলুন" | PASS |
| Leaf Low | $cx = 0.50, cy = 0.85$ | `MOVE_DOWN` | "ক্যামেরা একটু নিচে নামান" | PASS |
| Leaf Far | Area $= 0.08$ | `MOVE_CLOSER` | "ফোনটা একটু কাছে আনুন" | PASS |
| Leaf Too Close | Area $= 0.88$ | `MOVE_AWAY` | "ফোনটা একটু দূরে নিন" | PASS |
| Low Light | Luma $= 25 < 40$ | `DARK` | "আলো কম। পর্যাপ্ত আলোতে যান" | PASS |
| Shaky / Blurry | Blur Var $= 20 < 45$ | `BLURRY` | "ছবিটি ঝাপসা। ফোন স্থির রাখুন" | PASS |
| Ideal Framing | $cx=0.50, cy=0.50$, Area$=0.35$ | `READY` | "পাতাটি স্ক্যানের জন্য প্রস্তুত!" | PASS |

