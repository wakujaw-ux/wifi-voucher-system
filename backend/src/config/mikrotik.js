require('dotenv').config();

module.exports = {
    mode: process.env.MIKROTIK_MODE || 'mock',
    host: process.env.MIKROTIK_HOST || '192.168.88.1',
    port: parseInt(process.env.MIKROTIK_PORT, 10) || 8728,
    username: process.env.MIKROTIK_USERNAME || 'admin',
    password: process.env.MIKROTIK_PASSWORD || '',
    hotspotName: process.env.MIKROTIK_HOTSPOT_NAME || 'hotspot1',
    defaultProfile: process.env.MIKROTIK_DEFAULT_PROFILE || 'default',
    timeout: parseInt(process.env.MIKROTIK_TIMEOUT, 10) || 5000
};