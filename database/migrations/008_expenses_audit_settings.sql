-- ============================================================
-- Migration: 008_expenses_audit_settings
-- Purpose:   Kuunda tables za expenses, audit_logs na settings
-- ============================================================

-- EXPENSES
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID REFERENCES sites(id) ON DELETE CASCADE,
  category        VARCHAR(100) NOT NULL,
  description     TEXT,
  amount          DECIMAL(12, 2) NOT NULL,
  expense_date    DATE NOT NULL,
  recorded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_site ON expenses(site_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          audit_action NOT NULL,
  resource_type   VARCHAR(50),
  resource_id     UUID,
  details         JSONB,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  result          VARCHAR(20),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- SETTINGS
CREATE TABLE settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             VARCHAR(100) UNIQUE NOT NULL,
  value           TEXT,
  description     TEXT,
  updated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON settings(key);