const bcrypt = require('bcryptjs');
const db = require('../config/database');

// ===================================================================
// GET ALL USERS
// ===================================================================
const getAllUsers = async (filters = {}) => {
    const { site_id, role, is_active, limit = 100, offset = 0 } = filters;

    let sql = `SELECT id, site_id, username, phone, full_name, role, is_active, last_login_at, created_at, updated_at
    FROM users
    WHERE deleted_at IS NULL`;

    const params = [];
    let paramIndex = 1;

    if (site_id) {
        sql += `AND site_id = $${paramIndex}`;
        params.push(site_id);
        paramIndex++;
    }

    if (role) {
        sql += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
    }

    if (is_active !== undefined) {
        sql += `AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(sql, params);
    return { users: result.rows, count: result.rowCount };
};

// ===========================================================
// GET USER BY ID
// ===========================================================
const getUserById = async (id) => {
    const sql = `SELECT id, site_id, username, email, phone, full_name, role, is_active, last_login_at, created_at, updated_at
    FROM users
    WHERE id = $1 AND deleted_at IS NULL`;

    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
        const err = new Error('User hayupo');
        err.code = 'USER_NOT_FOUND';
        err.status = 404;
        throw err;
    }

    return result.rows[0];
};

// ===============================================================
// CREATE USER
// ===============================================================
const createUser = async (Data, createdById) => {
    const { site_id, username, email, phone, full_name, password, role } = Data;

    // Angalia kama username au email inatumika
    const existing = await db.query('SELECT id, username, email FROM users WHERE (username = $1 OR email = $2) AND deleted_at IS NULL',
        [username, email || null]
    );

    if (existing.rowCount > 0) {
        const err = new Error('Username au email imetumika');
        err.code = 'USER_EXISTS';
        err.status = 409;
        throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `INSERT INTO users (site_id, username, email, phone, full_name, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, &7, TRUE)
    RETURNING id, site_id, username, email, phone, full_name, role, is_active, created_at`;

    const params = [ site_id || null, username, email || null, phone || null, full_name, passwordHash, role || 'OPERATOR',];

    const result = await db.query(sql, params);
    return result.rows[0];
};

// ========================================================
// UPDATE USER (bila password)
// ========================================================
const updateUser = async (id, data) => {
    await getUserById(id); // Angalia user kama yupo

    const allowedFields = ['site_id', 'email', 'phone', 'full_name', 'role', 'is_active'];
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
        err.status = 400;
        throw err;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE users 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, site_id, username, email, phone, full_name, role, is_active, updated_at`;

    const result = await db.query(sql, params);
    return result.rows[0];
};

// ================================================================
// CHANGE PASSWORD ( SELF AU ADMIN)
// ================================================================
const changePassword = async (id, newPassword) => {
     await getUserById(id);

     const passwordHash = await bcrypt.hash(newPassword, 10);
    
     const sql = ` UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, username, updated_at`;

     const result = await db.query(sql, [passwordHash, id]);
     return result.rows[0];
};

// =========================================================
// DELETE USER (self delete)
// =========================================================
const deleteUser = async (id, cerrentUserId) => {
    if (id === cerrentUserId) {
        const err = new Error('Hauwezi kujifuta mwenyewe');
        err.code = 'CANNOT_DELETE_SELF';
        err.status = 400;
        throw err;
    }

    await getUserById(id);

    const sql = `UPDATE users
    SET deleted_at = NOW(), is_active = FALSE, updated_at = NOW()
    WHERE id = $1
    RETURNING id, username`;

    const result = await db.query(sql, [id]);
    return result.rows[0];
};

module.exports = { getAllUsers, getUserById, createUser, updateUser,changePassword, deleteUser, };
