const cron = require('node-cron');
const sessionService = require('../services/session.service');


// =============================================================
// SESSION EXPIRY JOB
// Inaendesha kila dakika 5
// Ina-expire sessions ambazo muda wake umekwisha
// =============================================================
const startSessionExpiryJob = () => {
    // Kila dakika 5
    cron.schedule('*/5 * * * *', async () => {
        const startTime = Date.now();
        console.log(' [Job:SessionExpiry] Started at', new Date().toISOString());

        try {
            const result = await sessionService.expireStaleSessions();
            const duration = Date.now() - startTime;

            if (result.expired_count > 0) {
                console.log(` [Job:SessionExpiry] Expired ${result.expired_count} sessions in ${duration}ms`);
            } else {
                console.log(` [Job:SessionExpiry] No sessions to expire (${duration}ms)`);
            }

            return result;
        } catch (err) {
            console.error(' [Job:SessionExpiry] Error:', err.message);
        }
    });

    console.log(' [Job:SessionExpiry] Scheduled (every 5 minutes)');
};

module.exports = { startSessionExpiryJob };