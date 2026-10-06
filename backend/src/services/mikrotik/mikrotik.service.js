
const client = require('./mikrotik.client');

// =========================================================
// HEALTH CHECK
// ========================================================
const healthCheck = async () => {
    try {
        const info = await client.getSystemInfo();
        return {
            online: true,
            identity: info.identity,
            version: info.version,
            uptime: info.uptime,
            cpu_load: info.cpu_load,
            free_memory: info.free_memory,
            total_memory: info.total_memory,
        };
    } catch (err) {
        return {
            online: false,
            error: err.message,
        };
    }
};

// ==========================================================
// SYSTEM INF
// ==========================================================
const getSystemInfo = async () => {
    return client.getSystemInfo();
};

module.exports = { healthCheck, getSystemInfo };