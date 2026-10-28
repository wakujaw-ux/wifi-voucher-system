const db = require("../config/database");
const mikrotikClient = require("./mikrotik/mikrotik.client");

// ============================================================
// GET ACTIVE SESSIONS (Waliopo online sasa hivi)
// ============================================================
const getActiveSessions = async (filters = {}) => {
  const { site_id, limit = 100, offset = 0 } = filters;

  let sql = `
    SELECT 
      s.id, s.site_id, s.voucher_id, s.mikrotik_session_id, s.ip_address, s.mac_address,
      s.status, s.login_at, s.duration_seconds, s.data_used_mb,
      v.code AS voucher_code, 
      v.duration_minutes AS voucher_duration_minutes,
      v.activated_at AS voucher_activated_at,
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

  // Hesabu muda kwa kutumia activated_at (Muda halisi wa kuanza kutumia vocha)
  const sessions = result.rows.map((s) => {
    const startTime = new Date(s.voucher_activated_at || s.login_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
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
// GET ALL SESSIONS (Historia - DISCONNECTED, EXPIRED, ACTIVE)
// ============================================================
const getAllSessions = async (filters = {}) => {
  const { site_id, limit = 100, offset = 0 } = filters;
  let sql = `
    SELECT s.*, v.code AS voucher_code, p.name AS package_name 
    FROM sessions s 
    JOIN vouchers v ON v.id = s.voucher_id 
    JOIN packages p ON p.id = v.package_id
    WHERE 1=1
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
  return { sessions: result.rows, count: result.rowCount };
};

const getSessionById = async (id) => {
  const result = await db.query(`SELECT * FROM sessions WHERE id = $1`, [id]);
  if (result.rowCount === 0) throw new Error("Session haipo");
  return result.rows[0];
};

const getSessionStats = async (filters = {}) => {
  const result = await db.query(`
    SELECT 
      COUNT(*)::int AS total_sessions,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_sessions,
      COUNT(*) FILTER (WHERE status = 'EXPIRED')::int AS expired_sessions,
      COUNT(*) FILTER (WHERE status = 'DISCONNECTED')::int AS disconnected_sessions,
      COALESCE(AVG(duration_seconds), 0)::int AS avg_duration_seconds
    FROM sessions
  `);
  return result.rows[0];
};

// ============================================================
// MANUAL DISCONNECT (Mteja ameondolewa na Admin/WinBox)
// ============================================================
const disconnectSession = async (id, userId, reason) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query(
      `SELECT s.*, v.code AS voucher_code FROM sessions s JOIN vouchers v ON v.id = s.voucher_id WHERE s.id = $1 FOR UPDATE`,
      [id],
    );

    if (sessionResult.rowCount === 0) throw new Error("Session haipo");
    const session = sessionResult.rows[0];

    // 1. Mtoe kwenye MikroTik Active (lakini USIMZIMIE Vocha)
    if (session.mikrotik_session_id) {
      try {
        await mikrotikClient.disconnectHotspotSession(
          session.mikrotik_session_id,
        );
      } catch (err) {
        console.error("MikroTik Disconnect Error:", err.message);
      }
    }

    const durationSeconds = Math.floor(
      (Date.now() - new Date(session.login_at).getTime()) / 1000,
    );

    // 2. Funga Session kwenye Database kuwa DISCONNECTED
    await client.query(
      `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW(), duration_seconds = $1 WHERE id = $2`,
      [durationSeconds, id],
    );

    // KUMBUKA: Hatuweki vocha kuwa USED hapa. Vocha inabaki ACTIVE hadi muda wake uishe!

    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// SYNC SESSIONS KUTOKA MIKROTIK NA DATABASE (Nguzo Kuu)
// ============================================================
const syncActiveSessionsFromMikroTik = async () => {
  try {
    // ============================================================
    // 1. KAZI MPYA: Badilisha DISCONNECTED kuwa EXPIRED kama muda umeisha
    // ============================================================
    const expiredDisconnected = await db.query(`
      UPDATE sessions s
      SET status = 'EXPIRED', updated_at = NOW()
      FROM vouchers v
      WHERE s.voucher_id = v.id
        AND s.status = 'DISCONNECTED'
        AND (NOW() - COALESCE(v.activated_at, s.login_at)) >= (v.duration_minutes || ' minutes')::interval
      RETURNING s.id, s.voucher_id
    `);

    if (expiredDisconnected.rowCount > 0) {
      const vIds = expiredDisconnected.rows.map((r) => r.voucher_id);
      // Weka Vocha kuwa USED
      await db.query(
        `UPDATE vouchers SET status = 'USED', used_at = NOW() WHERE id = ANY($1) AND status IN ('ACTIVE', 'AVAILABLE')`,
        [vIds],
      );
      console.log(
        `⏰ [Sync] Vocha ${expiredDisconnected.rowCount} zilizokuwa DISCONNECTED zimeisha muda na kuwekwa EXPIRED/USED.`,
      );
    }

    // ============================================================
    // 2. Vuta data kutoka MikroTik
    // ============================================================
    const mtSessions = await mikrotikClient.getActiveHotspotSessions();
    const mtSessionsArray = !mtSessions
      ? []
      : Array.isArray(mtSessions)
        ? mtSessions
        : [mtSessions];
    const mtSessionIds = mtSessionsArray.map((mt) => mt[".id"]);

    // 3. Vuta Sessions zote zilizo ACTIVE kwenye Database
    const dbActiveRes = await db.query(`
      SELECT s.id, s.voucher_id, s.mikrotik_session_id, s.login_at, 
             v.code, v.duration_minutes, v.activated_at 
      FROM sessions s JOIN vouchers v ON v.id = s.voucher_id 
      WHERE s.status = 'ACTIVE'
    `);

    // ==========================================
    // HATUA A: Kagua Sessions za Database (Zilizo ACTIVE)
    // ==========================================
    for (const dbSess of dbActiveRes.rows) {
      const startTime = new Date(
        dbSess.activated_at || dbSess.login_at,
      ).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const totalAllowedSeconds = parseInt(dbSess.duration_minutes, 10) * 60;

      // 1. Kama Muda Umekwisha (EXPIRY)
      if (elapsedSeconds >= totalAllowedSeconds) {
        console.log(
          `⏰ [Sync] Muda wa vocha ${dbSess.code} umekwisha. Tunamtoa MikroTik...`,
        );

        if (dbSess.mikrotik_session_id) {
          try {
            await mikrotikClient.disconnectHotspotSession(
              dbSess.mikrotik_session_id,
            );
            await mikrotikClient.disableHotspotUser(dbSess.code);
          } catch (e) {}
        }

        await db.query(
          `UPDATE sessions SET status = 'EXPIRED', logout_at = NOW() WHERE id = $1`,
          [dbSess.id],
        );
        await db.query(
          `UPDATE vouchers SET status = 'USED', used_at = NOW() WHERE id = $1`,
          [dbSess.voucher_id],
        );
        continue;
      }

      // 2. Kama Muda Haujaisha lakini hayupo MikroTik (Kalogout kawaida)
      if (
        !dbSess.mikrotik_session_id ||
        !mtSessionIds.includes(dbSess.mikrotik_session_id)
      ) {
        console.log(
          `ℹ️ [Sync] Mteja ${dbSess.code} amedisconnect. Vocha inabaki ACTIVE.`,
        );
        await db.query(
          `UPDATE sessions SET status = 'DISCONNECTED', logout_at = NOW() WHERE id = $1`,
          [dbSess.id],
        );
        // Hapa hatugusi Vocha. Inabaki ACTIVE hadi muda uishe.
      }
    }

    // ==========================================
    // HATUA B: Kagua Sessions Mpya kutoka MikroTik
    // ==========================================
    for (const mt of mtSessionsArray) {
      const voucherCode = mt.user;
      const mtId = mt[".id"];

      const exists = dbActiveRes.rows.some(
        (s) => s.mikrotik_session_id === mtId,
      );
      if (exists) continue;

      const voucherRes = await db.query(
        `SELECT id, site_id, status, package_id, price, duration_minutes FROM vouchers WHERE code = $1`,
        [voucherCode],
      );

      if (voucherRes.rowCount > 0) {
        const voucher = voucherRes.rows[0];

        // Kama Vocha ni USED/EXPIRED lakini mtu ajaribu kuingia tena, mfukuze!
        if (voucher.status === "USED" || voucher.status === "EXPIRED") {
          console.log(
            `⛔ [Sync] Vocha ${voucherCode} imeshatumika. Tunamfukuza...`,
          );
          try {
            await mikrotikClient.disconnectHotspotSession(mtId);
          } catch (e) {}
          continue;
        }

        // Kama ni Vocha Mpya kabisa (AVAILABLE/CREATED)
        if (voucher.status === "AVAILABLE" || voucher.status === "CREATED") {
          const saleCheck = await db.query(
            `SELECT id FROM sales WHERE voucher_id = $1`,
            [voucher.id],
          );
          if (saleCheck.rowCount === 0) {
            const saleRes = await db.query(
              `INSERT INTO sales (site_id, voucher_id, package_id, amount, notes) VALUES ($1, $2, $3, $4, 'Auto-sale') RETURNING id`,
              [voucher.site_id, voucher.id, voucher.package_id, voucher.price],
            );
            await db.query(
              `INSERT INTO payments (sale_id, amount, method) VALUES ($1, $2, 'CASH')`,
              [saleRes.rows[0].id, voucher.price],
            );
          }
          // Washa Vocha na weka activated_at
          await db.query(
            `UPDATE vouchers SET status = 'ACTIVE', activated_at = NOW() WHERE id = $1`,
            [voucher.id],
          );
        }

        // Kama Vocha ni ACTIVE (Mteja amerudi)
        await db.query(
          `INSERT INTO sessions (site_id, voucher_id, mikrotik_session_id, ip_address, mac_address, status, login_at) 
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())`,
          [voucher.site_id, voucher.id, mtId, mt.address, mt["mac-address"]],
        );
        console.log(
          `✅ [Sync] Mteja ${voucherCode} ameingia. activated_at haijabadilishwa.`,
        );
      }
    }
  } catch (err) {
    console.error("❌ [Sync] Kosa la MikroTik:", err.message);
  }
};

const expireStaleSessions = async () => {
  const result = await db.query(`
    UPDATE sessions s SET status = 'EXPIRED', logout_at = NOW()
    FROM vouchers v
    WHERE s.voucher_id = v.id AND s.status = 'ACTIVE'
      AND (NOW() - COALESCE(v.activated_at, s.login_at)) > (v.duration_minutes || ' minutes')::interval
    RETURNING s.voucher_id
  `);
  if (result.rowCount > 0) {
    const vIds = result.rows.map((r) => r.voucher_id);
    await db.query(
      `UPDATE vouchers SET status = 'USED', used_at = NOW() WHERE id = ANY($1) AND status = 'ACTIVE'`,
      [vIds],
    );
  }
  return { expired_count: result.rowCount };
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
