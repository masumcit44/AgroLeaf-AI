# AgroLeaf AI — Antigravity Skills Inventory

**Project:** AgroLeaf AI (`masumcit44/AgroLeaf-AI`)  
**Lead:** Antigravity (Project Lead & Technical Architect)  
**Date:** 4 November 2026  
**Status:** Comprehensive Ecosystem Audit Complete  

---

## Executive Summary

To strengthen technical leadership, multi-agent coordination, mobile UX engineering, testing, computer vision, and hackathon execution, we performed a full security, compatibility, and architecture audit across five repositories.

Across all sources, **1,660 candidate skill packages** were analyzed. Rather than bloating agent context with hundreds of generic prompts, we adopted strict criteria:
- **Compatible:** Must adhere to the Antigravity `SKILL.md` format (YAML frontmatter with `name` and `description`).
- **Token-Efficient:** Concise instructions with progressive disclosure (details in `resources/` or `references/`).
- **Secure:** Zero unauthorized shell scripts, zero credential requests, zero arbitrary network execution.
- **Project-Specific:** Directly serves AgroLeaf AI's stack (React, Vite, Tailwind CSS, Cloudflare Workers/Pages Functions, SQLite/D1, MobileNetV3/ONNX edge inference, BAMIS weather rules, Bengali i18n).

---

## 1. Repositories Inspected

| Repository | Focus / Origin | Total Discovered | Valid Antigravity Format | License | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **`rmyndharis/antigravity-skills`** | Curated vault ported from Claude Code ecosystem with dedicated CLI and playbooks | 307 | 307 | MIT | **Audited & Selected** |
| **`benjaminasterA/antigravity-awesome-skills`** | Massive catalog (fork of RumskiRubes/sickn33) covering specialized domains | 876 | 874 | MIT | **Audited & Selected** |
| **`omer-metin/skills-for-antigravity`** | Converted from Vibeship Spawner YAML systems into Markdown | 460 | 460 | Apache 2.0 | **Audited & Selected** |
| **`asadullah48/hackathon-skills-marketplace`** | Hackathon-tailored subagent orchestrations, worktrees, and TDD workflows | 17 | 17 | MIT | **Audited & Selected** |
| **`nishant-Tiwari24/skills-for-hackathon`** | Curated links to hackathons (`Hackathons.md`), learning roadmaps, project ideas | 0 skills (7 md guides) | 0 | Unlicensed | **Incompatible format** (Reference only) |

**Total Discovered Candidates:** 1,660  
**Unique Skill Names Across Catalogs:** 1,284  
**Cross-Repository Overlap:**  
- 305 of the 307 skills in `rmyndharis` are mirrored in `benjaminasterA`.  
- `omer-metin` contributed 389 unique skills, but several suffered from automated regex conversion artifacts (e.g. broken description strings like `Use when ", " mentioned.`).  
- `asadullah48` provided the cleanest, most focused multi-agent development and git worktree execution skills.

---

## 2. Security & Trust Review

All repositories were cloned/extracted into an isolated temporary staging directory (`temp_skills_review/`) outside the production codebase.

### Findings:
1. **Malicious Patterns:** None detected (`rm -rf /`, `curl | bash`, hardcoded tokens, or keyloggers were absent).
2. **Executable Scripts:** Stored helper scripts (`.py`, `.sh`) in certain packages (such as `hackathon-todo-advanced` Helm generators) were quarantined and not executed.
3. **Information Security:** None of the selected skills request project secrets (`HASH_SALT`, `TURNSTILE_SECRET`, Cloudflare tokens).
4. **Instruction Safety:** No instructions attempt to override project governance, bypass safety boundaries, or modify git origins without authorization.

---

## 3. High-Priority Selected Skills for AgroLeaf AI

The following 15 skills were audited, vetted, and installed directly into `.agents/skills/`:

### A. Hackathon Strategy & Multi-Agent Coordination
| Skill Name | Source Repo | Category | Dependencies | Action | Relevance to AgroLeaf AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`subagent-driven-development`** | `asadullah48` | Multi-Agent | Antigravity Subagents | **Installed** | Dispatches isolated subagents for Client, Kilo, and OpenCode with two-stage review (spec compliance then code quality). |
| **`using-git-worktrees`** | `asadullah48` | Git Workflow | Git CLI | **Installed** | Enforces worktree directory isolation (`AgroLeaf_deploy_wt`, `AgroLeaf_cline_wt`, `AgroLeaf_kilo_wt`), preventing branch collisions. |
| **`verification-before-completion`** | `asadullah48` | Quality / Release | Vitest / npm | **Installed** | Mandates full automated verification (tests, lint, build, live preview) before merging or marking any issue resolved. |
| **`systematic-debugging`** | `asadullah48` | Debugging | Node / Browser DevTools | **Installed** | Enforces root-cause analysis and reproduction steps before touching code (directly applied to ISSUE-001 & ISSUE-002). |
| **`test-driven-development`** | `asadullah48` | Testing | Vitest | **Installed** | TDD cycle: write failing unit test, implement minimal fix, refactor, and verify 0 regressions. |
| **`writing-plans`** | `asadullah48` | Planning | Markdown | **Installed** | Produces granular, bite-sized implementation plans with acceptance criteria. |
| **`executing-plans`** | `asadullah48` | Execution | TodoWrite / Tracker | **Installed** | Systematic step-by-step plan execution with progress checkpoints. |

### B. Mobile UX, Frontend & Accessibility (Powers ISSUE-001 & ISSUE-003)
| Skill Name | Source Repo | Category | Dependencies | Action | Relevance to AgroLeaf AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`react-modernization`** | `rmyndharis` | Frontend | React 19 / Vite | **Installed** | Modern functional components, custom hooks, eliminating race conditions in scan/inference state. |
| **`accessibility-compliance-accessibility-audit`** | `rmyndharis` | UX / Mobile | Tailwind CSS | **Installed** | Touch target sizing ($\ge 44 \times 44$px), high-contrast Bangla typography, mobile viewport adaptation down to 360px. |
| **`application-performance-performance-optimization`** | `rmyndharis` | Performance | Vite / Chrome Tracing | **Installed** | Mobile bundle budget (< 25 MiB), lazy loading, smooth frame rates on low-end rural smartphones. |

### C. Backend, Database & Privacy Architecture (Powers ISSUE-002 & ISSUE-004)
| Skill Name | Source Repo | Category | Dependencies | Action | Relevance to AgroLeaf AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`backend-architect`** | `rmyndharis` | Backend / DB | Cloudflare Pages / D1 | **Installed** | Architecting Cloudflare D1 migrations, rate limits, edge caching, and clean request lifecycles. |
| **`api-design-principles`** | `rmyndharis` | API Design | REST / JSON | **Installed** | Consistent error schemas, idempotency keys, and lightweight payload structures. |
| **`backend-security-coder`** | `rmyndharis` | Security | Web Crypto / HMAC | **Installed** | Privacy-first design: zero PII storage, device HMAC signing, Turnstile verification, and no invasive tracking. |

### D. Computer Vision & Testing QA
| Skill Name | Source Repo | Category | Dependencies | Action | Relevance to AgroLeaf AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`computer-vision-expert`** | `benjaminasterA` | AI / Computer Vision | ONNX Runtime Web / PyTorch | **Installed** | Edge vision optimization, EXIF orientation handling, image preprocessing, crop calibration, and domain generalization. |
| **`e2e-testing-patterns`** | `rmyndharis` | QA / Testing | Puppeteer / Playwright | **Installed** | Automated mobile emulation (360px, 390px, 412px), offline PWA service worker verification, and end-to-end user flows. |

---

## 4. Skills Categorized as Optional or Rejected

| Skill Name | Source Repo | Reason | Decision |
| :--- | :--- | :--- | :--- |
| `hackathon-todo-advanced` | `asadullah48` | Heavy Kubernetes / Helm charts / Dapr microservices, unrelated to Cloudflare Pages & D1 | **Rejected** |
| `kubernetes-health-check` | `asadullah48` | Not applicable (AgroLeaf AI is serverless edge architecture) | **Rejected** |
| `agents-md-generator` | `asadullah48` | AgroLeaf AI already uses mature `GEMINI.md` and custom rules | **Rejected** |
| `computer-vision-deep` | `omer-metin` | Automated YAML-to-Markdown conversion corrupted description string; redundant with `computer-vision-expert` | **Rejected** |
| `react-native-specialist` | `omer-metin` | AgroLeaf AI is a Web PWA (React + Vite), not React Native | **Rejected** |
| `active-directory-attacks` | `benjaminasterA` | Enterprise Windows AD penetration testing; totally irrelevant and risky | **Rejected** |
| `solidity-smart-contracts` | `benjaminasterA` | Web3/crypto; zero relevance to rice agriculture | **Rejected** |
| `c4-architecture-c4-architecture` | `rmyndharis` | Enterprise C4 diagramming; creates excessive process overhead for MVP phase | **Optional** (Deferred) |
| `changelog-automation` | `rmyndharis` | Useful for final release tagging, but manual curated changelog is currently superior | **Optional** (Deferred) |

---

## 5. Summary of Actions
- **1,660 skills audited across 5 repositories.**
- **15 core production-grade skills installed and verified in `.agents/skills/`.**
- **Token efficiency preserved:** metadata loaded on demand via Antigravity progressive disclosure.
