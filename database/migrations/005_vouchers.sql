-- ============================================================
-- Migration: 005_vouchers
-- Purpose:   Kuunda tables za voucher batches na vouchers
-- ============================================================

-- VOUCHER BATCHES
CREATE TABLE voucher_batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  prefix          VARCHAR(10),
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batches_site ON voucher_batches(site_id);
CREATE INDEX idx_batches_package ON voucher_batches(package_id);
CREATE INDEX idx_batches_created ON voucher_batches(created_at DESC);

-- VOUCHERS
CREATE TABLE vouchers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id          UUID NOT NULL REFERENCES voucher_batches(id) ON DELETE CASCADE,
  package_id        UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  site_id           UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  code              VARCHAR(20) UNIQUE NOT NULL,
  status            voucher_status NOT NULL DEFAULT 'CREATED',
  mikrotik_sync     sync_status NOT NULL DEFAULT 'PENDING',
  mikrotik_user     VARCHAR(50),
  price             DECIMAL(12, 2) NOT NULL,
  duration_minutes  INTEGER NOT NULL,
  speed_limit_mbps  INTEGER NOT NULL,
  validity_days     INTEGER NOT NULL,
  sold_at           TIMESTAMPTZ,
  sold_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  activated_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  used_at           TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  revoked_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);
CREATE INDEX idx_vouchers_batch ON vouchers(batch_id);
CREATE INDEX idx_vouchers_site ON vouchers(site_id);
CREATE INDEX idx_vouchers_package ON vouchers(package_id);
CREATE INDEX idx_vouchers_sold_at ON vouchers(sold_at DESC);