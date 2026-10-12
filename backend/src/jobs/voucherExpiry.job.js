const cron = require("node-cron");
const db = require("../config/database");

// ===================================================
// VOUCHER EXPIRY JOB
// Inaendesha kila siku saa12:00 usiku
// Ina-expire vouchers zilizopitwa na validity_day
// ======================================================
const expireVouchers = async () => {
  const startTime = Date.now();

  try {
    // Expire vouchers SOLD au ACTIVE ambazo validity_days zimepita
    const sql = ` UPDATE vouchers 
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE status IN ('SOLD', 'ACTIVE')
        AND sold_at IS NOT NULL
        AND (sold_at + (validity_days || 'days')::interval) < NOW()
        RETURNING id, code, status, sold_at, validity_days`;

    const result = await db.query(sql);
    const duration = Date.now() - startTime;

    return {
      expired_count: result.rowCount,
      vouchers: result.rows,
      duration_ms: duration,
    };
  } catch (err) {
    console.error(" [Job:VoucherExpiry] Error:", err.message);
    throw err;
  }
};

const startVoucherExpiryJob = () => {
  // Kila siku saa 12:00 usiku
  cron.schedule("0 0 * * *", async () => {
    console.log(" [Job:VoucherExpiry] Started at", new Date().toISOString());

    try {
      const result = await expireVouchers();

      if (result.expired_count > 0) {
        console.log(
          ` [Job:VoucherExpiry] Epired ${result.expired_count} vouchers in ${result.duration_ms}ms`,
        );
      } else {
        console.log(
          ` [Job:VoucherExpiry] NO vouchers to expire (${result.duration_ms}ms)`,
        );
      }
    } catch (err) {
      console.error(" [Job:VoucherExpiry] Error:", err.message);
    }
  });

  console.log(" [Job:VoucherExpiry] Scheduled (daily at midnight)");
};

module.exports = { startVoucherExpiryJob, expireVouchers };
