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

    // Pata session pamoja na code ya voucher
    const sessionResult = await client.query(
      `SELECT s.id, s.voucher_id, s.mikrotik_session_id, s.status, s.login_at, v.code AS voucher_code 
       FROM sessions s 
       JOIN vouchers v ON v.id = s.voucher_id 
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

    // ============================================================
    // Tuma amri kwenye MikroTik kumtoa mteja na kuzima user wake
    // ============================================================
    if (session.mikrotik_session_id) {
      try {
        // 1. Mtoe kwenye Active
        await mikrotikClient.disconnectHotspotSession(
          session.mikrotik_session_id,
        );

        // 2. Zima user ili asirudi kwa cookie
        await mikrotikClient.disableHotspotUser(session.voucher_code);

        console.log(
          `✅ [MikroTik] Session ${session.mikrotik_session_id} imefutwa na user amezimwa.`,
        );
      } catch (mtErr) {
        console.error(
          `❌ [MikroTik] Imeshindwa kumtoa mteja: ${mtErr.message}`,
        );
      }
    } else {
      console.warn(
        `⚠️ [MikroTik] Session haina mikrotik_session_id, haiwezi kumtoa.`,
      );
    }

    // Hesabu muda
    const loginAt = new Date(session.login_at).getTime();
    const now = Date.now();
    const durationSeconds = Math.floor((now - loginAt) / 1000);

    // Update session
    const updateResult = await client.query(
      `UPDATE sessions
       SET status = 'DISCONNECTED', logout_at = NOW(), duration_seconds = $1, updated_at = NOW()
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

    // Fanya iwe array ikiwa sio array
    const mtSessionsArray = !mtSessions
      ? []
      : Array.isArray(mtSessions)
        ? mtSessions
        : [mtSessions];
    const mtSessionIds = mtSessionsArray.map((mt) => mt[".id"]);

    // ============================================================
    // KAZI MPYA: Futa (Funga) sessions zilizokufa kwenye Database
    // ============================================================
    const dbActiveRes = await db.query(
      "SELECT id, voucher_id, mikrotik_session_id FROM sessions WHERE status = 'ACTIVE'",
    );

    for (const dbSess of dbActiveRes.rows) {
      // Kama session hii ipo kwenye Database yetu kama ACTIVE, lakini haipo kwenye MikroTik...
      if (
        dbSess.mikrotik_session_id &&
        !mtSessionIds.includes(dbSess.mikrotik_session_id)
      ) {
        console.log(
          `⚠️ [Sync] Session ${dbSess.mikrotik_session_id} haipo MikroTik. Inafungwa...`,
        );

        // 1. Funga session kwenye Database
        await db.query(
          `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [dbSess.id],
        );

        // 2. Weka vocha kuwa USED (imekwisha kutumika)
        await db.query(
          `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [dbSess.voucher_id],
        );
      }
    }
    // ============================================================

    if (mtSessionsArray.length === 0) {
      console.log("🔄 [Sync] Hakuna active sessions kwenye MikroTik.");
      return { synced: 0 };
    }

    let syncedCount = 0;
    const sessionsArray = Array.isArray(mtSessions) ? mtSessions : [mtSessions];

    for (const mt of sessionsArray) {
      const voucherCode = mt.user;
      const mac = mt["mac-address"];
      const ip = mt.address;
      const mtId = mt[".id"];
      const uptimeStr = mt.uptime || "0s";

      if (!voucherCode) continue;

      // 2. Tafuta voucher kwenye Database yetu (Ongeza package_id na price)
      const voucherRes = await db.query(
        "SELECT id, site_id, status, package_id, price, duration_minutes FROM vouchers WHERE code = $1",
        [voucherCode],
      );

      if (voucherRes.rowCount === 0) continue;
      const voucher = voucherRes.rows[0];
      // 3. Badilisha status ya voucher kuwa ACTIVE
      if (
        voucher.status === "AVAILABLE" ||
        voucher.status === "SOLD" ||
        voucher.status === "CREATED"
      ) {
        // Kama ilikuwa AVAILABLE au CREATED, tunaandika mauzo kiotomatiki (Auto-Sale)
        if (voucher.status === "AVAILABLE" || voucher.status === "CREATED") {
          // Unda Sale
          const saleRes = await db.query(
            `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes)
             VALUES ($1, $2, $3, $4, 'Auto-sale: Mteja ameingia na vocha') RETURNING id`,
            [voucher.site_id, voucher.id, voucher.package_id, voucher.price],
          );

          // Unda Payment (Cash)
          await db.query(
            `INSERT INTO payments (sale_id, amount, method) VALUES ($1, $2, 'CASH')`,
            [saleRes.rows[0].id, voucher.price],
          );
          console.log(
            `💰 [Sync] Sale ya kiotomatiki imeundwa kwa voucher ${voucherCode}`,
          );
        }

        // Badilisha Vocha kuwa ACTIVE
        await db.query(
          `UPDATE vouchers SET status = 'ACTIVE', activated_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [voucher.id],
        );
      }

      // 4. Angalia kama session hii ipo kwenye Database
      const sessionRes = await db.query(
        `SELECT id FROM sessions WHERE mikrotik_session_id = $1`,
        [mtId],
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

      // Hesabu MB zilizotumika
      const bytesIn = parseInt(mt["bytes-in"] || 0, 10);
      const bytesOut = parseInt(mt["bytes-out"] || 0, 10);
      const dataUsedMb = (bytesIn + bytesOut) / (1024 * 1024);

      // ============================================================
      // ULINZI MPYA: Kama mteja amezidi muda, mtoe kwa nguvu!
      // ============================================================
      const totalAllowedSeconds = voucher.duration_minutes * 60;
      if (durationSeconds > totalAllowedSeconds) {
        console.log(
          `⚠️ [Sync] Mteja ${voucherCode} amezidi muda (${uptimeStr}). Tunamtoa...`,
        );

        // 1. Mtoe kwenye MikroTik
        await mikrotikClient.disconnectHotspotSession(mtId);

        // 2. Funga session kwenye Database
        const existingSession = await db.query(
          `SELECT id FROM sessions WHERE mikrotik_session_id = $1 OR (mac_address = $2 AND status = 'ACTIVE')`,
          [mtId, mac],
        );

        if (existingSession.rowCount > 0) {
          await db.query(
            `UPDATE sessions SET status = 'EXPIRED', duration_seconds = $1, logout_at = NOW() WHERE id = $2`,
            [durationSeconds, existingSession.rows[0].id],
          );
        }

        // 3. Badilisha vocha kuwa USED (imeisha)
        await db.query(
          `UPDATE vouchers SET status = 'USED', used_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [voucher.id],
        );

        continue; // Ruka hatua zingine za kumuweka ACTIVE
      }
      // ============================================================

      if (sessionRes.rowCount === 0) {
        // 5. Kama haipo kwenye Database, tunaifuta ile ya zamani yenye MAC hii (kama ipo) ili kuepuka vurugu
        await db.query(
          `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW() WHERE mac_address = $1 AND status = 'ACTIVE'`,
          [mac],
        );
        // 6. Ingiza Session mpya (Tumia ::int na ::numeric kulazimisha aina sahihi za data)
        await db.query(
          `INSERT INTO sessions (site_id, voucher_id, mikrotik_session_id, ip_address, mac_address, status, login_at, duration_seconds, data_used_mb)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW() - ($6::int * INTERVAL '1 second'), $6::int, $7::numeric)`,
          [
            voucher.site_id,
            voucher.id,
            mtId,
            ip,
            mac,
            durationSeconds,
            dataUsedMb,
          ],
        );
        console.log(
          `✅ [Sync] Session mpya imeundwa kwenye Database kwa voucher ${voucherCode}`,
        );
        syncedCount++;
      } else {
        // 7. Kama ipo, update muda na data iliyotumika
        await db.query(
          `UPDATE sessions SET duration_seconds = $1::int, data_used_mb = $2::numeric, status = 'ACTIVE', updated_at = NOW() WHERE id = $3`,
          [durationSeconds, dataUsedMb, sessionRes.rows[0].id],
        );
        console.log(
          `✅ [Sync] Session ya voucher ${voucherCode} ime-update muda wake.`,
        );
      }
    }
    console.log(
      `🔄 [Sync] Imemaliza. Sessions mpya zilizoongezwa: ${syncedCount}`,
    );
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
