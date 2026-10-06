const client = require('./mikrotik.client');
const config = require('../../config/mikrotik');

// ====================================================================
// SYNC VOUCHER -> HOTSPOT USER
// ====================================================================
const syncVoucherToHotspot = async (voucher) => {
    const userData = {
        name: voucher.code,
        password: voucher.code,
        profile: config.defaultProfile,
        limitUptime: `${ voucher.duration_minutes}m`,
        comment: `Voucher ${voucher.code} | package ${voucher.package_id}`,
    };

    try {
         const user = await client.createHotspotUser(userData);
         return { success: true, user};
    } catch (err) {
        return { success: false, error: err.message, code: err.code };
    }
};

// ================================================================
// REMOVE VOUCHER FROM HOTSPOT
// ================================================================
const removeVoucherFromHotspot = async (code) => {
    try {
        await client.removeHotspotUser(code);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message, code: err.code };
    }
};

// =====================================================================
// GET ACTIVE SESSIONS FROM HOTSPOT
// =====================================================================
const getActiveSessions = async () => {
    return client.getActiveHotspotSessions();
};

// ==============================================================
// DISCONNECT A SESSION
// ==============================================================
const disconnectSession = async (sessionId) => {
    return client.disconnectHotspotSession(sessionId);
};

// ==============================================================
// GET ALL HOTSPOT USERS
// ==============================================================
const getAllHotspotUsers = async () => {
    return client.getHotspotUsers();
};

module.exports = {
    syncVoucherToHotspot, removeVoucherFromHotspot, getActiveSessions, disconnectSession, getAllHotspotUsers,
};