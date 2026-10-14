-- 001_init.sql — the assessments table. Fixed schema; do not extend.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  inputs        JSONB NOT NULL,
  probability   REAL NOT NULL,
  flagged       BOOLEAN NOT NULL,
  threshold     REAL NOT NULL,
  model_version TEXT NOT NULL,
  shap_top      JSONB,
  source        TEXT NOT NULL DEFAULT 'form'
);

CREATE INDEX IF NOT EXISTS idx_assessments_created
  ON assessments (created_at DESC);

-- No names, emails, IPs, or user agents. Session UUIDs only.
