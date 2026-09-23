-- ============================================================
-- Migration: 002_sites_and_users
-- Purpose:   Kuunda tables za sites na users
-- ============================================================

-- SITES
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  code            VARCHAR(20) UNIQUE NOT NULL,
  address         TEXT,
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_sites_code ON sites(code);
CREATE INDEX idx_sites_active ON sites(is_active) WHERE deleted_at IS NULL;

-- USERS
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID REFERENCES sites(id) ON DELETE SET NULL,
  username        VARCHAR(50) UNIQUE NOT NULL,
  email           VARCHAR(150) UNIQUE,
  phone           VARCHAR(20),
  full_name       VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'OPERATOR',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_site ON users(site_id);
CREATE INDEX idx_users_role ON users(role);