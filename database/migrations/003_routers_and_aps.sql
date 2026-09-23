-- ============================================================
-- Migration: 003_routers_and_aps
-- Purpose:   Kuunda tables za routers na access points
-- ============================================================

-- ROUTERS
CREATE TABLE routers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  model           VARCHAR(100),
  host            VARCHAR(100) NOT NULL,
  api_port        INTEGER NOT NULL DEFAULT 8728,
  api_username    VARCHAR(100) NOT NULL,
  api_password    TEXT NOT NULL,
  hotspot_name    VARCHAR(100),
  status          device_status NOT NULL DEFAULT 'UNKNOWN',
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routers_site ON routers(site_id);
CREATE INDEX idx_routers_host ON routers(host);

-- ACCESS POINTS
CREATE TABLE access_points (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  router_id       UUID REFERENCES routers(id) ON DELETE SET NULL,
  name            VARCHAR(100) NOT NULL,
  model           VARCHAR(100),
  ip_address      VARCHAR(45),
  mac_address     VARCHAR(17),
  location        VARCHAR(200),
  status          device_status NOT NULL DEFAULT 'UNKNOWN',
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ap_site ON access_points(site_id);
CREATE INDEX idx_ap_router ON access_points(router_id);
CREATE INDEX idx_ap_mac ON access_points(mac_address);