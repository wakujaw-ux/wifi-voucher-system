-- ============================================================
-- Migration: 006_sales_and_payments
-- Purpose:   Kuunda tables za sales na payments
-- ============================================================

-- SALES
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  voucher_id      UUID NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  amount          DECIMAL(12, 2) NOT NULL,
  operator_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_phone  VARCHAR(20),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_site ON sales(site_id);
CREATE INDEX idx_sales_voucher ON sales(voucher_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sales_operator ON sales(operator_id);

-- PAYMENTS
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  amount          DECIMAL(12, 2) NOT NULL,
  method          payment_method NOT NULL DEFAULT 'CASH',
  reference       VARCHAR(100),
  received_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);