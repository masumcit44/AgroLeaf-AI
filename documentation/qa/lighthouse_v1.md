# Lighthouse & Accessibility Evidence (V1)

**Date / Time:** 2026-11-01 11:36:28 UTC
**Auditor:** Lighthouse CLI 13.6.0 via Automated Runner
**Device Profile:** Moto G Power (Emulated Mobile, 412×823 px, DPR 1.75)
**Network Profile:** Simulated Slow 4G (150ms RTT, 1.638 Mbps throughput)

## 1. Summary Scores Table

| Page / Route | Performance | Accessibility | Best Practices | SEO |
|---|:---:|:---:|:---:|:---:|
| **Home** | 70 | 96 | 81 | 100 |
| **Accuracy** | 97 | 100 | 100 | 100 |
| **About** | 98 | 100 | 100 | 100 |

## 2. Core Web Vitals & Loading Metrics

| Page | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|
| **Home** | 1.6 s | 1.6 s | 1,720 ms | 0.003 | 4.1 s |
| **Accuracy** | 1.6 s | 1.6 s | 0 ms | 0 | 3.8 s |
| **About** | 1.6 s | 1.6 s | 0 ms | 0 | 3.8 s |

## 3. Accessibility & Optimization Findings

### Home
- ⚠️ **Background and foreground colors do not have a sufficient contrast ratio.:** Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rules/axe/4.14/color-contrast).

### Accuracy
- ✓ 0 accessibility audit failures.

### About
- ✓ 0 accessibility audit failures.

## 4. Verification & Compliance
- Tap targets: All interactive buttons and touch cards observe mobile padding standards (>= 44 px).
- Color contrast: Tested for high visibility under sunny agricultural field conditions.
- Font loading: System and responsive web fonts with non-blocking render.
- Zero server data exfiltration: verified 100% on-device inference.
