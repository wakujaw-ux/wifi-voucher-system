const db = require("../config/database");
const mikrotikClient = require("./mikrotik/mikrotik.client");

// ============================================================
// GET ACTIVE SESSIONS (Kwa ajili ya Frontend)
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
// GET ALL SESSIONS (History)
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

    const sessionResult = await client.query(
      `SELECT s.id, s.voucher_id, s.mikrotik_session_id, s.status, s.login_at, v.code AS voucher_code 
       FROM sessions s JOIN vouchers v ON v.id = s.voucher_id 
       WHERE s.id = $1 FOR UPDATE`,
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

    if (session.mikrotik_session_id) {
      try {
        await mikrotikClient.disconnectHotspotSession(
          session.mikrotik_session_id,
        );
        await mikrotikClient.disableHotspotUser(session.voucher_code);
        console.log(`✅ [MikroTik] Session imefutwa na user amezimwa.`);
      } catch (mtErr) {
        console.error(
          `❌ [MikroTik] Imeshindwa kumtoa mteja: ${mtErr.message}`,
        );
      }
    }

    const loginAt = new Date(session.login_at).getTime();
    const now = Date.now();
    const durationSeconds = Math.floor((now - loginAt) / 1000);

    const updateResult = await client.query(
      `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW(), duration_seconds = $1, updated_at = NOW() WHERE id = $2 RETURNING id, voucher_id, status, login_at, logout_at, duration_seconds`,
      [durationSeconds, id],
    );

    await client.query(
      `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'ACTIVE'`,
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
    FROM sessions ${whereSql}
  `;
  const result = await db.query(sql, params);
  return result.rows[0];
};

// ============================================================
// FORCE EXPIRE (Inatumika na Background Job)
// ============================================================
const expireStaleSessions = async () => {
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

  if (result.rowCount > 0) {
    const voucherIds = result.rows.map((r) => r.voucher_id);
    await db.query(
      `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = ANY($1) AND status = 'ACTIVE'`,
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
    // 1. KAZI YA USALAMA: Futa sessions zote ACTIVE ambazo muda wake umekwisha (DB pekee)
    // ============================================================
    // 1. KAZI YA USALAMA: Futa sessions ACTIVE zilizokwisha muda NA uweke vocha kuwa USED
    // ============================================================
    const expiredSessions = await db.query(`
      UPDATE sessions
      SET status = 'EXPIRED', logout_at = NOW(), updated_at = NOW()
      WHERE status = 'ACTIVE'
        AND (NOW() - login_at) > (
          SELECT (v.duration_minutes || ' minutes')::interval
          FROM vouchers v WHERE v.id = sessions.voucher_id
        )
      RETURNING voucher_id
    `);

    if (expiredSessions.rowCount > 0) {
      const vIds = expiredSessions.rows.map((r) => r.voucher_id);
      // HAPA NDIO TUNABADILISHA VOCHA KUWA USED
      await db.query(
        `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = ANY($1) AND status = 'ACTIVE'`,
        [vIds],
      );
      console.log(
        `⚠️ [Sync] Vocha ${expiredSessions.rowCount} zimeisha muda na kuwekwa USED.`,
      );
    }
    // ============================================================

    // 2. Pata active sessions kutoka MikroTik
    const mtSessions = await mikrotikClient.getActiveHotspotSessions();
    const mtSessionsArray = !mtSessions
      ? []
      : Array.isArray(mtSessions)
        ? mtSessions
        : [mtSessions];
    const mtSessionIds = mtSessionsArray.map((mt) => mt[".id"]);

    // 3. Futa sessions zilizokufa kwenye MikroTik (Zombie Killer)
    const dbActiveRes = await db.query(
      "SELECT id, voucher_id, mikrotik_session_id FROM sessions WHERE status = 'ACTIVE'",
    );
    for (const dbSess of dbActiveRes.rows) {
      if (
        !dbSess.mikrotik_session_id ||
        !mtSessionIds.includes(dbSess.mikrotik_session_id)
      ) {
        await db.query(
          `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [dbSess.id],
        );
        await db.query(
          `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [dbSess.voucher_id],
        );
      }
    }

    if (mtSessionsArray.length === 0) return { synced: 0 };

    let syncedCount = 0;

    // 4. Sindika sessions zilizopo kwenye MikroTik
    for (const mt of mtSessionsArray) {
      try {
        const voucherCode = mt.user;
        const mac = mt["mac-address"];
        const ip = mt.address;
        const mtId = mt[".id"];
        const uptimeStr = mt.uptime || "0s";

        if (!voucherCode) continue;

        const voucherRes = await db.query(
          "SELECT id, site_id, status, package_id, price, duration_minutes FROM vouchers WHERE code = $1",
          [voucherCode],
        );
        if (voucherRes.rowCount === 0) continue;
        const voucher = voucherRes.rows[0];

        // Auto-Sale na Update Vocha
        if (["AVAILABLE", "SOLD", "CREATED"].includes(voucher.status)) {
          if (["AVAILABLE", "CREATED"].includes(voucher.status)) {
            const saleRes = await db.query(
              `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes) VALUES ($1, $2, $3, $4, 'Auto-sale: Mteja ameingia') RETURNING id`,
              [voucher.site_id, voucher.id, voucher.package_id, voucher.price],
            );
            await db.query(
              `INSERT INTO payments (sale_id, amount, method) VALUES ($1, $2, 'CASH')`,
              [saleRes.rows[0].id, voucher.price],
            );
            console.log(
              `💰 [Sync] Sale ya kiotomatiki imeundwa kwa voucher ${voucherCode}`,
            );
          }
          await db.query(
            `UPDATE vouchers SET status = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [voucher.id],
          );
        }

        // Hesabu muda
        let mtDurationSeconds = 0;
        const match = uptimeStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
        if (match) {
          mtDurationSeconds =
            parseInt(match[1] || 0, 10) * 3600 +
            parseInt(match[2] || 0, 10) * 60 +
            parseInt(match[3] || 0, 10);
        }

        const bytesIn = parseInt(mt["bytes-in"] || 0, 10);
        const bytesOut = parseInt(mt["bytes-out"] || 0, 10);
        const dataUsedMb = (bytesIn + bytesOut) / (1024 * 1024);

        const sessionRes = await db.query(
          `SELECT id, login_at FROM sessions WHERE mikrotik_session_id = $1`,
          [mtId],
        );

        // Chukua muda wa Database (saa halisi) kama session ipo
        let finalDurationSeconds = mtDurationSeconds;
        if (sessionRes.rowCount > 0) {
          const loginAt = new Date(sessionRes.rows[0].login_at).getTime();
          finalDurationSeconds = Math.floor((Date.now() - loginAt) / 1000);
        }

        const totalAllowedSeconds = voucher.duration_minutes * 60;

        // Ulinzi: Mteja amezidi muda?
        if (finalDurationSeconds > totalAllowedSeconds) {
          console.log(
            `⚠️ [Sync] Mteja ${voucherCode} amezidi muda. Tunamtoa...`,
          );
          await mikrotikClient.disconnectHotspotSession(mtId);

          if (sessionRes.rowCount > 0) {
            await db.query(
              `UPDATE sessions SET status = 'EXPIRED', duration_seconds = $1, logout_at = NOW() WHERE id = $2`,
              [finalDurationSeconds, sessionRes.rows[0].id],
            );
          }
          await db.query(
            `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [voucher.id],
          );
          continue;
        }

        // Ingiza au Update Session
        if (sessionRes.rowCount === 0) {
          await db.query(
            `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW() WHERE mac_address = $1 AND status = 'ACTIVE'`,
            [mac],
          );
          await db.query(
            `INSERT INTO sessions (site_id, voucher_id, mikrotik_session_id, ip_address, mac_address, status, login_at, duration_seconds, data_used_mb) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW() - ($6::int * INTERVAL '1 second'), $6::int, $7::numeric)`,
            [
              voucher.site_id,
              voucher.id,
              mtId,
              ip,
              mac,
              mtDurationSeconds,
              dataUsedMb,
            ],
          );
          console.log(
            `✅ [Sync] Session mpya imeundwa kwa voucher ${voucherCode}`,
          );
          syncedCount++;
        } else {
          await db.query(
            `UPDATE sessions SET duration_seconds = $1::int, data_used_mb = $2::numeric, status = 'ACTIVE', updated_at = NOW() WHERE id = $3`,
            [finalDurationSeconds, dataUsedMb, sessionRes.rows[0].id],
          );
        }
      } catch (loopErr) {
        console.error(
          `❌ [Sync] Imeshindwa kusindika mteja ${mt.user || "Unknown"}:`,
          loopErr.message,
        );
      }
    }

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
  getSessionStats,
  expireStaleSessions,
  disconnectSession,
  syncActiveSessionsFromMikroTik,
};
