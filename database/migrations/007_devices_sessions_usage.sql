-- ============================================================
-- Migration: 007_devices_sessions_usage
-- Purpose:   Kuunda tables za devices, sessions na network_usage
-- ============================================================

-- DEVICES
CREATE TABLE devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mac_address     VARCHAR(17) UNIQUE NOT NULL,
  ip_address      VARCHAR(45),
  hostname        VARCHAR(150),
  vendor          VARCHAR(100),
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_mac ON devices(mac_address);
CREATE INDEX idx_devices_ip ON devices(ip_address);

-- SESSIONS
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id             UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  voucher_id          UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  device_id           UUID REFERENCES devices(id) ON DELETE SET NULL,
  router_id           UUID REFERENCES routers(id) ON DELETE SET NULL,
  mikrotik_session_id VARCHAR(100),
  ip_address          VARCHAR(45),
  mac_address         VARCHAR(17),
  status              session_status NOT NULL DEFAULT 'ACTIVE',
  login_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at           TIMESTAMPTZ,
  duration_seconds    INTEGER DEFAULT 0,
  data_used_mb        DECIMAL(15, 2) DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_voucher ON sessions(voucher_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_login ON sessions(login_at DESC);
CREATE INDEX idx_sessions_site ON sessions(site_id);
CREATE INDEX idx_sessions_active ON sessions(status) WHERE status = 'ACTIVE';

-- NETWORK USAGE
CREATE TABLE network_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  download_mb     DECIMAL(15, 2) NOT NULL DEFAULT 0,
  upload_mb       DECIMAL(15, 2) NOT NULL DEFAULT 0,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_session ON network_usage(session_id);
CREATE INDEX idx_usage_recorded ON network_usage(recorded_at DESC);