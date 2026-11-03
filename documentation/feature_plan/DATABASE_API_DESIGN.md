# Database and API design (proposal, not built)

Companion to `FEATURE_ARCHITECTURE_RESEARCH.md`.

**Verified starting point:** there is **no existing database or API**. The app is static, and everything runs in the browser. So this design adds storage without migrating anything.

**Principle: local-first.**
- Personal data (profile, history) stays on the phone, in IndexedDB.
- The server stores only what must be shared between people:
  - feedback for review;
  - help requests (behind a flag);
  - anonymous area reports;
  - model-version records.

---

## 1. On-device storage (IndexedDB, database `agroleaf`, version 1)

| Store | Key | Fields | Used by |
|---|---|---|---|
| `device` | `'self'` | `device_id` (UUIDv4), `device_secret` (random 32 bytes, base64), `created_at` | F20, F22, F23 |
| `profile` | `'self'` | `upazila_code?`, `district_code?`, `season?` (`boro\|aman\|aus`), `variety?`, `transplant_date?`, `lang`, `updated_at` | F8, F10, F21, F23 |
| `history` | `id` (UUID) | `created_at`, `field_label?`, `thumb_jpeg` (Blob, ≤ 320 px), `top_class`, `band` (`high\|medium\|not_sure`), `reason?`, `probs` (8 floats), `model_version`, `note?`, `shared` (bool) | F16, F10 |
| `outbox` | `id` (UUID = idempotency key) | `kind` (`feedback\|help\|area_report`), `payload`, `created_at`, `attempts`, `last_error?` | F9, F20, F22, F23 |
| `weather_cache` | `upazila_code` | `fetched_at`, `hourly` (3 days), `source:'open-meteo'` | F8 |

Indexes: `history.created_at`, `history.field_label`, `outbox.created_at`.
Deletion: "Delete my data" clears all stores, and asks the server to delete this device's rows (`DELETE /api/v1/devices/me`).

---

## 2. Server database (Cloudflare D1 / SQLite)

```sql
-- 0001_init.sql (applied with wrangler d1 migrations; owned by the lead)
CREATE TABLE devices (
  id            TEXT PRIMARY KEY,          -- client UUID
  secret_hash   TEXT NOT NULL,             -- SHA-256 of device_secret, never the secret
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  blocked       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE model_versions (
  version       TEXT PRIMARY KEY,          -- e.g. 'v10'
  sha256        TEXT NOT NULL,
  released_at   TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 0,
  notes_url     TEXT                       -- e.g. run10_v10/RELEASE_DECISION.md
);

CREATE TABLE images (
  id            TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  r2_key        TEXT NOT NULL,             -- private bucket object key
  phash         TEXT NOT NULL,             -- 16 hex; duplicate and test-leak checks
  bytes         INTEGER NOT NULL,
  created_at    TEXT NOT NULL,
  delete_after  TEXT NOT NULL              -- retention (default created_at + 180 days)
);

CREATE TABLE feedback (
  id              TEXT PRIMARY KEY,        -- = outbox id (idempotent)
  device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  model_version   TEXT NOT NULL REFERENCES model_versions(version),
  predicted_class TEXT NOT NULL,
  band            TEXT NOT NULL CHECK (band IN ('high','medium','not_sure')),
  probs_json      TEXT NOT NULL,
  reported_class  TEXT NOT NULL,           -- one of 8 classes or 'unknown'
  comment         TEXT,                    -- ≤ 500 chars
  image_id        TEXT REFERENCES images(id) ON DELETE SET NULL,   -- only with photo consent
  upazila_code    TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','reviewed','accepted_for_training','rejected')),
  reviewed_class  TEXT,
  reviewer        TEXT,                    -- Access identity email of the reviewer
  reviewed_at     TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX feedback_status ON feedback(status, created_at);
CREATE INDEX feedback_device_day ON feedback(device_id, created_at);

CREATE TABLE help_requests (               -- F22 v2, feature flag; off until experts are verified
  id            TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  upazila_code  TEXT,
  question      TEXT NOT NULL,             -- ≤ 1000 chars
  history_ref   TEXT,                      -- client history id (no server copy unless image_id)
  image_id      TEXT REFERENCES images(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  answer        TEXT,
  answered_by   TEXT,
  answered_at   TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX help_status ON help_requests(status, upazila_code);

CREATE TABLE area_reports (                -- F23: anonymous, coarse
  id            TEXT PRIMARY KEY,
  device_hash   TEXT NOT NULL,             -- HMAC(device_id, server salt); not joinable publicly
  upazila_code  TEXT NOT NULL,
  iso_week      TEXT NOT NULL,             -- e.g. '2026-W45' (no exact time)
  class         TEXT NOT NULL,
  band          TEXT NOT NULL,
  model_version TEXT NOT NULL,
  verified      INTEGER NOT NULL DEFAULT 0,-- set when linked feedback is expert-reviewed
  created_at    TEXT NOT NULL,
  UNIQUE (device_hash, upazila_code, iso_week, class)   -- one vote per device per week per class
);
CREATE INDEX area_lookup ON area_reports(upazila_code, iso_week, class);
```

**Shared entities**

| Entity | Where it lives |
|---|---|
| Farmer | `devices` + local profile |
| Prediction | local `history`; a server copy only inside `feedback` / `area_reports` |
| Image | local thumbnail, or `images` + R2 with consent |
| Disease | static `class_index.json` + `disease_knowledge` (not in the database) |
| Weather observation | local cache only |
| Action plan | computed on the client from static rules (not stored) |
| Feedback report | `feedback` |
| Help request | `help_requests` |
| Location report | `area_reports` |
| Model version | `model_versions` + `model/registry.json` |

**Retention**
- Images: deleted after 180 days unless accepted for training, in which case they are copied to the training store with a provenance record.
- `area_reports`: kept for 2 years.
- Feedback: kept until reviewed + 1 year.
- All retention values are proposals [E] for owner approval.

---

## 3. API (`/api/v1`, Cloudflare Pages Functions)

**Conventions**
- JSON in and out; UTF-8.
- Errors use the form `{ "error": { "code": "rate_limited", "message": "..." } }` with HTTP status 400 / 401 / 403 / 404 / 409 / 413 / 422 / 429 / 503.
- Every write carries `Idempotency-Key: <outbox id>`.
- **Device auth headers:** `X-Device-Id`, `X-Device-Signature` = HMAC-SHA256(device_secret, method + path + body sha256 + timestamp), and `X-Timestamp` (must be within ±5 min).
- **Turnstile:** a token is required on the first registration and on image upload.
- **Versioning:** the `/api/v1` prefix; breaking changes go to `/api/v2`; the client sends `X-App-Version`.

| Method and path | Auth | Purpose | Request → response |
|---|---|---|---|
| `POST /api/v1/devices` | Turnstile | Register a device | `{device_id, secret_sha256}` → `201 {device_id}` |
| `DELETE /api/v1/devices/me` | device | Delete all of this device's server data (cascade + R2 objects) | → `204` |
| `POST /api/v1/images` | device + Turnstile | Upload one consented photo (JPEG ≤ 1 MB, re-encoded on the client to ≤ 1024 px) | multipart `file`, `phash` → `201 {image_id}`; `413` too big; `409` duplicate phash for this device |
| `POST /api/v1/feedback` | device | Report a wrong or unsure result (F20) | `{id, model_version, predicted_class, band, probs, reported_class, comment?, image_id?, upazila_code?}` → `201 {id, status:'new'}`; `429` over 20/day |
| `GET /api/v1/feedback/mine` | device | Status of my reports | → `200 [{id, status, reviewed_class?}]` |
| `POST /api/v1/area-reports` | device | Anonymous coarse report (F23) | `{id, upazila_code, iso_week, class, band, model_version}` → `201`; `409` duplicate vote (ignored as success by the client) |
| `GET /api/v1/area-summary?class=&weeks=2` | public | Counts per upazila (counts < 3 suppressed) | → `200 {generated_at, window, items:[{upazila_code, class, devices, verified, label:'reports'\|'alert'}]}` |
| `POST /api/v1/help-requests` | device; flag `HELP_V2` | F22 v2 | `{id, question, upazila_code?, image_id?}` → `201`; `503 feature_disabled` when off |
| `GET /api/v1/help-requests/mine` | device; flag | Answers to my requests | → `200 [...]` |
| `GET /api/v1/review/feedback?status=new` | Cloudflare Access (reviewer) | Review queue | → `200 [...]`, with a signed short-lived R2 URL per image |
| `POST /api/v1/review/feedback/:id` | Access (reviewer) | Set the expert label | `{reviewed_class, decision:'accepted_for_training'\|'rejected'}` → `200` |
| `POST /api/v1/review/help/:id` | Access (expert) | Answer a help request | `{answer}` → `200` |
| `GET /api/v1/model/active` | public | Active model version and sha256 (cache-busting, F13) | → `200 {version, sha256}` |

**Example**

```http
POST /api/v1/feedback
Idempotency-Key: 6f1c…
X-Device-Id: 2b7e…  X-Timestamp: 2026-11-04T09:12:03Z  X-Device-Signature: …
{"id":"6f1c…","model_version":"v10","predicted_class":"blast","band":"medium",
 "probs":[0.02,0.51,0.30,0.01,0.05,0.04,0.05,0.02],"reported_class":"brown_spot",
 "comment":"দাগগুলো গোল","image_id":null,"upazila_code":"30-33-??"}
→ 201 {"id":"6f1c…","status":"new"}
```

## 4. Authorization and privacy rules
1. A farmer can read and delete only their own rows (`device_id` = authenticated device).
2. Reviewer and expert routes are reachable only through Cloudflare Access; the reviewer identity is stored on each label.
3. Public outputs (`area-summary`) are aggregated, k-anonymised (counts < 3 hidden) and use `device_hash`, never `device_id`.
4. No exact coordinates, names or phone numbers are stored.
5. R2 bucket is private; images are served only to reviewers through signed URLs that expire in 10 min.
6. Secrets: the Turnstile secret, HMAC salt and Access audience go in Cloudflare environment variables and are **never committed**. `.dev.vars` is git-ignored.
7. Feedback never changes the model directly; only `accepted_for_training` rows can be exported to F13, after the dedup and test-leak check.

## 5. Open items before the schema is final
- Confirm that the Pages project can host `functions/` (root-directory setting).
- Choose upazila codes: BBS geocodes from the COD-AB dataset (licence check pending).
- Owner approval of the retention periods and the "reports vs alert" rule.
