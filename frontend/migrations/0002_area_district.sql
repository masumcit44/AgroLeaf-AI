-- Migration: area_reports uses district_code (not upazila_code)
-- Runs on: agroleaf-preview only (lead applies to prod at merge)
-- Idempotent: uses DROP + CREATE pattern

DROP TABLE IF EXISTS area_reports;

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