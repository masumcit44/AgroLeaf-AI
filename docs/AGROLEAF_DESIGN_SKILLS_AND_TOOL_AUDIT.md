# AgroLeaf AI — Design Skills, Tools & Methodology Audit
**Document ID:** `docs/AGROLEAF_DESIGN_SKILLS_AND_TOOL_AUDIT.md`  
**Focus:** Design Systems, Mobile Viewport Testing & Accessibility Methodology  
**Author:** Lead Frontend Architect & Product Designer  
**Date:** 2026-11-04  
**Status:** Approved  

---

## 1. Environment Skills & Tool Inventory

The Antigravity development environment was surveyed for specialized design, accessibility, and testing tools:

| Skill / Tool | Role in this Project | Activation Status |
| :--- | :--- | :---: |
| **`accessibility-compliance-accessibility-audit`** | Auditing WCAG 2.1 AA compliance (contrast, touch targets $\ge 44 \times 44$px, ARIA landmarks, screen-reader semantics) | Active & Applied |
| **`computer-vision-expert`** | Viewfinder geometry, plant mask moments, spatial coordinate mapping | Active & Applied |
| **`application-performance-performance-optimization`** | Bundle size budgeting (<25 MiB Pages ceiling), CSS rendering efficiency | Active & Applied |
| **`react-modernization`** | Functional component patterns, hooks optimization, clean lifecycle cleanup | Active & Applied |
| **`verification-before-completion`** | Mandatory test execution before claiming release readiness | Active & Applied |

---

## 2. Browser Automation & Emulation Capabilities

For mobile viewport validation, the environment uses:
1. **Vitest + JSDOM / React Testing Server-Side Rendering (`renderToString`)**:
   - Deterministic structural DOM checks for all HTML semantic roles, ARIA attributes, and conditional states.
2. **Dynamic Viewport Emulation (CSS Media Queries & Math Engine)**:
   - Evaluated across 320px (SE), 360px (Galaxy A), 375px (iPhone mini), 390px (iPhone 14), 412px (Pixel), and 430px (Pro Max).
3. **Oxlint Static Code Engine**:
   - Sub-second verification of syntax, dead imports, hooks rules, and accessibility-impacting code bugs.

