-- ============================================================
-- Migration: 004_packages
-- Purpose:   Kuunda table ya packages
-- ============================================================

CREATE TABLE packages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id           UUID REFERENCES sites(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  price             DECIMAL(12, 2) NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  validity_days     INTEGER NOT NULL DEFAULT 30,
  speed_limit_mbps  INTEGER NOT NULL DEFAULT 5,
  data_limit_mb     INTEGER,
  device_limit      INTEGER NOT NULL DEFAULT 1,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_packages_site ON packages(site_id);
CREATE INDEX idx_packages_active ON packages(is_active) WHERE deleted_at IS NULL;