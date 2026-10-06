const db = require('../config/database');
const { generateBulkCodes } = require('../utils/voucherCode');
const hotspotService = require('./mikrotik/hotspot.service');

// ============================================================
// GENERATE VOUCHERS (Batch + Vouchers)
// ============================================================
const generateVouchers = async (data, userId) => {
  const { site_id, package_id, quantity, prefix, notes } = data;

  // 1. Angalia package ipo
  const pkgResult = await db.query(
    'SELECT id, site_id, name, price, duration_minutes, validity_days, speed_limit_mbps FROM packages WHERE id = $1 AND deleted_at IS NULL',
    [package_id]
  );

  if (pkgResult.rowCount === 0) {
    const err = new Error('Package haipo');
    err.code = 'PACKAGE_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const pkg = pkgResult.rows[0];

  // 2. Unda batch kwenye transaction
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 2a. Unda batch
    const batchResult = await client.query(
      `INSERT INTO voucher_batches (site_id, package_id, quantity, prefix, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, site_id, package_id, quantity, prefix, notes, created_by, created_at`,
      [site_id, package_id, quantity, prefix || null, notes || null, userId]
    );

    const batch = batchResult.rows[0];

    // 2b. Zalisha codes
    const codes = generateBulkCodes(quantity, 6);

    // 2c. Ingiza vouchers wote kwa INSERT moja (haraka)
    const values = [];
    const params = [];
    let paramIndex = 1;

    for (const code of codes) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
      params.push(
        batch.id,
        package_id,
        site_id,
        code,
        pkg.price,
        pkg.duration_minutes,
        pkg.speed_limit_mbps,
        pkg.validity_days
      );
      paramIndex += 8;
    }

    const insertSql = `
      INSERT INTO vouchers (batch_id, package_id, site_id, code, price, duration_minutes, speed_limit_mbps, validity_days)
      VALUES ${values.join(', ')}
      RETURNING id, code, status, mikrotik_sync, price, duration_minutes, speed_limit_mbps, validity_days, created_at
    `;

    const vouchersResult = await client.query(insertSql, params);

        await client.query('COMMIT');

    // Sync vouchers to MikroTik hotspot
    const syncedVouchers = [];
    for (const voucher of vouchersResult.rows) {
      const syncResult = await hotspotService.syncVoucherToHotspot(voucher);

      if (syncResult.success) {
        await db.query(
          `UPDATE vouchers
           SET mikrotik_sync = 'SYNCED', mikrotik_user = $1, status = 'AVAILABLE', updated_at = NOW()
           WHERE id = $2`,
          [voucher.code, voucher.id]
        );

        syncedVouchers.push({
          ...voucher,
          mikrotik_sync: 'SYNCED',
          mikrotik_user: voucher.code,
          status: 'AVAILABLE',
        });
      } else {
        await db.query(
          `UPDATE vouchers
           SET mikrotik_sync = 'FAILED', updated_at = NOW()
           WHERE id = $1`,
          [voucher.id]
        );

        syncedVouchers.push({
          ...voucher,
          mikrotik_sync: 'FAILED',
          error: syncResult.error,
        });
      }
    }

    return {
      batch,
      vouchers: syncedVouchers,
      synced_count: syncedVouchers.filter((v) => v.mikrotik_sync === 'SYNCED').length,
      failed_count: syncedVouchers.filter((v) => v.mikrotik_sync === 'FAILED').length,
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// GET ALL VOUCHERS
// ============================================================
const getAllVouchers = async (filters = {}) => {
  const { site_id, package_id, batch_id, status, limit = 100, offset = 0 } = filters;

  let sql = `SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, activated_at, expires_at, used_at, created_at
             FROM vouchers WHERE 1 = 1`;
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (package_id) {
    sql += ` AND package_id = $${paramIndex}`;
    params.push(package_id);
    paramIndex++;
  }

  if (batch_id) {
    sql += ` AND batch_id = $${paramIndex}`;
    params.push(batch_id);
    paramIndex++;
  }

  if (status) {
    sql += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await db.query(sql, params);

  // Count total
  const countSql = 'SELECT COUNT(*) as total FROM vouchers WHERE batch_id = $1';
  const countParams = batch_id ? [batch_id] : null;

  return {
    vouchers: result.rows,
    count: result.rowCount,
  };
};

// ============================================================
// GET VOUCHER BY ID
// ============================================================
const getVoucherById = async (id) => {
  const sql = `SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, sold_by, activated_at, expires_at, used_at, revoked_at, revoked_by, created_at
               FROM vouchers WHERE id = $1`;
  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    const err = new Error('Voucher haipo');
    err.code = 'VOUCHER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// GET VOUCHER BY CODE
// ============================================================
const getVoucherByCode = async (code) => {
  const sql = `SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, activated_at, expires_at, used_at, created_at
               FROM vouchers WHERE code = $1`;
  const result = await db.query(sql, [code]);

  if (result.rowCount === 0) {
    const err = new Error('Voucher haipo');
    err.code = 'VOUCHER_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// GET VOUCHER STATS
// ============================================================
const getVoucherStats = async (filters = {}) => {
  const { site_id, package_id } = filters;

  let sql = 'SELECT status, COUNT(*) as count FROM vouchers WHERE 1 = 1';
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (package_id) {
    sql += ` AND package_id = $${paramIndex}`;
    params.push(package_id);
    paramIndex++;
  }

  sql += ' GROUP BY status ORDER BY status';

  const result = await db.query(sql, params);

  const stats = {
    CREATED: 0,
    AVAILABLE: 0,
    SOLD: 0,
    ACTIVE: 0,
    USED: 0,
    EXPIRED: 0,
    REVOKED: 0,
    CANCELLED: 0,
    total: 0,
  };

  for (const row of result.rows) {
    stats[row.status] = parseInt(row.count, 10);
    stats.total += parseInt(row.count, 10);
  }

  return stats;
};

// ============================================================
// REVOKE VOUCHER
// ============================================================
const revokeVoucher  = async (id, userId, reason) => {
  const voucher = await getVoucherById(id);

  // Hakuna haja ya ku-revoke voucher ambayo tayari ime-revoked au ime-used au ime-expired
  if (voucher.status === 'USED' || voucher.status === 'EXPIRED') {
    const err = new Error(`Voucher haiwezi kurevoke. status: ${voucher.status}`);
    err.code = 'VOUCHER_NOT_REVOKABLE';
    err.status = 400;
    throw err;
  }

  if (voucher.status === 'REVOKED') {
    const err = new Error('Voucher tayari ime-revoked');
    err.code = 'VOUCHER_ALREADY_REVOKED';
    err.status = 400;
    throw err;
  }

  const sql = `UPDATE vouchers SET status = 'REVOKED', revoked_at = NOW(), revoked_by = $1, updated_at = NOW() WHERE id = $2 RETURNING id, code, status, revoked_at, revoked_by`;

  const result = await db.query(sql, [userId, id]);

  return result.rows[0];
};

// ============================================================
// MARK VOUCHER AS AVAILABLE (baada ya sync na Mikrotik)
// ============================================================
const markVoucherAvailable = async (id, mikrotikUser) => {
  const sql = `UPDATE vouchers
  SET status = 'AVAILABLE', mikrotik_sync = 'SYNCED', mikrotik_user = $1, updated_at = NOW()
  WHERE id = $2 AND status = 'CREATED'
   RETURNING id, code, status, mikrotik_sync, mikrotik_user`;

  const result = await db.query(sql, [mikrotikUser, id]);

  return result.rows[0];
};
  



module.exports = {
  generateVouchers,
  getAllVouchers,
  getVoucherById,
  getVoucherByCode,
  getVoucherStats,
  revokeVoucher,
  markVoucherAvailable,
};