-- AgroLeaf API v1 schema (documentation/feature_plan/DATABASE_API_DESIGN.md §2). Owned by the lead.
-- Apply: npx wrangler d1 migrations apply agroleaf --remote   (after the owner creates the D1 database)
-- Local-first design: profile and history stay on the phone; only shared data lives here.

CREATE TABLE devices (
  id            TEXT PRIMARY KEY,          -- client UUID
  signing_key   TEXT NOT NULL,             -- SHA-256 hex of the device secret (the secret never leaves the phone)
  created_at    TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  blocked       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE model_versions (
  version       TEXT PRIMARY KEY,          -- e.g. 'v10'
  sha256        TEXT NOT NULL,
  released_at   TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 0,
  notes_url     TEXT
);
INSERT INTO model_versions (version, sha256, released_at, active, notes_url) VALUES
  ('v10', 'a296be9ebd54ff89e76af3650386f6842bfe4b4a471d48f8aa78ecb09936f89e', '2026-11-03', 1,
   'model/experiments/run10_v10/RELEASE_DECISION.md');

CREATE TABLE images (
  id            TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  r2_key        TEXT NOT NULL,
  phash         TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  created_at    TEXT NOT NULL,
  delete_after  TEXT NOT NULL
);
CREATE INDEX images_device ON images(device_id, created_at);
CREATE UNIQUE INDEX images_device_phash ON images(device_id, phash);

CREATE TABLE feedback (
  id              TEXT PRIMARY KEY,
  device_id       TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  model_version   TEXT NOT NULL REFERENCES model_versions(version),
  predicted_class TEXT NOT NULL,
  band            TEXT NOT NULL CHECK (band IN ('high','medium','not_sure')),
  probs_json      TEXT NOT NULL,
  reported_class  TEXT NOT NULL,
  comment         TEXT,
  image_id        TEXT REFERENCES images(id) ON DELETE SET NULL,
  upazila_code    TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','reviewed','accepted_for_training','rejected')),
  reviewed_class  TEXT,
  reviewer        TEXT,
  reviewed_at     TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX feedback_status ON feedback(status, created_at);
CREATE INDEX feedback_device_day ON feedback(device_id, created_at);

CREATE TABLE help_requests (
  id            TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  upazila_code  TEXT,
  question      TEXT NOT NULL,
  history_ref   TEXT,
  image_id      TEXT REFERENCES images(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  answer        TEXT,
  answered_by   TEXT,
  answered_at   TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX help_status ON help_requests(status, upazila_code);

CREATE TABLE area_reports (
  id            TEXT PRIMARY KEY,
  device_hash   TEXT NOT NULL,             -- HMAC(device_id, HASH_SALT): not joinable to devices
  upazila_code  TEXT NOT NULL,
  iso_week      TEXT NOT NULL,
  class         TEXT NOT NULL,
  band          TEXT NOT NULL,
  model_version TEXT NOT NULL,
  verified      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  UNIQUE (device_hash, upazila_code, iso_week, class)
);
CREATE INDEX area_lookup ON area_reports(upazila_code, iso_week, class);
