-- ============================================================
-- Seed: 001_initial_data
-- Purpose: Data ya kuanzia — site, admin, packages, settings
-- ============================================================

-- SITE YA KWANZA
INSERT INTO sites (id, name, code, address, is_active) VALUES
('11111111-1111-1111-1111-111111111111',
 'Site ya Kwanza',
 'SITE-A',
 'Dar es Salaam, Tanzania',
 TRUE);

-- ADMIN WA KWANZA
-- Password: Admin@2025!  (bcrypt hash)
INSERT INTO users (id, site_id, username, email, full_name, password_hash, role, is_active) VALUES
('22222222-2222-2222-2222-222222222222',
 '11111111-1111-1111-1111-111111111111',
 'admin',
 'admin@wifibusiness.local',
 'Msimamizi Mkuu',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'SUPER_ADMIN',
 TRUE);

-- PACKAGES ZA MWANZO
INSERT INTO packages (site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, device_limit, is_active)
VALUES
('11111111-1111-1111-1111-111111111111', '1 Hour',   'Muda wa saa moja',      500,   60,   30, 5,  1, TRUE),
('11111111-1111-1111-1111-111111111111', '3 Hours',  'Muda wa saa tatu',      1200,  180,  30, 5,  1, TRUE),
('11111111-1111-1111-1111-111111111111', '6 Hours',  'Muda wa saa sita',      2000,  360,  30, 8,  1, TRUE),
('11111111-1111-1111-1111-111111111111', '12 Hours', 'Muda wa saa kumi na mbili', 3000, 720, 30, 8, 1, TRUE),
('11111111-1111-1111-1111-111111111111', '24 Hours', 'Muda wa siku moja',     5000,  1440, 30, 10, 1, TRUE);

-- SETTINGS ZA MSINGI
INSERT INTO settings (key, value, description) VALUES
('business_name',        'WIFI BUSINESS',           'Jina la biashara linaonekana kwenye portal'),
('support_phone',        '0700000000',              'Namba ya msaada kwa wateja'),
('currency',             'TZS',                     'Sarafu inayotumika'),
('voucher_prefix',       'WIFI',                    'Prefix ya voucher codes'),
('voucher_code_length',  '6',                       'Urefu wa voucher code'),
('session_check_interval','60',                     'Sekunde kati ya kila sync na MikroTik');