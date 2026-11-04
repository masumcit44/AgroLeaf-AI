# AgroLeaf AI — Mobile Design System & Tokens
**Document ID:** `docs/AGROLEAF_MOBILE_DESIGN_SYSTEM.md`  
**Focus:** Typography Scale, Color Palette, Spacing Tokens, Touch Targets & Components  
**Author:** Lead UI/UX Architect  
**Date:** 2026-11-04  
**Status:** Approved  

---

## 1. Design Principles

1. **Farmer-First Accessibility:** Touch targets $\ge 44 \times 44$px; clear visual contrast ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large headings).
2. **Predictable Navigation:** Persistent top header with horizontal-scrolling feature tabs that never truncate on 360px–390px screens.
3. **Natural Bengali Typography:** Clean font rendering using `Hind Siliguri` and `Noto Sans Bengali` with appropriate line-heights ($1.4 - 1.6$) to prevent Bengali diacritics (হ্রস্ব-ই কার, দীর্ঘ-ঈ কার, র-ফলা) from clipping.

---

## 2. Core Tokens

### 2.1 Color Palette
- **Primary Leaf Green:** `#1f6b3a` (Tailwind `leaf-700`), `#16502b` (`leaf-800`), `#0f381e` (`leaf-900`)
- **Accent Emerald (Success / Healthy):** `#10b981` (`emerald-500`), `#059669` (`emerald-600`)
- **Warning Amber (Medium Risk / Advice):** `#f59e0b` (`amber-500`), `#d97706` (`amber-600`)
- **Critical Red (High Severity / Hazard / Stop):** `#ef4444` (`red-500`), `#dc2626` (`red-600`)
- **Background Paper:** `#fbfbf9` (`bg-paper`)
- **Ink Text:** `#18181b` (`text-ink` / `slate-900`)

### 2.2 Touch Targets & Spacing
- **Minimum Touch Target:** $44 \times 44$px (WCAG AA criterion 2.5.5 / 2.5.8).
- **Camera Shutter Button:** $80 \times 80$px circular button with $56 \times 56$px inner core.
- **Voice Copilot Mic Button:** $72 \times 72$px circular button with pulse ring.
- **Border Radii:** `rounded-2xl` (16px) for cards, `rounded-full` for chips and circular actions.

