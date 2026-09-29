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
    }
}