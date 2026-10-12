const { startSessionExpiryJob } = require('./sessionExpiry.job');
const { startVoucherExpiryJob } = require('./voucherExpiry.job');
const { startMikrotikSyncRetryJob } = require('./mikrotikSyncRetry.job');

const startAllJobs = () => {
    console.log('\n Starting background jobs...\n');

    // Usianzishe jobs kwenye test environment
    if (process.env.NODE_ENV === 'test') {
        console.log(' Jobs skipped (test environment)\n');
        return;
    }

    startSessionExpiryJob();
    startVoucherExpiryJob();
    startMikrotikSyncRetryJob();

    console.log('\n All background jobs started\n');
};

module.exports = { startAllJobs };