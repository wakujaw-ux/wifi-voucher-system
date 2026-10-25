const { startSessionExpiryJob } = require("./sessionExpiry.job");
const { startVoucherExpiryJob } = require("./voucherExpiry.job");
const { startMikrotikSyncRetryJob } = require("./mikrotikSyncRetry.job");
const cron = require("node-cron");
const sessionService = require("../services/session.service");

const startAllJobs = () => {
  console.log("\n Starting background jobs...\n");

  // Usianzishe jobs kwenye test environment
  if (process.env.NODE_ENV === "test") {
    console.log(" Jobs skipped (test environment)\n");
    return;
  }

  startSessionExpiryJob();
  startVoucherExpiryJob();
  startMikrotikSyncRetryJob();

  console.log("\n All background jobs started\n");

  // Sync Sessions kila dakika 1
  cron.schedule("* * * * *", async () => {
    try {
      await sessionService.syncActiveSessionsFromMikroTik();
    } catch (err) {
      console.error("❌ [Job:SessionSync] Error:", err.message);
    }
  });
  console.log("📅 [Job:SessionSync] Scheduled (every 1 minute)");
};

module.exports = { startAllJobs };
