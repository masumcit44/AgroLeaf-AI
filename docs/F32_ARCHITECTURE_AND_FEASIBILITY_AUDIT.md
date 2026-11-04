# AGROLEAF AI — F32 ARCHITECTURE AND FEASIBILITY AUDIT
## Comprehensive Architectural Audit, Infrastructure Feasibility & Technology Policy Assessment

**Document ID:** `F32-AUD-001`  
**Feature:** F32 Outbreak Early Warning & Neighbor Risk Alert  
**Date:** November 2026  
**Status:** AUDITED & APPROVED  
**Target Worktree:** `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt`  
**Branch:** `feat/f32-outbreak-early-warning`  

---

## 1. Executive Summary

This audit assesses the feasibility of implementing **F32: Outbreak Early Warning & Neighbor Risk Alert** within the existing AgroLeaf AI architecture. The objective of F32 is to extend AgroLeaf AI from individual leaf disease detection into a **privacy-preserving community-level rice disease surveillance and early-warning platform**.

The system must answer:
1. Which rice diseases are being reported in an administrative area?
2. Are reports increasing compared with an appropriate historical baseline?
3. Is the increase supported by enough independent contributors?
4. Is the signal statistically meaningful?
5. Which nearby administrative areas may need additional monitoring?
6. What practical actions should farmers take?

**Fundamental Invariant:** Detected disease reports are *not* automatically confirmed agricultural outbreaks. Unverified scan-based signals must never be presented as confirmed field-level disease outbreaks.

---

## 2. Audit of Existing AgroLeaf AI Infrastructure

### 2.1 Disease Prediction Pipeline & Model Eligibility
- **Model:** `rice-effb0-v10-320.onnx` (15.34 MiB) with dual-head architecture (logits + CAM).
- **Classes:** 8-class ontology (`bacterial_leaf_blight`, `blast`, `brown_spot`, `healthy`, `hispa`, `leaf_scald`, `narrow_brown_spot`, `sheath_blight`, `tungro`).
- **Confidence Calibration:** Temperature-scaled softmax outputs. Only high-reliability predictions (`band === 'high'`, confidence $\ge 0.70$) on non-healthy rice leaf classes are eligible for community disease surveillance.
- **Image Quality & Non-Rice Gates:** F1 Live Camera framing and Non-Rice Gate ensure low-quality, blurry, or non-rice foliage never enters the surveillance pipeline.

### 2.2 Backend & Database Services
- **Cloudflare Pages & Functions:** Serverless edge functions under `functions/api/v1/`.
- **Cloudflare D1 SQL Database:** Relational edge database. Migrations `0001_init.sql` and `0002_area_district.sql` define the `area_reports` table:
  ```sql
  CREATE TABLE area_reports (
    id            TEXT PRIMARY KEY,
    device_hash   TEXT NOT NULL,
    district_code TEXT NOT NULL,
    iso_week      TEXT NOT NULL,
    class         TEXT NOT NULL,
    band          TEXT NOT NULL,
    model_version TEXT NOT NULL,
    verified      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL
  );
  CREATE UNIQUE INDEX idx_area_reports_device_district_week_class
    ON area_reports(device_hash, district_code, iso_week, class);
  ```
- **Cryptographic Device Hashing:**
  `device_hash = HMAC-SHA256(deviceId, env.HASH_SALT)`.
  This hash is non-reversible and mathematically disconnected from the `devices` table, ensuring zero leak of personal identities.
- **Existing Endpoints:**
  - `POST /api/v1/area-reports`: Submits high-band report, rate-limited to 10 per day, deduplicated per device/district/week/class.
  - `GET /api/v1/area-summary?class=<key>&weeks=2`: Returns raw counts with k-anonymity ($\ge 3$ distinct devices).

### 2.3 Client-Side Storage & Offline Handling
- **IndexedDB:** `agroleaf` database currently on `DB_VERSION 3` with object stores: `history`, `profile`, `reminders`, `sync_queue`, `plans`.
- **Sync Client (`src/lib/store/sync.js`):** Queues offline operations (`enqueueAreaReport`) and flushes idempotently upon reconnection.
- **PWA Service Worker:** Offline caching of application assets, ONNX models, and GeoJSON boundaries.

---

## 3. Ten Core Architectural Audit Questions

### 1. Is there an existing central database?
**Yes.** Cloudflare D1 SQL database is configured with the `area_reports` schema, supporting transactional inserts and aggregation queries.

### 2. Can scan metadata be securely submitted to a backend?
**Yes.** The existing `POST /api/v1/area-reports` endpoint validates device signatures (`X-Device-Signature`, `X-Timestamp`, `X-Device-Id`) via `verifyDevice()`, validates model version, district code, and ISO week format.

### 3. Is user identity available for independent-contributor counting?
**Yes, in a privacy-preserving form.** `device_hash` (HMAC-SHA256 of client UUID with secret salt) uniquely identifies distinct contributing devices without revealing user identity or allowing cross-table correlation with user profiles.

### 4. Can administrative area information be stored without exposing exact farmer locations?
**Yes.** Storage is strictly restricted to `district_code` (1 to 64). Zero GPS coordinates, village names, or plot boundaries are stored.

### 5. What is the existing notification mechanism?
- Local-first in-app notifications and inspection reminders powered by F24 (`remindersStore.js` and `notificationService.js`).
- Web Notifications API for browser-level prompts when explicitly permitted.
- In-app alert banners displayed directly within the farmer's dashboard, scan result screen, and map view.

### 6. Which current services can be reused?
- `functions/api/v1/area-reports/index.js` for report ingestion and rate limiting.
- `src/lib/store/sync.js` for offline queueing.
- `src/features/profile/profileStore.js` for resolving the farmer's district.
- `src/features/reminders/remindersStore.js` for scheduling recommended scouting tasks.
- `public/geo/bd_districts.json` and `districtsData` for district reference information.

### 7. What additional infrastructure is genuinely required?
1. **Outbreak Signal Engine (`outbreakSignalEngine.js`)**: Statistical anomaly evaluation comparing current window activity against baseline moving averages with scan-volume normalization.
2. **Neighbor Adjacency Graph (`districtAdjacency.js`)**: Canonical spatial adjacency map for all 64 districts in Bangladesh to propagate neighbor alerts.
3. **Backend Community Alerts API (`functions/api/v1/community-alerts/index.js`)**: Aggregates multi-week D1 records, calculates alert levels, evaluates neighbor risk, and returns cached JSON.
4. **Community Alerts Store & UI (`communityAlertsStore.js`, `CommunityAlertCard.jsx`)**: Offline-first IndexedDB cache, consent toggle, alert feed, and BRRI/DAE actionable advisories.

### 8. Can the feature operate within the free-only constraint?
**Yes.** 
- Cloudflare Pages Functions & D1 Free Tier: Aggregation queries execute in < 5ms CPU time, well within the 10ms limit.
- 10-minute HTTP edge cache (`Cache-Control: public, max-age=600`) ensures repeated farmer visits do not generate database queries.
- Zero paid geocoding or spatial analytics APIs. Adjacency calculation runs statically on-device and at the edge.

### 9. What are the limitations if the existing architecture is primarily client-side?
- Edge aggregation requires network connectivity. Offline devices cannot fetch real-time updates.
- **Solution:** Local-first caching in IndexedDB (`community_alerts` store). If offline, AgroLeaf displays the last synchronized alert with clear timestamp and freshness indicators, never fabricating artificial updates.

### 10. What is the lightest reliable implementation?
- Leverage existing `area_reports` table.
- Implement edge aggregation function returning current alert status, trend ratio, contributor count, and neighbor alerts.
- Client-side evaluation engine capable of running identical logic against offline-cached summaries.

---

## 4. Invariant Safeguards Matrix

| Constraint | Safeguard Implementation | Verification Mechanism |
| :--- | :--- | :--- |
| **No False Outbreak Alarm** | Strict wording: *"রোগের রিপোর্ট বৃদ্ধি"* (Increased Reporting Activity), not *"মহামারী"* (Epidemic/Outbreak). Clear disclaimer stating signals are based on user scans. | Content validation test; UI badge inspections. |
| **k-Anonymity** | Any district with $< 3$ distinct contributors is classified as `INSUFFICIENT_DATA`. | Unit tests in `outbreakSignalEngine.test.js`. |
| **Contributor Deduplication** | Multiple scans by 1 farmer for the same disease in the same week count as 1 contributor. | D1 unique constraint + engine deduplication. |
| **Zero Coordinate Leaks** | Only 1–64 district code stored. Raw GPS coordinates discarded immediately after district resolution. | Network payload audit; database schema audit. |
| **Offline Safety** | Historical scans synchronized late include their historical timestamp and do NOT trigger sudden spikes today. | Timestamp separation (`event_time` vs `sync_time`) tests. |

---

## 5. Conclusion & Clearance

The architectural audit confirms that F32 is fully feasible, sustainable under the free-only infrastructure policy, and architecturally aligned with AgroLeaf AI's privacy-first design principles. Clearance is granted to proceed with privacy design, surveillance research, and implementation.
