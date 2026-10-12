const cron = require("node-cron");
const db = require("../config/database");
const hotspotService = require("../services/mikrotik/hotspot.service");

// ============================================================
// RETRY SYNC FAILED VOUCHERS
// ============================================================
const retryFailedSyncs = async () => {
  const startTime = Date.now();

  try {
    // Pata vouchers ambazo hazijasync (max 100 kwa batch)
    const sql = `
      SELECT id, code, duration_minutes, package_id
      FROM vouchers
      WHERE mikrotik_sync = 'FAILED'
        AND status IN ('CREATED', 'AVAILABLE')
      ORDER BY created_at ASC
      LIMIT 100
    `;

    const result = await db.query(sql);

    if (result.rowCount === 0) {
      return {
        attempted: 0,
        synced: 0,
        failed: 0,
        duration_ms: Date.now() - startTime,
      };
    }

    let synced = 0;
    let failed = 0;

    for (const voucher of result.rows) {
      const syncResult = await hotspotService.syncVoucherToHotspot(voucher);

      if (syncResult.success) {
        await db.query(
          `UPDATE vouchers
           SET mikrotik_sync = 'SYNCED', mikrotik_user = $1, status = 'AVAILABLE', updated_at = NOW()
           WHERE id = $2`,
          [voucher.code, voucher.id],
        );
        synced++;
      } else {
        failed++;
      }
    }

    return {
      attempted: result.rowCount,
      synced,
      failed,
      duration_ms: Date.now() - startTime,
    };
  } catch (err) {
    console.error("❌ [Job:MikroTikSyncRetry] Error:", err.message);
    throw err;
  }
};

const startMikrotikSyncRetryJob = () => {
  // Kila dakika 10
  cron.schedule("*/10 * * * *", async () => {
    console.log(
      "⏰ [Job:MikroTikSyncRetry] Started at",
      new Date().toISOString(),
    );

    try {
      const result = await retryFailedSyncs();

      if (result.attempted > 0) {
        console.log(
          `✅ [Job:MikroTikSyncRetry] Attempted ${result.attempted}, synced ${result.synced}, failed ${result.failed} (${result.duration_ms}ms)`,
        );
      } else {
        console.log(
          `✅ [Job:MikroTikSyncRetry] No failed vouchers to retry (${result.duration_ms}ms)`,
        );
      }
    } catch (err) {
      console.error("❌ [Job:MikroTikSyncRetry] Error:", err.message);
    }
  });

  console.log("📅 [Job:MikroTikSyncRetry] Scheduled (every 10 minutes)");
};

module.exports = { startMikrotikSyncRetryJob, retryFailedSyncs };
