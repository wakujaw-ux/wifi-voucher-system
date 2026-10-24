const client = require("./mikrotik.client");
const config = require("../../config/mikrotik");

// ====================================================================
// SYNC VOUCHER -> HOTSPOT USER
// ====================================================================
const syncVoucherToHotspot = async (voucher) => {
  const userData = {
    name: voucher.code,
    password: voucher.code,
    profile: config.defaultProfile,
    limitUptime: `${voucher.duration_minutes}m`,
    comment: `Voucher ${voucher.code} | package ${voucher.package_id}`,
  };

  try {
    const user = await client.createHotspotUser(userData);
    return { success: true, user };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  }
};

// ================================================================
// REMOVE VOUCHER FROM HOTSPOT
// ================================================================

const removeVoucherFromHotspot = async (code) => {
  try {
    // 1. Mtoe kwenye Active Sessions kwanza (kama alikuwa ameingia)
    const activeSessions = await client.getActiveHotspotSessions();
    // Tafuta session inayomilikiwa na huyu user (code)
    const session = activeSessions.find((s) => s.user === code);
    if (session) {
      await client.disconnectHotspotSession(session[".id"]);
    }

    // 2. Futa user kwenye Hotspot Users
    await client.removeHotspotUser(code);
    return { success: true };
  } catch (err) {
    // Kama user hakuwepo kwenye Hotspot Users (labda alikuwa active tu), tunaona kama ni mafanikio
    if (err.message.includes("not found") || err.code === "USER_NOT_FOUND") {
      return { success: true };
    }
    return { success: false, error: err.message };
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
  syncVoucherToHotspot,
  removeVoucherFromHotspot,
  getActiveSessions,
  disconnectSession,
  getAllHotspotUsers,
};
