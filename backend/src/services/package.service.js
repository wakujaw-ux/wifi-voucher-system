const db = require('../config/database');

// Pata packages zote
const getAllpackages = async (filters = {}) => {

    const { site_id, is_active } = filters;
    let sql = 'SELECT id, site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit, is_active, created_at, updated_at FROM packages WHERE deleted_at IS NULL';
    const params = [];
    let paramIndex = 1;

    if (site_id) {
        sql += `AND site_id = $${paramIndex}`;
        params.push(site_id);
        paramIndex = 1;
    }

    if (is_active !== undefined) {
        sql += `AND is_active = $${paramIndex}`;
        params.push(is_active);

        paramIndex++;
    }

    sql += 'ORDER BY price ASC';
    return result.rows;
};

// Pata package moja kwa ID
const getPackageById = async (id) => {
    const sql = 'SELECT id, site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit, is_active, created_at, updated_at FROM packages WHERE id = $1 AND deleted_at IS NULL';
    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
        const err = new Error('Package haipo');
        err.code = 'PACKAGE_NOT_FOUND';
        err.status = 404;
        throw err;
    }
    return result.rows[0];
};

//Unda package mpya
const createPackage = async (Data, userId) => {
    const { site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit } = data;

    const sql = `INSERT INTO packages (site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit, is_active, created_at`;

    const params = [site_id, name, description || null, price, duration_minutes, validity_days || 30, speed_limit_mbps || 5, data_limit_mb || null, device_limit || 1, userId];

    const result = await db.query(sql, params);
    return result.rows[0];
};

// Update package
const updatePackage = async (id, data) => {
    // Hakikisha package ipo
    await getPackageById(id);

    const allowedFields = ['name', 'description', 'price', 'duration_minutes', 'validity_days', 'speed_limit_mbps', 'data_limit_mb', 'device_limit', 'is_active'];
    const updates = [];
    const params = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updates.push(`${field} = $${paramIndex}`);
            params.push(data[field]);
            paramIndex++;
        }
    }

    if (updates.length === 0) {
        const err = new Error('Hakuna data ya kubadilisha');
        err.code = 'NO_UPDATE_DATA';
        err.status = 404;
        throw err;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE packages SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, site_id, name, description, price, duration_minutes, validity_days, speed_limit_mbps, data_limit_mb, device_limit, is_active, updated_at`;

    const result = await db.query(sql, params);
    return result.rows[0];
};

//Futa package (soft delete)
const deletePackage = async (id) => {
    await getPackageById(id);

    const sql = 'UPDATE packages SET deleted_at = NOW(), is_active = FALSE WHERE id = $1 RETURNING id, name';
    const result = await db.query(sql, [id]);
    return result.rows[0];
};

module.exports = {
    getAllpackages, getPackageById, createPackage, updatePackage, deletePackage,
};