-- ============================================================
-- Migration: 001_extensions_and_enums
-- Purpose:   Install extensions na kuunda enum types
-- Author:    BUILD Tz Wifi Voucher System
-- Date:      2026-09-19
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM TYPES
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATOR'
);

CREATE TYPE voucher_status AS ENUM (
  'CREATED',
  'AVAILABLE',
  'SOLD',
  'ACTIVE',
  'USED',
  'EXPIRED',
  'REVOKED',
  'CANCELLED'
);

CREATE TYPE sync_status AS ENUM (
  'PENDING',
  'SYNCED',
  'FAILED'
);

CREATE TYPE payment_method AS ENUM (
  'CASH',
  'MPESA',
  'AIRTEL_MONEY',
  'TIGO_PESA',
  'HALOPESA',
  'BANK'
);

CREATE TYPE session_status AS ENUM (
  'ACTIVE',
  'EXPIRED',
  'DISCONNECTED',
  'TERMINATED'
);

CREATE TYPE device_status AS ENUM (
  'ONLINE',
  'OFFLINE',
  'UNKNOWN'
);

CREATE TYPE audit_action AS ENUM (
  'LOGIN', 'LOGOUT',
  'GENERATE_VOUCHERS', 'SELL_VOUCHER', 'REVOKE_VOUCHER',
  'CREATE_PACKAGE', 'UPDATE_PACKAGE', 'DELETE_PACKAGE',
  'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
  'DISCONNECT_SESSION', 'UPDATE_SETTINGS'
);