const db = require('../config/database');
const { generateBulkCodes } = require('../utils/voucherCode');

// ===============================================================
// GENERATE VOUCHERS (Batch + Vouchers)
// ===============================================================
const generateVouchers = async (Data, userId) => {
    const { site_id, package_id, quantity, prefix, notes } = Data;
    
    // 1. Angalia package ipo
    const pkgResult = await db.query(
        'SELECT id, site_id, name, price, duration_minutes, validity_days, speed_limit_mbps FROM packages WHERE id = $1 AND deleted_ at IS NULL',
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
        const batchResult = await client.query( `INSERT INTO voucher_batches (site_id, package_id, quantity, prefix, notes, created_by)
            VALUES ($1, $2, $3, $4, $5, %6)
            RETURNING id, site_id, package_id, quantity, prefix, notes, created_by, created_at`,
        [site_id, package_id, quantity, prefix || null, notes || null, userId]);

        const batch = batchResult.rows[0];

        // 2b. Zalisha codess
        const codes = generateBulkCodes(quantity, 6);

        // 2c. Ingiza vouchers wote kwa INSERT moja (haraka)
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (const code of codes) {
            values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
            params.push(batch_id, package_id, site_id, code, pkg.price, pkg.duration_minutes, pkg.speed_limit_mbps, pkg.validity_days);
            paramIndex += 8;
        }

        const insertSql = `INSERT INTO vouchers (batch_id, package_id, site_id, code, price, duration, speed_limit_mbps, validity_days)VALUES ${values.join(', ')}
        RETURNING id, code, stastus, mikrotik_sync, price, duration_minutes, speed_limit_mbps, validity_days, created_at`;

        const vouchersResult = await client.query(insertSql, params);

        await client.query('COMMIT');

        return {
            batch,
            vouchers: vouchersResult.rows,
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

//  ====================================================================
//  GET ALL VOUCHERS
//  ====================================================================
const getAllVouchers = async (filters = {}) => {
    const { site_id, package_id, batch_id, status, limit = 100, offset = 0 } = filters;

    let sql = `SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, activated_at, expires_at, used_at, created_at FROM vouchers WHERE 1 = 1`;

    const params = [];
    let paramIndex = 1;

    if (site_id) {
        sql += `AND site_id = $${paramIndex}`;
        params.push(site_id);
        paramIndex++;
    }

    if (package_id) {
        sql += `AND package_id = $${paramIndex}`;
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

    sql += `ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

//  ==========================================================
//  GET VOUCHER BY ID
//  ==========================================================
const getVoucherById = async (id) => {
    const sql = `SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, sold_by, activated_at, expires_at, used_at, revoked_at, revoked_by, created_at FROM vouchers WHERE id = $1`;

    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
        const err = new Error('Voucher haipo');
        err.code = 'VOUCHER_NOT_FOUND';
        err.status = 404;
        throw err;
    }

    return result.rows[0];
};

//  ================================================================
//  GET VOUCHER BY CODE
//  ================================================================
const getVoucherByCode = async (code) => {
    const sql = 'SELECT id, batch_id, package_id, site_id, code, status, mikrotik_sync, mikrotik_user, price, duration_minutes, speed_limit_mbps, validity_days, sold_at, activated_at, expires_at used_at, created_at FROM vouchers WHERE code = $1';

    const result = await db.query(sql, [code]);

    if (result.rowCount === 0) {
        const err = new Error('Voucher haipo');
        err.code = 'VOUCHER_NOT_FOUND';
        err.status = 404;
        throw err;
    }

    return result.rows[0];
};

//  ================================================================
//  GET VOUCHER STATUS
//  ================================================================
const getVoucherStats = async (filters = {}) => {
    const { site_id, package_id } = filters;

    let sql = 'SELECT status, COUNT(*) as count FROM vouchers WHERE 1 = 1';
    const params = [];
    let paramIndex = 1;

    if (site_id) {
        sql += `AND site_id = $${paramIndex}`;
        params.push(site_id);
        paramIndex++;
    }

    if (package_id) {
        sql += `AND package_id = $${paramIndex}`;
        params.push(package_id);
        paramIndex++;
    }

    sql += 'GROUP BY status ORDER BY status';

    const result = await db.query(sql,params);

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

module.exports = {
    generateVouchers, getAllVouchers, getVoucherById, getVoucherByCode, getVoucherStats,
};