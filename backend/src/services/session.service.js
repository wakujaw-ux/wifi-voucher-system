const db = require('../config/database');

// ============================================================
// GET ACTIVE SESSIONS
// ============================================================
const getActiveSessions = async (filters = {}) => {
  const { site_id, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT
      s.id, s.site_id, s.voucher_id, s.device_id, s.router_id,
      s.mikrotik_session_id, s.ip_address, s.mac_address,
      s.status, s.login_at, s.logout_at, s.duration_seconds,
      s.data_used_mb, s.created_at, s.updated_at,
      v.code AS voucher_code,
      v.duration_minutes AS voucher_duration_minutes,
      p.name AS package_name
    FROM sessions s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = v.package_id
    WHERE s.status = 'ACTIVE'
  `;
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND s.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  sql += ` ORDER BY s.login_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await db.query(sql, params);

  // Hesabu muda uliobaki kwa kila session
  const sessions = result.rows.map((s) => {
    const loginAt = new Date(s.login_at).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - loginAt) / 1000);
    const totalSeconds = s.voucher_duration_minutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    return {
      ...s,
      elapsed_seconds: elapsedSeconds,
      remaining_seconds: remainingSeconds,
    };
  });

  return { sessions, count: sessions.length };
};

// ============================================================
// GET ALL SESSIONS (history)
// ============================================================
const getAllSessions = async (filters = {}) => {
  const { site_id, voucher_id, status, from_date, to_date, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT
      s.id, s.site_id, s.voucher_id, s.device_id, s.router_id,
      s.mikrotik_session_id, s.ip_address, s.mac_address,
      s.status, s.login_at, s.logout_at, s.duration_seconds,
      s.data_used_mb, s.created_at, s.updated_at,
      v.code AS voucher_code,
      p.name AS package_name
    FROM sessions s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = v.package_id
    WHERE 1 = 1
  `;
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    sql += ` AND s.site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (voucher_id) {
    sql += ` AND s.voucher_id = $${paramIndex}`;
    params.push(voucher_id);
    paramIndex++;
  }

  if (status) {
    sql += ` AND s.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (from_date) {
    sql += ` AND s.login_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    sql += ` AND s.login_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  sql += ` ORDER BY s.login_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await db.query(sql, params);
  return { sessions: result.rows, count: result.rowCount };
};

// ============================================================
// GET SESSION BY ID
// ============================================================
const getSessionById = async (id) => {
  const sql = `
    SELECT
      s.id, s.site_id, s.voucher_id, s.device_id, s.router_id,
      s.mikrotik_session_id, s.ip_address, s.mac_address,
      s.status, s.login_at, s.logout_at, s.duration_seconds,
      s.data_used_mb, s.created_at, s.updated_at,
      v.code AS voucher_code,
      p.name AS package_name
    FROM sessions s
    JOIN vouchers v ON v.id = s.voucher_id
    JOIN packages p ON p.id = v.package_id
    WHERE s.id = $1
  `;
  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    const err = new Error('Session haipo');
    err.code = 'SESSION_NOT_FOUND';
    err.status = 404;
    throw err;
  }

  return result.rows[0];
};

// ============================================================
// DISCONNECT SESSION
// ============================================================
const disconnectSession = async (id, userId, reason) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Pata session (FOR UPDATE)
    const sessionResult = await client.query(
      'SELECT id, voucher_id, status, login_at FROM sessions WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (sessionResult.rowCount === 0) {
      const err = new Error('Session haipo');
      err.code = 'SESSION_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const session = sessionResult.rows[0];

    if (session.status !== 'ACTIVE') {
      const err = new Error(`Session haiwezi kudisconnect. Status: ${session.status}`);
      err.code = 'SESSION_NOT_ACTIVE';
      err.status = 400;
      throw err;
    }

    // Hesabu muda
    const loginAt = new Date(session.login_at).getTime();
    const now = Date.now();
    const durationSeconds = Math.floor((now - loginAt) / 1000);

    // Update session
    const updateResult = await client.query(
      `UPDATE sessions
       SET status = 'DISCONNECTED',
           logout_at = NOW(),
           duration_seconds = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, voucher_id, status, login_at, logout_at, duration_seconds`,
      [durationSeconds, id]
    );

    // Update voucher status → USED
    await client.query(
      `UPDATE vouchers
       SET status = 'USED', used_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'ACTIVE'`,
      [session.voucher_id]
    );

    await client.query('COMMIT');

    return {
      session: updateResult.rows[0],
      reason: reason || 'Manual disconnect',
      disconnected_by: userId,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// SESSION STATS
// ============================================================
const getSessionStats = async (filters = {}) => {
  const { site_id, from_date, to_date } = filters;

  let whereSql = 'WHERE 1 = 1';
  const params = [];
  let paramIndex = 1;

  if (site_id) {
    whereSql += ` AND site_id = $${paramIndex}`;
    params.push(site_id);
    paramIndex++;
  }

  if (from_date) {
    whereSql += ` AND login_at >= $${paramIndex}`;
    params.push(from_date);
    paramIndex++;
  }

  if (to_date) {
    whereSql += ` AND login_at <= $${paramIndex}`;
    params.push(to_date);
    paramIndex++;
  }

  const sql = `
    SELECT
      COUNT(*)::int AS total_sessions,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_sessions,
      COUNT(*) FILTER (WHERE status = 'EXPIRED')::int AS expired_sessions,
      COUNT(*) FILTER (WHERE status = 'DISCONNECTED')::int AS disconnected_sessions,
      COALESCE(SUM(data_used_mb), 0)::numeric AS total_data_mb,
      COALESCE(AVG(duration_seconds), 0)::int AS avg_duration_seconds
    FROM sessions
    ${whereSql}
  `;

  const result = await db.query(sql, params);
  return result.rows[0];
};

// ============================================================
// FORCE EXPIRE (inatumika baadaye na background job)
// ============================================================
const expireStaleSessions = async () => {
  // Pata sessions zote ACTIVE ambazo muda umekwisha
  const sql = `
    UPDATE sessions
    SET status = 'EXPIRED', logout_at = NOW(), updated_at = NOW()
    WHERE status = 'ACTIVE'
      AND (NOW() - login_at) > (
        SELECT (v.duration_minutes || ' minutes')::interval
        FROM vouchers v WHERE v.id = sessions.voucher_id
      )
    RETURNING id, voucher_id
  `;
  const result = await db.query(sql);

  // Update vouchers zao
  if (result.rowCount > 0) {
    const voucherIds = result.rows.map((r) => r.voucher_id);
    await db.query(
      `UPDATE vouchers
       SET status = 'USED', used_at = NOW(), updated_at = NOW()
       WHERE id = ANY($1) AND status = 'ACTIVE'`,
      [voucherIds]
    );
  }

  return { expired_count: result.rowCount };
};

module.exports = {
  getActiveSessions,
  getAllSessions,
  getSessionById,
  disconnectSession,
  getSessionStats,
  expireStaleSessions,
};