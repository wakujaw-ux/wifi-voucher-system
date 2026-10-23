const db = require("../config/database");
const mikrotikClient = require("./mikrotik/mikrotik.client");

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
  const {
    site_id,
    voucher_id,
    status,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = filters;

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
    const err = new Error("Session haipo");
    err.code = "SESSION_NOT_FOUND";
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
    await client.query("BEGIN");

    // Pata session (FOR UPDATE)
    const sessionResult = await client.query(
      "SELECT id, voucher_id, status, login_at FROM sessions WHERE id = $1 FOR UPDATE",
      [id],
    );

    if (sessionResult.rowCount === 0) {
      const err = new Error("Session haipo");
      err.code = "SESSION_NOT_FOUND";
      err.status = 404;
      throw err;
    }

    const session = sessionResult.rows[0];

    if (session.status !== "ACTIVE") {
      const err = new Error(
        `Session haiwezi kudisconnect. Status: ${session.status}`,
      );
      err.code = "SESSION_NOT_ACTIVE";
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
      [durationSeconds, id],
    );

    // Update voucher status → USED
    await client.query(
      `UPDATE vouchers
       SET status = 'USED', used_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'ACTIVE'`,
      [session.voucher_id],
    );

    await client.query("COMMIT");

    return {
      session: updateResult.rows[0],
      reason: reason || "Manual disconnect",
      disconnected_by: userId,
    };
  } catch (err) {
    await client.query("ROLLBACK");
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

  let whereSql = "WHERE 1 = 1";
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
      [voucherIds],
    );
  }

  return { expired_count: result.rowCount };
};

// ============================================================
// SYNC ACTIVE SESSIONS KUTOKA MIKROTIK
// ============================================================
const syncActiveSessionsFromMikroTik = async () => {
  try {
    console.log(
      "🔄 [Sync] Inajaribu kusoma Active Sessions kutoka MikroTik...",
    );

    // 1. Pata active sessions kutoka MikroTik
    const mtSessions = await mikrotikClient.getActiveHotspotSessions();

    // Ongeza hii kuona data halisi inayorudi
    console.log(
      "🔄 [Sync] Data iliyopatikana kutoka MikroTik:",
      JSON.stringify(mtSessions, null, 2),
    );

    if (!mtSessions || mtSessions.length === 0) {
      console.log("🔄 [Sync] Hakuna active sessions kwenye MikroTik.");
      return { synced: 0 };
    }

    let syncedCount = 0;

    // Kama MikroTik imerudisha kitu kimoja (sio array), tunaifanya iwe array
    const sessionsArray = Array.isArray(mtSessions) ? mtSessions : [mtSessions];

    for (const mt of sessionsArray) {
      const voucherCode = mt.user; // MikroTik hutumia code kama username
      const mac = mt["mac-address"];
      const ip = mt.address;
      const mtId = mt[".id"];
      const uptimeStr = mt.uptime || "0s";

      console.log(
        `🔄 [Sync] Inachakata: Code=${voucherCode}, MAC=${mac}, IP=${ip}`,
      );

      if (!voucherCode) continue;

      // 2. Tafuta voucher kwenye Database yetu
      const voucherRes = await db.query(
        "SELECT id, site_id, status, duration_minutes FROM vouchers WHERE code = $1",
        [voucherCode],
      );

      if (voucherRes.rowCount === 0) {
        console.log(
          `⚠️ [Sync] Voucher ${voucherCode} haipo kwenye Database yetu!`,
        );
        continue;
      }

      const voucher = voucherRes.rows[0];
      console.log(
        `✅ [Sync] Voucher ${voucherCode} imepatikana Database. Status ya sasa: ${voucher.status}`,
      );

      // 3. Badilisha status ya voucher kuwa ACTIVE kama bado ni AVAILABLE/SOLD
      if (
        voucher.status === "AVAILABLE" ||
        voucher.status === "SOLD" ||
        voucher.status === "CREATED"
      ) {
        await db.query(
          `UPDATE vouchers SET status = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [voucher.id],
        );
        console.log(
          `✅ [Sync] Voucher ${voucherCode} imebadilishwa kuwa ACTIVE.`,
        );
      }

      // 4. Angalia kama session hii ipo kwenye Database
      const sessionRes = await db.query(
        `SELECT id FROM sessions WHERE mikrotik_session_id = $1 OR (mac_address = $2 AND status = 'ACTIVE')`,
        [mtId, mac],
      );

      // Hesabu muda uliotumika kwa sekunde
      let durationSeconds = 0;
      const match = uptimeStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
      if (match) {
        const h = parseInt(match[1] || 0, 10);
        const m = parseInt(match[2] || 0, 10);
        const s = parseInt(match[3] || 0, 10);
        durationSeconds = h * 3600 + m * 60 + s;
      }

      if (sessionRes.rowCount === 0) {
        // 5. Kama haipo, weka session mpya
        await db.query(
          `INSERT INTO sessions (site_id, voucher_id, mikrotik_session_id, ip_address, mac_address, status, login_at, duration_seconds)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW() - ($6 * INTERVAL '1 second'), $6)`,
          [voucher.site_id, voucher.id, mtId, ip, mac, durationSeconds],
        );
        console.log(
          `✅ [Sync] Session mpya imeundwa kwenye Database kwa voucher ${voucherCode}`,
        );
        syncedCount++;
      } else {
        // 6. Kama ipo, update muda
        await db.query(
          `UPDATE sessions SET duration_seconds = $1, updated_at = NOW() WHERE id = $2`,
          [durationSeconds, sessionRes.rows[0].id],
        );
        console.log(
          `✅ [Sync] Session ya voucher ${voucherCode} ime-update muda wake.`,
        );
      }
    }
    console.log(`🔄 [Sync] Imemaliza. Sessions zilizoongezwa: ${syncedCount}`);
    return { synced: syncedCount };
  } catch (err) {
    console.error(
      "❌ [Sync] Kuna kosa wakati wa kusoma kutoka MikroTik:",
      err.message,
    );
    return { synced: 0, error: err.message };
  }
};
module.exports = {
  getActiveSessions,
  getAllSessions,
  getSessionById,
  disconnectSession,
  getSessionStats,
  expireStaleSessions,
  syncActiveSessionsFromMikroTik,
};
